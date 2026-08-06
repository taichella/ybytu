// Envio de WhatsApp via Cloud API da Meta (não Salvy — a Salvy só fornece o
// número virtual; o envio de fato é direto pro Graph API do WhatsApp
// Business). Confirmado com o suporte da Salvy em 2026-08-06. Sempre por
// template pré-aprovado (HSM): Ybytu inicia a conversa, então está sempre
// fora da janela de 24h de texto livre.
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  bodyParams: string[],
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  if (!accessToken) return { ok: false, error: 'missing_whatsapp_access_token' }
  if (!phoneNumberId) return { ok: false, error: 'missing_whatsapp_phone_number_id' }
  if (!templateName) return { ok: false, error: 'missing_template_name' }
  if (!phone) return { ok: false, error: 'missing_phone' }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: bodyParams.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
    })

    const responseData = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('Erro retornado pela Cloud API da Meta:', responseData)
      return { ok: false, error: `whatsapp_error_${response.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('Falha ao chamar a Cloud API da Meta:', err)
    return { ok: false, error: 'whatsapp_request_failed' }
  }
}
