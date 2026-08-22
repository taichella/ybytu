import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const url = new URL(req.url)

  // 1. VALIDAÇÃO DA META (Handshake - Requisição GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    const MY_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

    if (mode === "subscribe" && token === MY_VERIFY_TOKEN) {
      console.log("Webhook validado pela Meta com sucesso!")
      return new Response(challenge, { status: 200 })
    }
    return new Response("Token inválido", { status: 403 })
  }

  // 2. RECEBIMENTO DE MENSAGENS (Requisição POST)
  try {
    const payload = await req.json()
    console.log("Notificação recebida da Meta:", JSON.stringify(payload))

    // Callback de status (sent/delivered/read/failed) do template que a gente
    // mandou -- é isso que dá a resposta real de "chegou no aparelho ou não",
    // diferente do 200 OK que só confirma que a Meta ACEITOU o envio. Achado
    // 2026-08-22: o webhook era só stub, não gravava nada. Correlaciona pelo
    // wamid (id da mensagem) gravado em whatsapp_notifications no envio.
    const statuses = (payload?.entry ?? [])
      .flatMap((entry: any) => entry?.changes ?? [])
      .flatMap((change: any) => change?.value?.statuses ?? [])

    for (const s of statuses) {
      const wamid = s?.id
      const status = s?.status
      if (!wamid || !status) continue

      const errorMessage = Array.isArray(s?.errors) && s.errors.length > 0
        ? s.errors.map((e: any) => `${e.code}: ${e.title}${e.error_data?.details ? ' -- ' + e.error_data.details : ''}`).join('; ')
        : null

      const { error } = await supabase
        .from('whatsapp_notifications')
        .update({
          delivery_status: status,
          delivery_error: errorMessage,
          delivery_status_at: new Date().toISOString(),
        })
        .eq('wamid', wamid)

      if (error) console.error('Falha ao gravar delivery_status:', error)
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })
  } catch (err) {
    console.error("Erro:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})