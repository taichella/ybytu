import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

const VALID_ROLES = new Set(['admin', 'personal', 'nutricionista'])

// Pra STAFF EXISTENTE ganhar um papel a mais (ex: personal com CREF que
// também tem CRN de nutricionista). Decisão explícita: não passa por
// convite/token — caso raro, o admin já conhece a pessoa. Se o user_id não
// for staff ainda, rejeita e aponta pro convite (essa function não cria
// conta nova, só adiciona papel a quem já existe em `staff`).
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
      return new Response(
        JSON.stringify({ error: auth.reason }),
        { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!requireRole(auth.staff, 'admin')) {
      return new Response(
        JSON.stringify({ error: 'admin_only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json().catch(() => null)
    const targetUserId = typeof body?.user_id === 'string' ? body.user_id : ''
    const role = body?.role

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'missing_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!VALID_ROLES.has(role)) {
      return new Response(
        JSON.stringify({ error: 'invalid_role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: staffRow, error: staffError } = await supabase
      .from('staff')
      .select('user_id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (staffError) {
      console.error(staffError)
      return new Response(
        JSON.stringify({ error: 'staff_lookup_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!staffRow) {
      return new Response(
        JSON.stringify({
          error: 'not_staff',
          message: 'Esse usuário ainda não é staff. Crie um convite para criar a conta primeiro.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { error: insertError } = await supabase
      .from('staff_roles')
      .insert({ user_id: targetUserId, role, granted_by: auth.staff.userId })

    if (insertError) {
      // UNIQUE(user_id, role) -- já existe uma linha desse papel (ativa ou
      // revogada no passado). Se estava revogada, reativa em vez de rejeitar
      // (senão a UNIQUE trava pra sempre um papel que já foi tirado uma vez).
      if (insertError.code === '23505') {
        const { data: existing, error: lookupError } = await supabase
          .from('staff_roles')
          .select('id, revoked_at')
          .eq('user_id', targetUserId)
          .eq('role', role)
          .maybeSingle()

        if (lookupError || !existing) {
          console.error(lookupError)
          return new Response(
            JSON.stringify({ error: 'insert_failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        if (!existing.revoked_at) {
          return new Response(
            JSON.stringify({ error: 'role_already_active' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        const { error: reactivateError } = await supabase
          .from('staff_roles')
          .update({ revoked_at: null, granted_at: new Date().toISOString(), granted_by: auth.staff.userId })
          .eq('id', existing.id)

        if (reactivateError) {
          console.error(reactivateError)
          return new Response(
            JSON.stringify({ error: 'reactivate_failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        return new Response(
          JSON.stringify({ ok: true, reactivated: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      console.error(insertError)
      return new Response(
        JSON.stringify({ error: 'insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
