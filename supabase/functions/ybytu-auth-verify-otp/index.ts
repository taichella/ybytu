import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

// ============================================================================
// EDGE FUNCTION: ybytu-auth-verify-otp
// Valida o código OTP de 6 dígitos.
// Proteções: Teto de 5 tentativas por código, expiração estrita (5 min),
// uso único imediato, validação E.164 estrita, busca indexada direta (sem varredura),
// e emissão de sessão autenticada de 30 dias.
// ISOLAMENTO: Usa cliente Supabase efêmero com persistSession: false
// para garantir que a sessão de um usuário NUNCA vaze para outro em concorrência.
// NUNCA grava o código recebido ou tokens em logs do console ou arquivos de erro.
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

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface PhoneValidation {
  valid: boolean
  e164: string
  digits: string
  candidates: string[]
}

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
    candidates.push(fullDigits.slice(2))
  }

  return { valid: true, e164, digits: fullDigits, candidates }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json().catch(() => null)
    const rawIdentifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
    const rawCode = typeof body?.code === 'string' ? body.code.trim() : ''

    if (!rawIdentifier || !rawCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'missing_fields',
        message: 'Informe o número e o código de 6 dígitos.',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const code = rawCode.replace(/\D/g, '')
    if (code.length !== 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invalid_format',
        message: 'O código deve conter exatamente 6 números.',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let normalizedIdentifier = ''
    let phoneVal: PhoneValidation | null = null

    if (rawIdentifier.includes('@')) {
      normalizedIdentifier = rawIdentifier.toLowerCase()
    } else {
      phoneVal = parseAndValidatePhoneE164(rawIdentifier)
      if (!phoneVal.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'invalid_phone_format',
          message: 'Número de telefone inválido. Informe o DDD e o número completo.',
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      normalizedIdentifier = phoneVal.e164
    }

    // ------------------------------------------------------------------------
    // 1. BUSCA O CÓDIGO ATIVO MAIS RECENTE PARA ESTE IDENTIFICADOR
    // ------------------------------------------------------------------------
    const { data: otpRow, error: otpErr } = await supabaseAdmin
      .from('auth_otps')
      .select('id, code_hash, attempts, max_attempts, expires_at, is_used, identifier_found')
      .eq('identifier', normalizedIdentifier)
      .eq('is_used', false)
      .eq('identifier_found', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpErr) throw new Error(`Falha ao consultar auth_otps: ${otpErr.message}`)

    if (!otpRow) {
      return new Response(JSON.stringify({
        success: false,
        error: 'no_active_code',
        message: 'Código inválido ou expirado. Solicite um novo código.',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 2. CHECAGEM DE VALIDADE TEMPORAL (TTL 5 MINUTOS)
    // ------------------------------------------------------------------------
    const now = new Date()
    const expiresAt = new Date(otpRow.expires_at)

    if (now > expiresAt) {
      await supabaseAdmin.from('auth_otps').update({ is_used: true }).eq('id', otpRow.id)

      return new Response(JSON.stringify({
        success: false,
        error: 'expired_code',
        message: 'Este código expirou (validade de 5 minutos). Solicite um novo.',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 3. CHECAGEM DO NÚMERO DE TENTATIVAS (MÁXIMO 5)
    // ------------------------------------------------------------------------
    const currentAttempts = otpRow.attempts + 1

    if (currentAttempts > otpRow.max_attempts) {
      await supabaseAdmin.from('auth_otps').update({ is_used: true, attempts: currentAttempts }).eq('id', otpRow.id)

      return new Response(JSON.stringify({
        success: false,
        error: 'too_many_attempts',
        message: 'Limite de tentativas excedido. Solicite um novo código.',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 4. VERIFICAÇÃO DO HASH CRIPTOGRÁFICO
    // ------------------------------------------------------------------------
    const otpSalt = Deno.env.get('INTERNAL_FUNCTION_SECRET') || 'ybytu-otp-salt'
    const expectedHash = await sha256(`${code}:${otpSalt}`)

    if (expectedHash !== otpRow.code_hash) {
      const shouldBurn = currentAttempts >= otpRow.max_attempts
      await supabaseAdmin.from('auth_otps').update({
        attempts: currentAttempts,
        is_used: shouldBurn,
      }).eq('id', otpRow.id)

      const remaining = otpRow.max_attempts - currentAttempts
      const message = shouldBurn
        ? 'Código bloqueado por excesso de tentativas. Solicite um novo código.'
        : `Código incorreto. Você ainda tem ${remaining} ${remaining === 1 ? 'tentativa' : 'tentativas'}.`

      return new Response(JSON.stringify({
        success: false,
        error: 'incorrect_code',
        message,
        remaining_attempts: Math.max(0, remaining),
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 5. CÓDIGO CORRETO: MARCA COMO USADO (USO ÚNICO IMEDIATO)
    // ------------------------------------------------------------------------
    await supabaseAdmin.from('auth_otps').update({
      is_used: true,
      attempts: currentAttempts,
    }).eq('id', otpRow.id)

    // ------------------------------------------------------------------------
    // 6. LOCALIZA O USUÁRIO (Busca indexada direta sem varredura em memória)
    // ------------------------------------------------------------------------
    let targetUserId: string | null = null
    let targetEmail: string | null = null

    // 6.1 Tenta via RPC segura
    const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('find_user_by_identifier', {
      p_identifier: normalizedIdentifier,
    })

    if (!rpcErr && rpcRows && rpcRows.length > 0) {
      targetUserId = rpcRows[0].user_id
      targetEmail = rpcRows[0].email
    } else {
      // 6.2 Fallback indexado direto
      if (phoneVal) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, whatsapp_phone')
          .in('whatsapp_phone', phoneVal.candidates)
          // Mesmo telefone em mais de um perfil: vence o perfil mais recente
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (profile) {
          targetUserId = profile.id
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(profile.id)
          targetEmail = u?.user?.email ?? null
        }
      }
    }

    if (!targetUserId || !targetEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_not_found',
        message: 'Cadastro não localizado. Entre em contato com o suporte.',
      }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ------------------------------------------------------------------------
    // 7. EMISSÃO DA SESSÃO VIA CLIENTE EFÊMERO ISOLADO (ANTI-VAZAMENTO DE SESSÃO)
    // ------------------------------------------------------------------------
    // 7.1 Gera o hashed_token via Admin API para o usuário existente confirmado
    const { data: linkRes, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    })

    if (linkErr || !linkRes?.properties?.hashed_token) {
      console.error('Falha ao gerar link de sessão:', linkErr?.message || 'missing_token')
      return new Response(JSON.stringify({
        success: false,
        error: 'session_generation_failed',
        message: 'Não foi possível gerar a sessão. Tente novamente.',
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hashedToken = linkRes.properties.hashed_token

    // 7.2 Instancia cliente Supabase isolado e efêmero com persistSession: false
    const ephemeralClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    // 7.3 Converte o hashed_token na sessão JWT oficial
    const { data: sessionData, error: verifyErr } = await ephemeralClient.auth.verifyOtp({
      token_hash: hashedToken,
      type: 'email',
    })

    if (verifyErr || !sessionData?.session) {
      console.error('Falha ao autenticar sessão efêmera:', verifyErr?.message || 'missing_session')
      return new Response(JSON.stringify({
        success: false,
        error: 'session_exchange_failed',
        message: 'Falha ao autenticar a sessão. Tente novamente.',
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Retorna a sessão para o cliente registrar no seu próprio localStorage
    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
        user: {
          id: sessionData.user?.id,
          email: sessionData.user?.email,
        },
      },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('Erro inesperado em ybytu-auth-verify-otp:', err.message || 'unknown')
    return new Response(JSON.stringify({
      success: false,
      error: 'internal_error',
      message: 'Ocorreu um erro ao validar seu código. Tente novamente.',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
