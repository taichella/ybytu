import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'

// Disparado por pg_cron de hora em hora (ver migration
// 20260805_plan_review_reminder_cron.sql) -- interno, só service_role.
// Acha planos prontos há mais de 12h sem os 2 pareceres e sem lembrete
// ainda enviado, e reaproveita ybytu-notify-plan-ready (mode: 'reminder')
// pra cada um -- essa function já sabe resolver quais papéis faltam e
// marcar plan_review_reminder_sent_at (evita reenviar toda hora).
const REMINDER_THRESHOLD_HOURS = 12

serve(async (req) => {
  if (!isInternalServiceCall(req)) {
    return new Response(JSON.stringify({ error: 'internal_only' }), { status: 403 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const cutoff = new Date(Date.now() - REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString()

    const { data: overdueProfiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('plan_generation_status', 'ok')
      .lt('plan_ready_notified_at', cutoff)
      .is('user_notified_ready_at', null)
      .is('plan_review_reminder_sent_at', null)

    if (error) throw new Error(`Lookup de profiles pendentes falhou: ${error.message}`)

    const results: Array<{ user_id: string; ok: boolean }> = []
    for (const row of overdueProfiles ?? []) {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ybytu-notify-plan-ready`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: row.id, mode: 'reminder' }),
      })
      results.push({ user_id: row.id, ok: response.ok })
      if (!response.ok) console.error(`Lembrete falhou pra ${row.id}:`, await response.text())
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-plan-review-reminder-cron error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 })
  }
})
