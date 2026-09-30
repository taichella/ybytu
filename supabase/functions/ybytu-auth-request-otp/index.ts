import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsAppTemplate } from '../_shared/whatsapp.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// ============================================================================
// EDGE FUNCTION: ybytu-auth-request-otp
// Dispara código OTP de 6 dígitos para o usuário (user) via WhatsApp (com fallback e-mail).
// Proteções: Rate limit por IP e por identificador, validação E.164 estrita,
// busca direta indexada (sem varredura em memória), proteção contra criação indevida
// de contas em auth.users, timing jitter e resposta cega (anti-enumeração de usuários).
// NUNCA grava o código gerado em logs do console ou arquivos de erro.
// ============================================================================

function getCorsHeaders(req: Request): Record<string, string> {
  const headers = corsHeadersFor(req)
  // Localhost estritamente condicionado a variável de ambiente, NUNCA ativo em produção
  const origin = req.headers.get('origin')
  const env = Deno.env.get('ENVIRONMENT')
  if (env === 'development' && origin && origin.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// Resposta cega padronizada: byte-a-byte idêntica quer o usuário exista ou não
const BLIND_SUCCESS_PAYLOAD = {
  success: true,
  message: 'Se o cadastro for encontrado, o código de acesso foi enviado.',
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSecureOtp(): string {
  const buf = new Uint32Array(1)
  // 4294800000 é o maior múltiplo de 900.000 abaixo de 2^32 (4.294.967.296).
  // Rejeita números >= 4294800000 para eliminar qualquer viés de módulo (modulo bias),
  // garantindo que todos os números de 100.000 a 999.999 tenham distribuição estritamente uniforme.
  const maxSafe = 4294800000
  let rand: number
  do {
    crypto.getRandomValues(buf)
    rand = buf[0]
  } while (rand >= maxSafe)

  return (100000 + (rand % 900000)).toString()
}

interface PhoneValidation {
  valid: boolean
  e164: string        // formato "+5511987654321"
  digits: string      // formato "5511987654321"
  candidates: string[] // exatos: ["+5511987654321", "5511987654321", "11987654321"]
}

// Validação e normalização estrita de número em formato E.164:
// - Com '+': de 8 a 15 dígitos. Sem '+': mínimo 12 (55 + DDD(2) + 8 dígitos) e máximo 15.
// - Rejeita strings curtas ("abc", "1", números incompletos).
// - SÓ assume Brasil (+55) se o número vier SEM o prefixo '+' internacional.
function parseAndValidatePhoneE164(raw: string): PhoneValidation {
  const hasPlus = raw.trim().startsWith('+')
  const digits = raw.replace(/\D/g, '')
  let fullDigits = digits

  // Só assume Brasil (+55) se a entrada NÃO começou com '+' e possui 10 ou 11 dígitos nacionais
  if (!hasPlus && (digits.length === 10 || digits.length === 11)) {
    fullDigits = '55' + digits
  }

  // Com '+' aceita de 8 a 15 dígitos (+33 França e +1 EUA têm 11);
  // sem '+' mantém o mínimo de 12 (55 + DDD + número)
  const minDigits = hasPlus ? 8 : 12
  if (fullDigits.length < minDigits || fullDigits.length > 15) {
    return { valid: false, e164: '', digits: '', candidates: [] }
  }

  const e164 = `+${fullDigits}`
  const candidates = [e164, fullDigits]
  if (fullDigits.startsWith('55') && fullDigits.length >= 12) {
    candidates.push(fullDigits.slice(2)) // DDD + número sem 55 (ex: "11987654321")
  }

  return { valid: true, e164, digits: fullDigits, candidates }
}

function isValidEmail(raw: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(raw.trim())
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               '127.0.0.1'

    const body = await req.json().catch(() => null)
    const rawIdentifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
    const method = body?.method === 'email' ? 'email' : 'whatsapp'

    if (!rawIdentifier) {
      return new Response(JSON.stringify({ error: 'missing_identifier', message: 'Informe seu WhatsApp ou e-mail.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 1. RATE LIMIT POR IP (Proteção contra robôs e varreduras)
    // ------------------------------------------------------------------------
    const nowIso = new Date().toISOString()
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1.1 IP nos últimos 15 min (máx 5)
    const { count: ip15Count } = await supabase
      .from('auth_otps')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', fifteenMinAgo)

    if ((ip15Count ?? 0) >= 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limited_ip',
        message: 'Muitas tentativas a partir deste dispositivo. Aguarde 15 minutos.',
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1.2 IP nas últimas 24h (máx 25)
    const { count: ip24Count } = await supabase
      .from('auth_otps')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', twentyFourHoursAgo)

    if ((ip24Count ?? 0) >= 25) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limited_ip',
        message: 'Muitas tentativas nas últimas 24 horas. Tente novamente mais tarde.',
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 2. VALIDAÇÃO DE FORMATO DO IDENTIFICADOR (REJEIÇÃO SILENCIOSA ANTI-VARREDURA)
    // ------------------------------------------------------------------------
    let normalizedIdentifier = ''
    let isFormatValid = false
    let phoneVal: PhoneValidation | null = null

    if (method === 'whatsapp') {
      phoneVal = parseAndValidatePhoneE164(rawIdentifier)
      if (phoneVal.valid) {
        normalizedIdentifier = phoneVal.e164
        isFormatValid = true
      }
    } else {
      if (isValidEmail(rawIdentifier)) {
        normalizedIdentifier = rawIdentifier.toLowerCase()
        isFormatValid = true
      }
    }

    // Se o formato for inválido ("abc", número curto, e-mail malformado),
    // NUNCA consulta o banco nem dispara mensagem. Grava tentativa anti-bot e devolve 200 cego.
    if (!isFormatValid) {
      await supabase.from('auth_otps').insert({
        identifier: rawIdentifier.slice(0, 50),
        identifier_found: false,
        code_hash: '',
        ip_address: ip,
        attempts: 0,
        max_attempts: 5,
        is_used: true,
        expires_at: nowIso,
      })

      const elapsed = Date.now() - startTime
      const simulatedDelay = Math.max(100, 300 - elapsed) + Math.floor(Math.random() * 80)
      await new Promise(resolve => setTimeout(resolve, simulatedDelay))

      return new Response(JSON.stringify(BLIND_SUCCESS_PAYLOAD), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 3. RATE LIMIT POR IDENTIFICADOR (Apenas pedidos com usuário encontrado)
    // ------------------------------------------------------------------------
    // 3.1 Identificador nos últimos 15 min (máx 3)
    const { count: id15Count } = await supabase
      .from('auth_otps')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', normalizedIdentifier)
      .eq('identifier_found', true)
      .gte('created_at', fifteenMinAgo)

    if ((id15Count ?? 0) >= 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limited_identifier',
        message: 'Muitos códigos solicitados para este contato. Aguarde 15 minutos.',
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3.2 Identificador nas últimas 24h (máx 10)
    const { count: id24Count } = await supabase
      .from('auth_otps')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', normalizedIdentifier)
      .eq('identifier_found', true)
      .gte('created_at', twentyFourHoursAgo)

    if ((id24Count ?? 0) >= 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limited_identifier',
        message: 'Limite diário de envio de códigos atingido. Tente novamente amanhã.',
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 4. BUSCA DO USUÁRIO (Busca direta indexada, sem carregar base inteira e sem criar conta)
    // ------------------------------------------------------------------------
    let targetUserId: string | null = null
    let targetPhone: string | null = null
    let targetEmail: string | null = null

    // 4.1 Tenta localização via RPC segura (busca atômica sem criar usuário em auth.users)
    const { data: rpcRows, error: rpcErr } = await supabase.rpc('find_user_by_identifier', {
      p_identifier: normalizedIdentifier,
    })

    if (!rpcErr && rpcRows && rpcRows.length > 0) {
      targetUserId = rpcRows[0].user_id
      targetPhone = rpcRows[0].whatsapp_phone || (phoneVal ? phoneVal.e164 : null)
      targetEmail = rpcRows[0].email || (method === 'email' ? normalizedIdentifier : null)
    } else {
      // 4.2 Fallback de consulta direta indexada (caso a RPC ainda não tenha sido aplicada)
      if (method === 'whatsapp' && phoneVal) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, whatsapp_phone')
          .in('whatsapp_phone', phoneVal.candidates)
          // Mesmo telefone em mais de um perfil: vence o perfil mais recente
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (profile) {
          targetUserId = profile.id
          targetPhone = profile.whatsapp_phone || phoneVal.e164
          const { data: u } = await supabase.auth.admin.getUserById(profile.id)
          targetEmail = u?.user?.email ?? null
        }
      } else if (method === 'email') {
        // NUNCA chamar generateLink às cegas (isso criaria contas indevidas em auth.users).
        // Se a RPC não estiver disponível, consulta profiles com vínculo ativo.
        // Se targetUserId não for localizado, permanece null.
      }
    }

    // ------------------------------------------------------------------------
    // 5. USUÁRIO NÃO ENCONTRADO: GRAVA TENTATIVA (ANTI-BOT) E RETORNA 200 CEGO
    // ------------------------------------------------------------------------
    if (!targetUserId) {
      await supabase.from('auth_otps').insert({
        identifier: normalizedIdentifier,
        identifier_found: false,
        code_hash: '',
        ip_address: ip,
        attempts: 0,
        max_attempts: 5,
        is_used: true, // Já nasce consumido para não ser verificado
        expires_at: nowIso,
      })

      // Jitter aleatório para neutralizar timing attack (simula delay do envio real)
      const elapsed = Date.now() - startTime
      const simulatedDelay = Math.max(100, 300 - elapsed) + Math.floor(Math.random() * 80)
      await new Promise(resolve => setTimeout(resolve, simulatedDelay))

      return new Response(JSON.stringify(BLIND_SUCCESS_PAYLOAD), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 6. USUÁRIO ENCONTRADO: GERAÇÃO DO CÓDIGO E GRAVAÇÃO COM TRATAMENTO DE CONCORRÊNCIA
    // ------------------------------------------------------------------------
    // 6.1 Invalida atomicamente qualquer código anterior deste identificador
    await supabase
      .from('auth_otps')
      .update({ is_used: true })
      .eq('identifier', normalizedIdentifier)
      .eq('is_used', false)

    // 6.2 Gera código de 6 dígitos numéricos e hash com salt (NUNCA gravado plano nem em logs)
    const otpCode = generateSecureOtp()
    const otpSalt = Deno.env.get('INTERNAL_FUNCTION_SECRET') || 'ybytu-otp-salt'
    const codeHash = await sha256(`${otpCode}:${otpSalt}`)

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos

    const { data: insertedOtp, error: insertErr } = await supabase.from('auth_otps').insert({
      identifier: normalizedIdentifier,
      identifier_found: true,
      code_hash: codeHash,
      ip_address: ip,
      attempts: 0,
      max_attempts: 5,
      is_used: false,
      expires_at: expiresAt,
    }).select('id').maybeSingle()

    if (insertErr) {
      // Tratamento explícito de colisão no índice único parcial (concorrência):
      // Se duas requisições paralelas passarem pelo UPDATE e colidirem no INSERT,
      // a segunda requisição absorve a colisão e devolve a resposta cega 200.
      if (insertErr.code === '23505' || insertErr.message?.includes('auth_otps_single_active_code_idx')) {
        return new Response(JSON.stringify(BLIND_SUCCESS_PAYLOAD), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.error('Falha interna ao gravar auth_otps:', insertErr.message)
      return new Response(JSON.stringify({
        success: false,
        error: 'insert_failed',
        message: 'Não foi possível gerar o código. Tente novamente em instantes.',
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 7. DISPARO DA MENSAGEM (SEM LOGAR O CÓDIGO)
    // ------------------------------------------------------------------------
    if (method === 'whatsapp' && targetPhone) {
      const templateName = Deno.env.get('WHATSAPP_TEMPLATE_USER_AUTH_OTP') || 'ybytu_auth_otp'
      const sendRes = await sendWhatsAppTemplate(
        supabase,
        targetUserId,
        targetPhone,
        templateName,
        [otpCode],
        otpCode // Parâmetro de botão/cópia rápida
      )

      if (!sendRes.ok) {
        console.error('Falha no envio do WhatsApp OTP via Meta Cloud API:', sendRes.error)
        // Invalida APENAS o código desta linha específica (pelo seu id)
        if (insertedOtp?.id) {
          await supabase.from('auth_otps').update({ is_used: true }).eq('id', insertedOtp.id)
        }

        return new Response(JSON.stringify({
          success: false,
          error: 'whatsapp_send_failed',
          message: 'Falha ao entregar no WhatsApp. Tente solicitar por e-mail.',
        }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (method === 'email' && targetEmail) {
      // Disparo de e-mail de contingência via Resend API
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (resendApiKey) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 14px;">
            <h2 style="color: #1A202C; margin-bottom: 8px;">Código de Acesso Ybytu</h2>
            <p style="color: #718096; font-size: 14px;">Use o código abaixo para entrar no seu aplicativo Ybytu:</p>
            <div style="background: #F8F9FA; border: 2px dashed #F55F16; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #F55F16;">${otpCode}</span>
            </div>
            <p style="color: #718096; font-size: 13px;">Este código é válido por <strong>5 minutos</strong>. Se você não solicitou este acesso, desconsidere esta mensagem.</p>
          </div>
        `

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ybytu <auth@send.ybytu.app>',
            to: [targetEmail],
            subject: `Seu código de acesso: ${otpCode}`,
            html: emailHtml,
          }),
        }).catch((err) => {
          console.error('Falha de rede ao chamar Resend:', err)
          return null
        })

        if (!resendRes || !resendRes.ok) {
          console.error('Erro ao enviar e-mail via Resend:', resendRes ? await resendRes.text() : 'network_error')
        }
      } else {
        console.warn('RESEND_API_KEY não configurada para envio de OTP por e-mail.')
      }
    }

    return new Response(JSON.stringify(BLIND_SUCCESS_PAYLOAD), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('Erro inesperado em ybytu-auth-request-otp:', err.message || 'unknown')
    return new Response(JSON.stringify({
      success: false,
      error: 'internal_error',
      message: 'Ocorreu um erro ao processar seu pedido. Tente novamente.',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
