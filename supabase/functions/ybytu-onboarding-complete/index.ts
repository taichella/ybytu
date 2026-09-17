import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { claimGenerationJob, runGenerationAndVerify } from '../_shared/onboardingOrchestration.ts'

// Substitui a orquestração que morava no NAVEGADOR (OnboardingPreLaunch.html
// chamava meal → training em sequência, um await por vez) -- achado
// 2026-09-17 (revisão Antigravity): se o aluno fechasse a aba entre as duas
// chamadas, a segunda nunca disparava, e não havia rede de segurança pra
// detectar isso depois (plan_generation_status ficava 'pending' pra sempre,
// invisível em FailedPlans). Agora: o client chama UMA vez, autenticado pelo
// próprio JWT, e a orquestração inteira roda aqui dentro da MESMA request
// (sequencial, sem EdgeRuntime.waitUntil -- os tempos reais medidos em
// produção, 13-57s, cabem folgados no limite duro de 150s das Edge
// Functions). Fechar a aba não interrompe mais nada: o profile já foi salvo
// e a geração já está rodando no servidor antes do client sequer decidir se
// vai esperar a resposta.
//
// Duas formas de chamar:
// 1. O PRÓPRIO usuário (JWT), logo após o signUp -- manda { profile: {...} }
//    com os dados do onboarding, faz upsert+update, e então gera.
// 2. Chamada interna (INTERNAL_FUNCTION_SECRET) -- cron de retomada
//    (ybytu-onboarding-retry-cron) ou retry manual do staff
//    (ybytu-admin-retry-plan-generation) -- manda só { user_id }, perfil já
//    existe, só re-roda claim+geração.
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const internalCall = isInternalServiceCall(req)
    let userId: string
    let profileData: Record<string, unknown> | null = null

    if (internalCall) {
      const body = await req.json().catch(() => null)
      userId = typeof body?.user_id === 'string' ? body.user_id : ''
      if (!userId) {
        return new Response(JSON.stringify({ error: 'missing_user_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
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
      userId = user.id

      const body = await req.json().catch(() => null)
      profileData = body?.profile ?? null
      if (!profileData) {
        return new Response(JSON.stringify({ error: 'missing_profile' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 1. Salva o profile -- só no caminho self-service (widget). Retry/cron
    // não reenviam respostas do onboarding, só re-tentam a geração sobre o
    // que já está salvo.
    if (profileData) {
      const identity = profileData.identity as Record<string, unknown> | undefined
      const onboarding = profileData.onboarding as Record<string, unknown> | undefined
      if (!identity || !onboarding) {
        return new Response(JSON.stringify({ error: 'malformed_profile_payload' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId, ...identity })
      if (upsertError) throw new Error(`upsert profile falhou: ${upsertError.message}`)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ...onboarding, onboarding_completed: true })
        .eq('id', userId)
      if (updateError) throw new Error(`update profile falhou: ${updateError.message}`)
    }

    // 2. Reivindica atomicamente -- duas chamadas concorrentes pro mesmo
    // userId (ex: duplo clique que escapou da guarda do client, ou o cron
    // rodando bem na hora de um retry manual) só uma ganha a linha.
    const claim = await claimGenerationJob(supabase, userId)
    if (!claim.claimed) {
      return new Response(JSON.stringify({ ok: true, skipped: claim.reason }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Gera (sequencial, meal → training) + confere de verdade + grava
    // status real -- nunca 'ok' só porque as chamadas não deram erro.
    const result = await runGenerationAndVerify(supabase, userId, claim.startedAt)

    // 4. Avisa o staff que tem parecer pendente -- dispara sempre, mesmo em
    // falha parcial (a própria function já só age de fato quando
    // plan_generation_status === 'ok', então chamar sempre é seguro e evita
    // depender do client sobreviver até aqui pra isso acontecer).
    try {
      const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      await fetch(`${supabaseUrl}/functions/v1/ybytu-notify-plan-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalSecret}` },
        body: JSON.stringify({ user_id: userId }),
      })
    } catch (notifyErr) {
      console.error('[ybytu-onboarding-complete] ybytu-notify-plan-ready falhou (fail-soft):', notifyErr)
    }

    return new Response(JSON.stringify({
      ok: true,
      plan_generation_status: result.status,
      plan_generation_error: result.error ?? null,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('ybytu-onboarding-complete error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
