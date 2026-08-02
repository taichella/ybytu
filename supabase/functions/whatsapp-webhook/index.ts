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

    // A lógica de atualizar o banco vai aqui assim que validarmos a conexão

    return new Response(JSON.stringify({ status: "success" }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })
  } catch (err) {
    console.error("Erro:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})