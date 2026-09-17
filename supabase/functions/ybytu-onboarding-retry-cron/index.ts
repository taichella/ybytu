import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { MAX_GENERATION_ATTEMPTS, STUCK_AFTER_MINUTES } from '../_shared/onboardingOrchestration.ts'

// Rede de segurança pro caso que FailedPlans nunca pegava: onboarding
// completo sem geração nenhuma ter sido sequer chamada (fechou a aba, ou a
// chamada única pra ybytu-onboarding-complete falhou por infra). Sem isso,
// plan_generation_status ficava 'pending' (default do schema) pra sempre --
// achado 2026-09-17 (revisão Antigravity). Rodado via pg_cron a cada 15min
// (ver migration 20260917150000).
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!isInternalServiceCall(req)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000).toISOString()

    const { data: stuckProfiles, error } = await supabase
      .from('profiles')
      .select('id, plan_generation_status, plan_generation_attempts')
      .eq('onboarding_completed', true)
      .lt('created_at', cutoff)
      .lt('plan_generation_attempts', MAX_GENERATION_ATTEMPTS)
      .or(`plan_generation_status.in.(pending,failed),and(plan_generation_status.eq.generating,plan_generation_started_at.lt.${cutoff})`)

    if (error) throw new Error(error.message)

    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const results: Array<{ user_id: string; status: number; body: unknown }> = []

    for (const profile of stuckProfiles ?? []) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/ybytu-onboarding-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalSecret}` },
          body: JSON.stringify({ user_id: profile.id }),
        })
        const body = await res.json().catch(() => ({}))
        results.push({ user_id: profile.id, status: res.status, body })
      } catch (fetchErr) {
        console.error(`[ybytu-onboarding-retry-cron] falha ao retomar ${profile.id}:`, fetchErr)
        results.push({ user_id: profile.id, status: 0, body: { error: String(fetchErr) } })
      }
    }

    return new Response(JSON.stringify({ ok: true, retried: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-onboarding-retry-cron error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
