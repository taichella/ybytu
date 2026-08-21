import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { sendWhatsAppTemplate } from '../_shared/whatsapp.ts'

// Dispara os 2 avisos de "onboarding concluido", chamado pelo proprio
// OnboardingPreLaunch.html logo apos o profile ser salvo, ANTES dos
// geradores de treino/nutricao (fire-and-forget -- nao atrasa o loading do
// usuario, e o gap humano de validacao do plano ja garante a ordem de
// chegada na pratica). Independente do resultado da geracao.
// 1. Usuario: "recebemos seu perfil, estamos montando" (sem link).
// 2. Sales: "novo aluno completou onboarding" + botao URL dinamica pro
//    dashboard (pro.ybytu.app/users/<userId>).
// So o proprio usuario pode chamar pra SI MESMO (JWT normal dele) -- mesmo
// padrao de ybytu-notify-plan-ready / ybytu-create-plan-share-token.
// Idempotente via onboarding_notified_at, evita duplo-envio em retry.
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp_phone, onboarding_notified_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (profile.onboarding_notified_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_notified' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userTemplateId = Deno.env.get('WHATSAPP_TEMPLATE_USER_ONBOARDING_RECEIVED') ?? ''
    const salesTemplateId = Deno.env.get('WHATSAPP_TEMPLATE_STAFF_NEW_ONBOARDING') ?? ''
    const salesPhone = Deno.env.get('PHONE_ADMIN_SALE') ?? ''
    const fullName = profile.full_name ?? 'aluno(a)'

    const results: Record<string, unknown> = {}

    if (profile.whatsapp_phone) {
      const result = await sendWhatsAppTemplate(supabase, userId, profile.whatsapp_phone, userTemplateId, [fullName])
      results.user = result.ok ? 'sent' : `failed: ${result.error}`
      if (!result.ok) console.error('Falha ao notificar usuario (onboarding_received):', result.error)
    } else {
      results.user = 'skipped: missing_whatsapp_phone'
    }

    if (salesPhone) {
      const result = await sendWhatsAppTemplate(supabase, userId, salesPhone, salesTemplateId, [fullName], userId)
      results.sales = result.ok ? 'sent' : `failed: ${result.error}`
      if (!result.ok) console.error('Falha ao notificar sales (new_onboarding):', result.error)
    } else {
      results.sales = 'skipped: missing_phone_admin_sale'
      console.error('Telefone nao configurado pro sales (PHONE_ADMIN_SALE)')
    }

    await supabase.from('profiles').update({ onboarding_notified_at: new Date().toISOString() }).eq('id', userId)

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-notify-onboarding-received error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
