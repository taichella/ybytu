import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Grava o parecer profissional (personal ou nutricionista) sobre o plano de
// um usuário -- um por (user_id, role), UPDATE se já existir (ver migration
// 20260728145400). reviewer_name SEMPRE vem do registro de staff resolvido
// pelo servidor, nunca do body (evita alguém assinar parecer com outro
// nome). Quando o 2º parecer completa o par (personal + nutricionista),
// dispara ybytu-send-user-whatsapp internamente (service_role) -- é isso
// que avisa o usuário que o plano está pronto.
const VALID_ROLES = new Set(['personal', 'nutricionista'])

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.reason }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const userId = typeof body?.user_id === 'string' ? body.user_id : ''
    const role = body?.role
    const reviewerCredential = typeof body?.reviewer_credential === 'string' ? body.reviewer_credential : null
    const notePtbr = typeof body?.note_ptbr === 'string' ? body.note_ptbr : null
    const trainingPlanId = typeof body?.training_plan_id === 'string' ? body.training_plan_id : null
    const mealPlanId = typeof body?.meal_plan_id === 'string' ? body.meal_plan_id : null

    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!VALID_ROLES.has(role)) {
      return new Response(JSON.stringify({ error: 'invalid_role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Só pode assinar parecer com um papel que o próprio staff realmente tem.
    if (!requireRole(auth.staff, role)) {
      return new Response(JSON.stringify({ error: 'role_not_held_by_caller' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: upsertError } = await supabase
      .from('plan_reviews')
      .upsert(
        {
          user_id: userId,
          role,
          reviewer_name: auth.staff.fullName,
          reviewer_credential: reviewerCredential,
          note_ptbr: notePtbr,
          training_plan_id: trainingPlanId,
          meal_plan_id: mealPlanId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,role' },
      )

    if (upsertError) throw new Error(`Upsert de plan_reviews falhou: ${upsertError.message}`)

    const { data: reviews, error: reviewsError } = await supabase
      .from('plan_reviews')
      .select('role')
      .eq('user_id', userId)

    if (reviewsError) throw new Error(`Lookup de plan_reviews falhou: ${reviewsError.message}`)

    const reviewedRoles = new Set((reviews ?? []).map((r) => r.role as string))
    const bothReviewed = reviewedRoles.has('personal') && reviewedRoles.has('nutricionista')

    if (bothReviewed) {
      const notifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ybytu-send-user-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('INTERNAL_FUNCTION_SECRET')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!notifyResponse.ok) {
        console.error('Falha ao notificar usuário via ybytu-send-user-whatsapp:', await notifyResponse.text())
      }
    }

    return new Response(JSON.stringify({ ok: true, both_reviewed: bothReviewed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-submit-plan-review error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
