import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'
import { computeEmailHealth, FAILURE_WINDOW_HOURS, STUCK_AFTER_HOURS } from '../_shared/emailHealth.ts'

// Saúde do envio de e-mails para o dashboard (2026-10-11): alimenta o banner
// vermelho do layout e a tela /campaign/email-alerts. Admin-only (mostra
// e-mail de aluno e de staff). Calcula na hora (mesma regra do cron,
// _shared/emailHealth.ts) e devolve também o incidente aberto em
// system_alerts, se houver -- o banner aparece se qualquer um dos dois
// indicar problema, sem esperar a próxima rodada do cron.
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
    if (!requireRole(auth.staff, 'admin')) {
      return new Response(JSON.stringify({ error: 'admin_only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [health, openAlert] = await Promise.all([
      computeEmailHealth(supabase),
      supabase.from('system_alerts').select('id, opened_at, last_seen_at, detail').eq('kind', 'email_delivery').is('resolved_at', null).maybeSingle(),
    ])
    if (openAlert.error) throw new Error(`Lookup de system_alerts falhou: ${openAlert.error.message}`)

    return new Response(JSON.stringify({
      failure_window_hours: FAILURE_WINDOW_HOURS,
      stuck_after_hours: STUCK_AFTER_HOURS,
      open_alert: openAlert.data ?? null,
      recent_failures: health.recentFailures,
      students_without_link: health.studentsWithoutLink,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-admin-email-health error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
