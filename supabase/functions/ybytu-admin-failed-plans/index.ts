import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Lista perfis com plan_generation_status='failed' pra alimentar a tela "Ver
// planos que falharam" (Campaign.jsx). Visível pra qualquer staff ativo,
// mesmo critério de ybytu-campaign-stats — não é fila de trabalho pessoal,
// é visão operacional. Ação de retry fica numa function separada
// (ybytu-admin-retry-plan-generation), admin-only.
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

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, subscription_type_id, plan_generation_error, created_at, current_training_plan_id, current_meal_plan_id')
      .eq('plan_generation_status', 'failed')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({
      failed: (data ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        subscription_type_id: p.subscription_type_id,
        error_message: p.plan_generation_error,
        created_at: p.created_at,
        has_training_plan: !!p.current_training_plan_id,
        has_meal_plan: !!p.current_meal_plan_id,
      })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('ybytu-admin-failed-plans error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
