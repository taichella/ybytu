import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  // Trata requisições de preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 0. Estava completamente aberto (sem CORS restrito nem auth) -- qualquer
    // um na internet podia disparar mensagem pros telefones dos profissionais
    // usando nosso SALVY_API_KEY. Fechado pro mesmo padrão de staff das
    // outras functions: só admin dispara alerta.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: auth.reason }),
        { status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    if (!requireRole(auth.staff, 'admin')) {
      return new Response(
        JSON.stringify({ error: 'admin_only' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Lendo os dados enviados na requisição
    const { type, message } = await req.json()

    if (!type || !message) {
      return new Response(
        JSON.stringify({ error: "Os campos 'type' e 'message' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Mapeamento dinâmico do número de telefone baseado no tipo de alerta
    let targetPhone = ""
    const alertType = type.toLowerCase().trim()

    switch (alertType) {
      case "trainer":
      case "coach":
        targetPhone = Deno.env.get("PHONE_ADMIN_TRAINER") ?? ""
        break
      case "nutri":
      case "nutritionist":
        targetPhone = Deno.env.get("PHONE_ADMIN_NUTRI") ?? ""
        break
      case "sale":
      case "sales":
      case "vendas":
        targetPhone = Deno.env.get("PHONE_ADMIN_SALE") ?? ""
        break
      case "dev":
      case "developer":
      case "suporte":
        targetPhone = Deno.env.get("PHONE_ADMIN_DEV") ?? ""
        break
      default:
        return new Response(
          JSON.stringify({ error: `O tipo de alerta '${type}' não é válido.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    // 3. Validação dos Secrets obrigatórios
    if (!targetPhone) {
      return new Response(
        JSON.stringify({ error: `O número de telefone para o tipo '${alertType}' não foi configurado nos Secrets.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const salvyApiKey = Deno.env.get("SALVY_API_KEY")
    if (!salvyApiKey) {
      return new Response(
        JSON.stringify({ error: "A credencial 'SALVY_API_KEY' não está configurada nos Secrets do Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Integração HTTP com a API de Mensagens da Salvy
    // Nota: A URL final e os campos do body devem refletir a rota de envio de SMS/WhatsApp da doc oficial da Salvy.
    console.log(`Disparando alerta do tipo [${alertType}] para o número: ${targetPhone}`)
    
    const salvyResponse = await fetch("https://api.salvy.com.br/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${salvyApiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        to: targetPhone,
        text: message
      })
    })

    // Coleta a resposta da Salvy para debug interno
    const responseData = await salvyResponse.json().catch(() => ({}));

    if (!salvyResponse.ok) {
      console.error("Erro retornado pela API da Salvy:", responseData)
      throw new Error(`Salvy API respondeu com erro: ${salvyResponse.statusText}`)
    }

    // 5. Resposta de sucesso da Edge Function
    return new Response(
      JSON.stringify({ success: true, message: "Alerta enviado com sucesso!", target: alertType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Erro crítico na execução da admin-alert:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})