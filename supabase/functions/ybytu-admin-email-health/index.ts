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
//
// cron_failures (2026-10-11): respostas 401/403 recebidas pelos pg_cron nas
// últimas CRON_FAILURE_WINDOW_HOURS horas (RPC cron_auth_failures). Os 3 crons
// ficaram de 30/08 a 11/10 sem autenticar e ninguém viu; como o vigia também é
// um cron, este endpoint (chamado pelo dashboard) é o caminho que não depende
// de cron. O cron é identificado pelo corpo do erro que cada function devolve.
const CRON_FAILURE_WINDOW_HOURS = 2
const CRON_BY_ERROR: Record<string, string> = {
  internal_only: 'Lembrete de parecer (hora em hora)',
  forbidden: 'Retomada do onboarding (a cada 15 min)',
  unauthorized: 'Saúde do envio de e-mail (hora em hora)',
}
function cronLabel(content: string | null): string {
  try {
    const code = JSON.parse(content ?? '')?.error
    return CRON_BY_ERROR[code] ?? 'Cron não identificado'
  } catch {
    return 'Cron não identificado'
  }
}
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

    const [health, openAlert, cronFailures] = await Promise.all([
      computeEmailHealth(supabase),
      supabase.from('system_alerts').select('id, opened_at, last_seen_at, detail').eq('kind', 'email_delivery').is('resolved_at', null).maybeSingle(),
      supabase.rpc('cron_auth_failures', { p_hours: CRON_FAILURE_WINDOW_HOURS }),
    ])
    if (openAlert.error) throw new Error(`Lookup de system_alerts falhou: ${openAlert.error.message}`)
    if (cronFailures.error) throw new Error(`Lookup de cron_auth_failures falhou: ${cronFailures.error.message}`)

    // Agrupa por cron: quantas falhas e a mais recente.
    const byCron = new Map<string, { cron: string; count: number; last_at: string; status_code: number }>()
    for (const f of (cronFailures.data ?? []) as Array<{ created: string; status_code: number; content: string | null }>) {
      const cron = cronLabel(f.content)
      const entry = byCron.get(cron) ?? { cron, count: 0, last_at: f.created, status_code: f.status_code }
      entry.count += 1
      if (f.created > entry.last_at) entry.last_at = f.created
      byCron.set(cron, entry)
    }

    return new Response(JSON.stringify({
      failure_window_hours: FAILURE_WINDOW_HOURS,
      stuck_after_hours: STUCK_AFTER_HOURS,
      open_alert: openAlert.data ?? null,
      recent_failures: health.recentFailures,
      students_without_link: health.studentsWithoutLink,
      cron_failure_window_hours: CRON_FAILURE_WINDOW_HOURS,
      cron_failures: [...byCron.values()],
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
