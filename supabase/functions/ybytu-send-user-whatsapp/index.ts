import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { sendWhatsAppTemplate } from '../_shared/salvy.ts'

// Manda WhatsApp pro USUÁRIO final. Só aceita user_id -- nunca telefone cru
// no body (o número mora em profiles.whatsapp_phone, resolvido aqui dentro).
// Caller autorizado: chamada interna (service_role -- ex: ybytu-submit-
// plan-review avisando que o plano ficou pronto) OU staff autenticado
// (qualquer papel ativo, ex: reenvio manual futuro pelo dashboard).
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (!isInternalServiceCall(req)) {
      const auth = await resolveStaffFromRequest(req, supabase)
      if (!auth.ok) {
        return new Response(JSON.stringify({ error: auth.reason }), {
          status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const body = await req.json().catch(() => null)
    const userId = typeof body?.user_id === 'string' ? body.user_id : ''
    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp_phone, user_notified_ready_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!profile.whatsapp_phone) {
      return new Response(JSON.stringify({ error: 'missing_whatsapp_phone' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Idempotente: um parecer reeditado depois que os dois já constavam
    // (ex: personal corrige o texto) não deve reenviar o "plano pronto".
    if (profile.user_notified_ready_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_notified' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Reaproveita token válido existente em vez de gerar um novo a cada envio.
    const { data: existingToken } = await supabase
      .from('plan_share_tokens')
      .select('token')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let planToken = existingToken?.token ?? null
    if (!planToken) {
      planToken = generateToken()
      const { error: insertError } = await supabase
        .from('plan_share_tokens')
        .insert({ user_id: userId, token: planToken })
      if (insertError) throw new Error(`Criação de plan_share_token falhou: ${insertError.message}`)
    }

    const planLink = `https://ybytu.app/plano/${planToken}`
    const templateId = Deno.env.get('SALVY_TEMPLATE_USER_PLAN_READY') ?? ''

    const result = await sendWhatsAppTemplate(profile.whatsapp_phone, templateId, [
      profile.full_name ?? '',
      planLink,
    ])

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error ?? 'send_failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('profiles')
      .update({ user_notified_ready_at: new Date().toISOString() })
      .eq('id', userId)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-send-user-whatsapp error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
