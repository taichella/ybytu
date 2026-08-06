import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { sendWhatsAppTemplate } from '../_shared/whatsapp.ts'

// Avisa os profissionais (personal/nutricionista) que ainda faltam dar
// parecer num plano recém-gerado. Duas formas de chamar:
// 1. O PRÓPRIO usuário, logo após o onboarding (JWT normal dele) -- só pode
//    disparar notificação sobre SI MESMO, nunca sobre outro user_id.
// 2. Chamada interna (service_role), usada pelo cron de lembrete
//    (ybytu-plan-review-reminder-cron) com { user_id, mode: 'reminder' }.
// Idempotente: 'initial' só dispara uma vez (plan_ready_notified_at), evita
// duplo-clique/retry do onboarding spammar os profissionais.
const ROLE_PHONE_ENV: Record<string, string> = {
  personal: 'PHONE_ADMIN_TRAINER',
  nutricionista: 'PHONE_ADMIN_NUTRI',
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const internalCall = isInternalServiceCall(req)
    let userId: string
    let mode: 'initial' | 'reminder'

    if (internalCall) {
      const body = await req.json().catch(() => null)
      userId = typeof body?.user_id === 'string' ? body.user_id : ''
      mode = body?.mode === 'reminder' ? 'reminder' : 'initial'
      if (!userId) {
        return new Response(JSON.stringify({ error: 'missing_user_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (!token) {
        return new Response(JSON.stringify({ error: 'missing_token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'invalid_token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = user.id
      mode = 'initial'
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, plan_generation_status, plan_ready_notified_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (profile.plan_generation_status !== 'ok') {
      return new Response(JSON.stringify({ ok: true, skipped: 'plan_not_ready' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (mode === 'initial' && profile.plan_ready_notified_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_notified' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from('plan_reviews')
      .select('role')
      .eq('user_id', userId)

    if (reviewsError) throw new Error(`Lookup de plan_reviews falhou: ${reviewsError.message}`)

    const reviewedRoles = new Set((reviews ?? []).map((r) => r.role as string))
    const missingRoles = ['personal', 'nutricionista'].filter((r) => !reviewedRoles.has(r))

    if (missingRoles.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: 'both_already_reviewed' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const templateId = Deno.env.get('WHATSAPP_TEMPLATE_STAFF_PLAN_READY') ?? ''
    const dashboardLink = `https://pro.ybytu.app/users/${userId}`
    const notifiedRoles: string[] = []

    for (const role of missingRoles) {
      const phone = Deno.env.get(ROLE_PHONE_ENV[role]) ?? ''
      if (!phone) {
        console.error(`Telefone não configurado pro papel ${role} (${ROLE_PHONE_ENV[role]})`)
        continue
      }
      const result = await sendWhatsAppTemplate(phone, templateId, [profile.full_name ?? 'aluno(a)', dashboardLink])
      if (result.ok) notifiedRoles.push(role)
      else console.error(`Falha ao notificar ${role}:`, result.error)
    }

    const updateColumn = mode === 'initial' ? 'plan_ready_notified_at' : 'plan_review_reminder_sent_at'
    await supabase.from('profiles').update({ [updateColumn]: new Date().toISOString() }).eq('id', userId)

    return new Response(JSON.stringify({ ok: true, mode, notified_roles: notifiedRoles }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-notify-plan-ready error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
