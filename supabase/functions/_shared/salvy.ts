// Envio de WhatsApp via Salvy usando template pré-aprovado (HSM) -- nunca
// texto livre para estas duas notificações proativas (Ybytu sempre inicia a
// conversa, então está sempre fora da janela de 24h ou perto dela). O
// TEMPLATE_ID de cada mensagem vem de env var, cadastrado no painel da Salvy
// -- ver DÉBITO abaixo sobre o formato exato do body.
//
// DÉBITO: a doc oficial da Salvy pra envio de template HSM não foi conferida
// ainda (mesmo débito já registrado em admin-alert pro envio de texto livre).
// O shape abaixo (template + variables como array ordenado) é a convenção
// mais comum entre providers de WhatsApp Business API -- ajustar campo por
// campo assim que a Taina confirmar no painel da Salvy.
export async function sendWhatsAppTemplate(
  phone: string,
  templateId: string,
  variables: string[],
): Promise<{ ok: boolean; error?: string }> {
  const salvyApiKey = Deno.env.get('SALVY_API_KEY')
  if (!salvyApiKey) return { ok: false, error: 'missing_salvy_api_key' }
  if (!templateId) return { ok: false, error: 'missing_template_id' }
  if (!phone) return { ok: false, error: 'missing_phone' }

  try {
    const response = await fetch('https://api.salvy.com.br/v1/messages/template', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salvyApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        template: templateId,
        variables,
      }),
    })

    const responseData = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('Erro retornado pela API da Salvy:', responseData)
      return { ok: false, error: `salvy_error_${response.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('Falha ao chamar a Salvy:', err)
    return { ok: false, error: 'salvy_request_failed' }
  }
}
