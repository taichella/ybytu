import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { escapeHtml, renderTemplate, sendEmail, userEmail } from './email.ts'
import { PLAN_READY_HTML } from './emailTemplates.ts'
import { getOrCreatePlanShareToken } from './planShareToken.ts'
import type { ReviewRole } from './planApproval.ts'

// E-mail "seu plano está pronto" com o link do plano (/plano/<token>, abre sem
// login) -- caminho único de entrega do plano desde 2026-10-11 (WhatsApp fora).
// Chamado por ybytu-submit-plan-review no momento em que o app libera o plano
// (mesma regra de _shared/planApproval.ts).
//
// Idempotente por profiles.user_plan_email_sent_at, marcado SÓ quando o Resend
// aceita: um parecer reeditado depois não reenvia; uma falha deixa a coluna
// vazia e fica em email_notifications (status failed) para o alerta.
const PLAN_BASE_URL = 'https://pro.ybytu.app/plano/'

// Cita só os módulos da assinatura do aluno (requiredRoles), nunca
// "treino e nutrição" para quem tem um só.
function modulesSentence(requiredRoles: ReviewRole[]): string {
  const training = requiredRoles.includes('personal')
  const meals = requiredRoles.includes('nutricionista')
  if (training && meals) return 'seu plano de treino e seu plano alimentar foram revisados e aprovados pelos nossos profissionais.'
  if (training) return 'seu plano de treino foi revisado e aprovado pelos nossos profissionais.'
  return 'seu plano alimentar foi revisado e aprovado pelos nossos profissionais.'
}

export async function sendPlanReadyEmail(
  supabase: SupabaseClient,
  userId: string,
  requiredRoles: ReviewRole[],
): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, user_plan_email_sent_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`Lookup de profile falhou: ${error.message}`)
  if (!profile) return { ok: false, error: 'profile_not_found' }
  if (profile.user_plan_email_sent_at) return { ok: true, skipped: 'already_sent' }

  const to = await userEmail(supabase, userId)
  if (!to) {
    console.error(`Aluno ${userId} sem e-mail na conta: link do plano não enviado`)
    return { ok: false, error: 'missing_user_email' }
  }

  const planToken = await getOrCreatePlanShareToken(supabase, userId)
  const firstName = (profile.full_name ?? '').trim().split(/\s+/)[0] || 'aluno(a)'
  const html = renderTemplate(PLAN_READY_HTML, {
    name: escapeHtml(firstName),
    modules_sentence: modulesSentence(requiredRoles),
    plan_link: `${PLAN_BASE_URL}${planToken}`,
  })

  const result = await sendEmail(supabase, {
    userId,
    kind: 'user_plan_ready',
    to,
    subject: 'Seu plano está pronto: acesse pelo link',
    html,
  })
  if (!result.ok) return { ok: false, error: result.error }

  await supabase.from('profiles').update({ user_plan_email_sent_at: new Date().toISOString() }).eq('id', userId)
  return { ok: true }
}
