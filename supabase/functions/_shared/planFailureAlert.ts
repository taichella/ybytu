import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { escapeHtml, sendEmail, staffRecipientsForRole } from './email.ts'

// Alerta de plano não gerado (2026-10-17, decisão da Taina). Antes, uma falha
// de geração só aparecia em "Planos que falharam" para quem abrisse a tela;
// nenhum banner, nenhum e-mail. Agora:
//   - na PRIMEIRA falha de um aluno, abre um incidente em system_alerts e manda
//     UM e-mail aos admins com o motivo legível;
//   - as tentativas automáticas (cron de retomada, até 3) seguem; enquanto
//     falharem, só atualiza o incidente (sem e-mail repetido);
//   - quando uma tentativa der certo, fecha o incidente e avisa que resolveu.
// Um incidente por aluno: kind = 'plan_generation:<user_id>' (o índice único
// de system_alerts é um aberto por kind). Chamado no fim de
// runGenerationAndVerify -- todos os caminhos de geração (onboarding, retomada
// automática, retry manual) passam por lá. Best-effort: falha aqui nunca muda o
// resultado da geração.
const FAILED_PLANS_URL = 'https://pro.ybytu.app/campaign/failed-plans'
export const PLAN_ALERT_KIND_PREFIX = 'plan_generation:'

async function studentName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle()
  return (data?.full_name as string | undefined) || 'Aluno(a) sem nome'
}

async function emailAdmins(supabase: SupabaseClient, userId: string, subject: string, html: string): Promise<boolean> {
  const admins = await staffRecipientsForRole(supabase, 'admin')
  let anyOk = false
  for (const a of admins) {
    const r = await sendEmail(supabase, { userId, kind: 'admin_plan_failure_alert', to: a.email, subject, html })
    anyOk = anyOk || r.ok
  }
  return anyOk
}

export async function reportPlanGenerationOutcome(
  supabase: SupabaseClient,
  userId: string,
  outcome: { status: 'ok' | 'failed'; reason?: string; attempts?: number },
): Promise<void> {
  try {
    const kind = PLAN_ALERT_KIND_PREFIX + userId
    const now = new Date().toISOString()
    const { data: open, error } = await supabase
      .from('system_alerts').select('id').eq('kind', kind).is('resolved_at', null).maybeSingle()
    if (error) throw new Error(error.message)

    if (outcome.status === 'failed') {
      const detail = { user_id: userId, reason: outcome.reason ?? null, attempts: outcome.attempts ?? null }
      if (open) {
        await supabase.from('system_alerts').update({ last_seen_at: now, detail }).eq('id', open.id)
        return
      }
      const { data: created, error: insErr } = await supabase
        .from('system_alerts').insert({ kind, opened_at: now, last_seen_at: now, detail }).select('id').single()
      if (insErr) throw new Error(insErr.message)
      const name = await studentName(supabase, userId)
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #DC2626; border-radius: 14px;">
          <h2 style="color: #DC2626; margin: 0 0 12px;">Plano não gerado: ${escapeHtml(name)}</h2>
          <p style="color: #1A202C; font-size: 15px; margin: 0 0 8px;"><strong>Motivo:</strong> ${escapeHtml(outcome.reason ?? 'sem detalhe')}</p>
          <p style="color: #4A5568; font-size: 14px; margin: 0 0 8px;">O aluno vê "Plano em preparação" no app. O sistema tenta de novo sozinho (até 3 vezes, a cada 15 minutos); se uma tentativa der certo, você recebe outro aviso.</p>
          <p style="margin: 20px 0 0;"><a href="${FAILED_PLANS_URL}" style="display: inline-block; padding: 12px 22px; background: #DC2626; color: #FFFFFF; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver planos que falharam</a></p>
        </div>`
      const sent = await emailAdmins(supabase, userId, `⚠️ Ybytu: plano não gerado para ${name}`, html)
      if (sent) await supabase.from('system_alerts').update({ alert_email_sent_at: now }).eq('id', created.id)
      return
    }

    if (open) {
      await supabase.from('system_alerts').update({ resolved_at: now, last_seen_at: now }).eq('id', open.id)
      const name = await studentName(supabase, userId)
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #16A34A; border-radius: 14px;">
          <h2 style="color: #16A34A; margin: 0 0 12px;">Plano gerado: ${escapeHtml(name)}</h2>
          <p style="color: #4A5568; font-size: 15px;">Uma nova tentativa deu certo. O plano segue para o parecer normalmente.</p>
        </div>`
      const sent = await emailAdmins(supabase, userId, `✅ Ybytu: plano gerado para ${name}`, html)
      if (sent) await supabase.from('system_alerts').update({ resolved_email_sent_at: now }).eq('id', open.id)
    }
  } catch (err) {
    console.error('[planFailureAlert] falhou (não afeta a geração):', err)
  }
}
