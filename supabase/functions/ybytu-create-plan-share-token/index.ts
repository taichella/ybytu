import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { getOrCreatePlanShareToken } from '../_shared/planShareToken.ts'

// Fecha o débito "token criado na mão" -- chamado pelo onboarding (pilot:
// OnboardingPreLaunch.html; ver [[project_two_onboardings_distinction]])
// logo depois que os geradores terminam, junto com o update de
// plan_generation_status e a chamada a ybytu-notify-plan-ready. Só o PRÓPRIO
// usuário pode chamar pra SI MESMO (JWT normal dele) -- mesmo padrão de
// ybytu-notify-plan-ready, nunca aceita user_id no body. Fail-soft do lado
// de quem chama: não bloqueia o redirect pro WhatsApp se isso falhar.
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

    const planToken = await getOrCreatePlanShareToken(supabase, userId)
    const planUrl = `https://pro.ybytu.app/plano/${planToken}`

    return new Response(JSON.stringify({ ok: true, token: planToken, plan_url: planUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-create-plan-share-token error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
