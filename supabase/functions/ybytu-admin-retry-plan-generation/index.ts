import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Mesmos ids que o onboarding usa (apps/OnboardingPreLaunch.html,
// SUBSCRIPTION_PLANS) — decide quais geradores rodar de novo pra este perfil.
const SUBSCRIPTION_PLANS = {
  TRAINING: '3a5ccc00-77ed-4b87-8e83-bc35be63a862',
  MEAL: '7458939c-ed4b-4a16-960e-b647f94e6a9b',
  COMPLETE: '7b5502f1-eeed-4640-8c4f-0ebc0502481e',
}

// Retry admin-only pra um plano com plan_generation_status='failed'. Chama os
// mesmos geradores que o onboarding chama, mas autenticado via
// INTERNAL_FUNCTION_SECRET + user_id explícito no corpo — NUNCA o
// service_role key direto, e NUNCA um user_id vindo de fora sem passar antes
// pelo gate admin desta function (mesma lição do generate_user_plans deletado
// por impersonação — ver memória do projeto).
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.reason }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!requireRole(auth.staff, 'admin')) {
      return new Response(JSON.stringify({ error: 'admin_only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const userId = typeof body?.user_id === 'string' ? body.user_id : null
    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_type_id, plan_generation_status')
      .eq('id', userId)
      .single()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (profile.plan_generation_status !== 'failed') {
      return new Response(JSON.stringify({ error: 'not_failed', current_status: profile.plan_generation_status }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const wantsTraining = [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(profile.subscription_type_id)
    const wantsMeal = [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(profile.subscription_type_id)

    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    async function invokeGenerator(fnName: string) {
      const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalSecret}` },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok && data?.success === true, status: res.status, data }
    }

    const results: Record<string, unknown> = {}
    if (wantsTraining) results.training = await invokeGenerator('ybytu-generate-training-plan')
    if (wantsMeal) results.meal = await invokeGenerator('ybytu-generate-meal-plan')

    // plan_generation_status já foi reescrito pelos próprios geradores
    // (ok em cada sucesso, failed com o novo motivo em cada falha) — não
    // reescrevemos aqui de novo, só reportamos o resultado agregado.
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-admin-retry-plan-generation error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
