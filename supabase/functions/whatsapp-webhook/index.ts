import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// ─── Validação HMAC do POST (2026-09-01) ──────────────────────────────────────
// A Meta assina todo POST de webhook com HMAC-SHA256 do corpo cru, usando o
// App Secret (Meta App Dashboard → Configurações → Básico), no header
// X-Hub-Signature-256 (formato "sha256=<hex>"). Sem isso, qualquer um que
// descubra a URL forjava delivery_status -- achado na auditoria de 2026-09-01
// (o GET já validava hub.verify_token, o POST não validava nada).
//
// FAIL-CLOSED de propósito: secret ausente = rejeita, nunca passa liberado --
// mesmo princípio do array vazio de alérgeno (unreviewed bloqueia, não libera).
// Se a Meta receber 403, ela reentrega com backoff decrescente por até 7 dias
// (confirmado na documentação oficial) -- não perde o evento por causa disso,
// só se o secret ficar sem configurar por mais de uma semana.
async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Comparação em tempo constante -- não usa === direto pra não vazar por
// timing quantos bytes iniciais bateram. Confere o tamanho primeiro (padrão
// aceito, o próprio crypto.timingSafeEqual do Node faz o mesmo).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

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
    // Corpo CRU primeiro -- a assinatura é sobre os bytes exatos que a Meta
    // mandou, não sobre um JSON.parse+re-stringify (poderia divergir em
    // espaçamento/ordem de chaves e invalidar a comparação).
    const rawBody = await req.text()

    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')
    if (!appSecret) {
      console.error("WHATSAPP_APP_SECRET não configurado -- rejeitando POST (fail-closed, não passa liberado)")
      return new Response("Configuração ausente", { status: 403 })
    }

    const signatureHeader = req.headers.get('x-hub-signature-256')
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      console.error("X-Hub-Signature-256 ausente ou em formato inesperado")
      return new Response("Assinatura ausente", { status: 403 })
    }

    const receivedSignature = signatureHeader.slice('sha256='.length)
    const expectedSignature = await computeHmacSha256Hex(appSecret, rawBody)
    if (!timingSafeEqual(receivedSignature, expectedSignature)) {
      console.error("Assinatura HMAC inválida -- payload rejeitado antes de tocar no banco")
      return new Response("Assinatura inválida", { status: 403 })
    }

    const payload = JSON.parse(rawBody)
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