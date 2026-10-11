import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getPlanApproval } from './planApproval.ts'

// Saúde do caminho crítico por e-mail (2026-10-11, WhatsApp fora). Usado pelo
// cron de hora em hora (ybytu-email-health-cron, que abre/fecha o alerta) e
// pela tela do admin (ybytu-admin-email-health). Dois sinais:
//
// 1. Falhas de envio: linhas 'failed' em email_notifications nas últimas
//    FAILURE_WINDOW_HOURS horas (janela maior que o intervalo do cron, para
//    nenhuma falha cair entre duas rodadas).
// 2. Aluno sem o link do plano: plano liberado (mesma regra do app,
//    _shared/planApproval.ts) há mais de STUCK_AFTER_HOURS hora e nenhum
//    "plano pronto" entregue -- nem e-mail aceito (user_plan_email_sent_at)
//    nem WhatsApp com entrega confirmada pela Meta (delivered/read). Pega o
//    caso que o registro de envio sozinho não pega: o e-mail nem foi tentado.
//
// Limite: 'sent' é "o Resend aceitou". Não sabemos se chegou na caixa de
// entrada (precisaria do webhook do Resend).
export const FAILURE_WINDOW_HOURS = 2
export const STUCK_AFTER_HOURS = 1

export interface EmailHealth {
  recentFailures: Array<{ id: string; created_at: string; kind: string; to_email: string; error: string | null; user_id: string | null }>
  studentsWithoutLink: Array<{ user_id: string; full_name: string | null; approved_at: string }>
}

export async function computeEmailHealth(supabase: SupabaseClient): Promise<EmailHealth> {
  const since = new Date(Date.now() - FAILURE_WINDOW_HOURS * 3600_000).toISOString()
  const { data: failures, error: failErr } = await supabase
    .from('email_notifications')
    .select('id, created_at, kind, to_email, error, user_id')
    .eq('status', 'failed')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
  if (failErr) throw new Error(`Lookup de email_notifications falhou: ${failErr.message}`)

  // Candidatos: plano gerado e e-mail do plano ainda não aceito.
  const { data: candidates, error: candErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('plan_generation_status', 'ok')
    .is('user_plan_email_sent_at', null)
  if (candErr) throw new Error(`Lookup de profiles falhou: ${candErr.message}`)

  const planReadyTemplate = Deno.env.get('WHATSAPP_TEMPLATE_USER_PLAN_READY') ?? 'ybytu_user_plan_ready'
  const cutoff = Date.now() - STUCK_AFTER_HOURS * 3600_000
  const studentsWithoutLink: EmailHealth['studentsWithoutLink'] = []

  for (const p of candidates ?? []) {
    const approval = await getPlanApproval(supabase, p.id)
    if (!approval.approved) continue

    const { data: delivered } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .eq('user_id', p.id)
      .eq('template', planReadyTemplate)
      .in('delivery_status', ['delivered', 'read'])
      .limit(1)
    if ((delivered ?? []).length > 0) continue

    // Liberado quando o último parecer exigido foi aprovado.
    const { data: reviews } = await supabase
      .from('plan_reviews')
      .select('updated_at')
      .eq('user_id', p.id)
      .in('role', approval.requiredRoles)
    const approvedAt = (reviews ?? []).map((r: any) => r.updated_at as string).sort().pop()
    if (!approvedAt || new Date(approvedAt).getTime() > cutoff) continue

    studentsWithoutLink.push({ user_id: p.id, full_name: p.full_name, approved_at: approvedAt })
  }

  return { recentFailures: failures ?? [], studentsWithoutLink }
}

export function hasProblem(h: EmailHealth): boolean {
  return h.recentFailures.length > 0 || h.studentsWithoutLink.length > 0
}
