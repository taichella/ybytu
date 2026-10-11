import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Envio de e-mail transacional via Resend + registro em email_notifications.
//
// Desde 2026-10-11 o e-mail é o canal do caminho crítico (link do plano para o
// aluno, parecer pendente para o staff, novo aluno para o admin) -- o WhatsApp
// saiu por decisão da Taina (ver WHATSAPP_ENABLED em _shared/whatsapp.ts e
// docs/POS_PILOTO.md). Todo envio, sucesso ou falha, grava uma linha em
// email_notifications: antes uma falha do Resend ficava só no console da
// function e ninguém sabia (mesmo achado que levou a whatsapp_notifications).
//
// 'sent' = o Resend aceitou o envio. Não confirma que chegou na caixa de
// entrada (isso exigiria o webhook do Resend, não ligado).

export const EMAIL_FROM = 'Ybytu <onboarding@send.ybytu.app>' // mesmo remetente do e-mail de onboarding (domínio verificado)

export type EmailKind =
  | 'user_plan_ready'
  | 'staff_review_pending'
  | 'staff_review_reminder'
  | 'admin_new_onboarding'

export async function sendEmail(
  supabase: SupabaseClient,
  params: { userId: string | null; kind: EmailKind; to: string; subject: string; html: string },
): Promise<{ ok: boolean; error?: string; providerId?: string }> {
  const result = await doSend(params.to, params.subject, params.html)

  try {
    await supabase.from('email_notifications').insert({
      user_id: params.userId,
      kind: params.kind,
      to_email: params.to,
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.providerId ?? null,
      error: result.error ?? null,
    })
  } catch (logErr) {
    console.error('Falha ao gravar log em email_notifications:', logErr)
  }

  if (!result.ok) console.error(`Falha no envio de e-mail (${params.kind}):`, result.error)
  return result
}

async function doSend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; providerId?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return { ok: false, error: 'missing_resend_api_key' }
  if (!to) return { ok: false, error: 'missing_recipient' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: `resend_${res.status}: ${body?.message ?? body?.name ?? 'sem detalhe'}` }
    return { ok: true, providerId: body?.id ?? undefined }
  } catch (err) {
    return { ok: false, error: `network_error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Escapa texto que vem do banco (nome do aluno etc.) antes de entrar no HTML.
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Substitui {{ chave }}. Os valores entram como estão: quem chama escapa o que
// for texto (escapeHtml) -- alguns valores são HTML de propósito (ex. <strong>).
export function renderTemplate(template: string, vars: Record<string, string>): string {
  let html = template
  for (const [key, value] of Object.entries(vars)) html = html.replaceAll(`{{ ${key} }}`, value)
  return html
}

// Staff ativo com um papel (staff_roles + staff não revogados) e o e-mail da
// conta. É para quem vão os avisos por e-mail -- diferente do WhatsApp, que ia
// para um número fixo por papel (PHONE_ADMIN_*).
export async function staffRecipientsForRole(
  supabase: SupabaseClient,
  role: 'personal' | 'nutricionista' | 'admin',
): Promise<Array<{ userId: string; fullName: string; email: string }>> {
  const { data: roleRows, error: roleErr } = await supabase
    .from('staff_roles')
    .select('user_id')
    .eq('role', role)
    .is('revoked_at', null)
  if (roleErr) throw new Error(`Lookup de staff_roles falhou: ${roleErr.message}`)
  const userIds = [...new Set((roleRows ?? []).map((r: any) => r.user_id as string))]
  if (userIds.length === 0) return []

  const { data: staffRows, error: staffErr } = await supabase
    .from('staff')
    .select('user_id, full_name')
    .in('user_id', userIds)
    .is('revoked_at', null)
  if (staffErr) throw new Error(`Lookup de staff falhou: ${staffErr.message}`)

  const recipients: Array<{ userId: string; fullName: string; email: string }> = []
  for (const s of staffRows ?? []) {
    const { data: u } = await supabase.auth.admin.getUserById(s.user_id)
    const email = u?.user?.email
    if (email) recipients.push({ userId: s.user_id, fullName: s.full_name ?? '', email })
    else console.error(`Staff ${s.user_id} (${role}) sem e-mail na conta`)
  }
  return recipients
}

// E-mail da conta do aluno (auth.users) -- é o mesmo do login por código.
export async function userEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId)
  return data?.user?.email ?? null
}
