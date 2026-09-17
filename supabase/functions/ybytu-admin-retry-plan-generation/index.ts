import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Retry admin-only pra um plano travado/falho. Reseta plan_generation_attempts
// (senão o cron de retomada, que respeita o limite de 3 tentativas, poderia
// achar que já esgotou e nunca mais tentar de novo sozinho) e delega a
// ybytu-onboarding-complete (mesma lógica de claim atômico + geração
// sequencial + conferência real que o cron e o widget usam -- ver
// _shared/onboardingOrchestration.ts). Antes esta function chamava os
// geradores diretamente e duplicava a decisão de isTraining/isMeal; agora um
// só lugar decide isso, lendo subscription_type_id do banco.
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
      .select('id, plan_generation_status')
      .eq('id', userId)
      .single()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Retry manual é o botão de "última linha" -- funciona em qualquer status
    // que não seja 'ok' (não só 'failed'), incluindo 'pending'/'generating'
    // travados que o cron já desistiu por terem passado de 3 tentativas.
    if (profile.plan_generation_status === 'ok') {
      return new Response(JSON.stringify({ error: 'already_ok', current_status: profile.plan_generation_status }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Zera o contador ANTES de reivindicar -- senão claimGenerationJob (que
    // respeita o limite de 3) recusaria uma 4ª tentativa mesmo sendo um
    // retry manual explícito do staff.
    const { error: resetError } = await supabase
      .from('profiles')
      .update({ plan_generation_attempts: 0 })
      .eq('id', userId)
    if (resetError) throw new Error(`reset de plan_generation_attempts falhou: ${resetError.message}`)

    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const res = await fetch(`${supabaseUrl}/functions/v1/ybytu-onboarding-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalSecret}` },
      body: JSON.stringify({ user_id: userId }),
    })
    const result = await res.json().catch(() => ({}))

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-admin-retry-plan-generation error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
