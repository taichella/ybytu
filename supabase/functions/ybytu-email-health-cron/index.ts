import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { escapeHtml, sendEmail, staffRecipientsForRole } from '../_shared/email.ts'
import { computeEmailHealth, hasProblem, FAILURE_WINDOW_HOURS, STUCK_AFTER_HOURS, type EmailHealth } from '../_shared/emailHealth.ts'

// Alerta de falha do caminho crítico por e-mail (2026-10-11). Disparado por
// pg_cron de hora em hora (migration 20261011150000) -- interno, só
// INTERNAL_FUNCTION_SECRET.
//
// Motivo: o WhatsApp ficou uma semana fora sem ninguém saber. Agora que o
// e-mail é o caminho único (login, link do plano, avisos ao staff), uma falha
// do Resend precisa aparecer sozinha.
//
// Um alerta por incidente (system_alerts, kind 'email_delivery'): abre na
// primeira rodada com problema e manda UM e-mail aos admins; enquanto durar,
// só atualiza last_seen_at/detail (sem e-mail de hora em hora); fecha na
// primeira rodada limpa e manda "voltou a funcionar". O aviso principal é o
// banner vermelho no dashboard -- se o próprio Resend estiver fora, o e-mail
// de alerta também não chega (e a falha dele fica registrada como as outras).
const ALERT_KIND = 'email_delivery'
const DASHBOARD_ALERTS_URL = 'https://pro.ybytu.app/campaign/email-alerts'

const KIND_LABEL: Record<string, string> = {
  user_plan_ready: 'Link do plano (aluno)',
  user_login_code: 'Código de login (aluno)',
  user_onboarding_received: 'Confirmação de onboarding (aluno)',
  staff_review_pending: 'Parecer pendente (staff)',
  staff_review_reminder: 'Lembrete de parecer (staff)',
  admin_new_onboarding: 'Novo aluno (admin)',
  admin_email_alert: 'Alerta de e-mail (admin)',
}

function summary(h: EmailHealth): string {
  const parts: string[] = []
  if (h.recentFailures.length) parts.push(`${h.recentFailures.length} envio(s) com falha nas últimas ${FAILURE_WINDOW_HOURS}h`)
  if (h.studentsWithoutLink.length) parts.push(`${h.studentsWithoutLink.length} aluno(s) com plano aprovado há mais de ${STUCK_AFTER_HOURS}h sem o link`)
  return parts.join(' e ')
}

function alertHtml(h: EmailHealth): string {
  const failures = h.recentFailures.slice(0, 10).map((f) =>
    `<li>${escapeHtml(KIND_LABEL[f.kind] ?? f.kind)} para ${escapeHtml(f.to_email)}: <code>${escapeHtml(f.error ?? 'sem detalhe')}</code></li>`).join('')
  const students = h.studentsWithoutLink.slice(0, 10).map((s) =>
    `<li>${escapeHtml(s.full_name ?? 'Aluno(a)')} (aprovado em ${new Date(s.approved_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})</li>`).join('')
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #DC2626; border-radius: 14px;">
      <h2 style="color: #DC2626; margin: 0 0 12px;">Falha no envio de e-mails da Ybytu</h2>
      <p style="color: #1A202C; font-size: 15px;">${escapeHtml(summary(h))}.</p>
      ${failures ? `<p style="margin: 16px 0 4px; font-weight: 700;">Falhas de envio</p><ul style="color: #4A5568; font-size: 14px;">${failures}</ul>` : ''}
      ${students ? `<p style="margin: 16px 0 4px; font-weight: 700;">Alunos sem o link do plano</p><ul style="color: #4A5568; font-size: 14px;">${students}</ul>` : ''}
      <p style="margin: 20px 0 0;"><a href="${DASHBOARD_ALERTS_URL}" style="display: inline-block; padding: 12px 22px; background: #DC2626; color: #FFFFFF; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver no painel</a></p>
      <p style="color: #718096; font-size: 12px; margin: 16px 0 0;">Você recebe este aviso uma vez por incidente e outro quando ele se resolver.</p>
    </div>`
}

const RESOLVED_HTML = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #16A34A; border-radius: 14px;">
    <h2 style="color: #16A34A; margin: 0 0 12px;">E-mails da Ybytu voltaram a funcionar</h2>
    <p style="color: #4A5568; font-size: 15px;">Nenhuma falha de envio nas últimas ${FAILURE_WINDOW_HOURS}h e nenhum aluno com plano aprovado sem o link.</p>
  </div>`

async function emailAdmins(supabase: any, subject: string, html: string) {
  const admins = await staffRecipientsForRole(supabase, 'admin')
  let anyOk = false
  for (const a of admins) {
    const r = await sendEmail(supabase, { userId: null, kind: 'admin_email_alert', to: a.email, subject, html })
    anyOk = anyOk || r.ok
  }
  return anyOk
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!isInternalServiceCall(req)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const health = await computeEmailHealth(supabase)
    const problem = hasProblem(health)
    const detail = {
      summary: problem ? summary(health) : null,
      failures: health.recentFailures.length,
      students_without_link: health.studentsWithoutLink.length,
    }
    const now = new Date().toISOString()

    const { data: open, error: openErr } = await supabase
      .from('system_alerts')
      .select('id')
      .eq('kind', ALERT_KIND)
      .is('resolved_at', null)
      .maybeSingle()
    if (openErr) throw new Error(`Lookup de system_alerts falhou: ${openErr.message}`)

    let action = 'none'
    if (problem && !open) {
      const { data: created, error: insErr } = await supabase
        .from('system_alerts')
        .insert({ kind: ALERT_KIND, opened_at: now, last_seen_at: now, detail })
        .select('id')
        .single()
      if (insErr) throw new Error(`Insert de system_alerts falhou: ${insErr.message}`)
      const sent = await emailAdmins(supabase, `⚠️ Ybytu: falha no envio de e-mails (${summary(health)})`, alertHtml(health))
      if (sent) await supabase.from('system_alerts').update({ alert_email_sent_at: now }).eq('id', created.id)
      action = 'opened'
    } else if (problem && open) {
      await supabase.from('system_alerts').update({ last_seen_at: now, detail }).eq('id', open.id)
      action = 'still_open'
    } else if (!problem && open) {
      await supabase.from('system_alerts').update({ resolved_at: now, last_seen_at: now, detail }).eq('id', open.id)
      const sent = await emailAdmins(supabase, '✅ Ybytu: e-mails voltaram a funcionar', RESOLVED_HTML)
      if (sent) await supabase.from('system_alerts').update({ resolved_email_sent_at: now }).eq('id', open.id)
      action = 'resolved'
    }

    return new Response(JSON.stringify({ ok: true, action, ...detail }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-email-health-cron error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
