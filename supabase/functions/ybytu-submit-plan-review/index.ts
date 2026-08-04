import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: auth.reason }),
        { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.userId || !body.role) {
       return new Response(
        JSON.stringify({ error: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // validate role request
    if (body.role !== 'personal' && body.role !== 'nutricionista') {
       return new Response(
        JSON.stringify({ error: 'invalid_role_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!requireRole(auth.staff, body.role)) {
       return new Response(
        JSON.stringify({ error: 'unauthorized_role_action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // plan_reviews.training_plan_id/meal_plan_id referenciam os SLUGs
    // (training_plans.training_plan_id / meal_plans.meal_plan_id, ambos
    // text), não os uuids que profiles.current_training_plan_id /
    // current_meal_plan_id guardam — nunca confiamos no que o client manda
    // aqui, resolvemos a partir do profile atual via service_role.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_training_plan_id, current_meal_plan_id')
      .eq('id', body.userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)

    let trainingPlanSlug: string | null = null
    if (profile?.current_training_plan_id) {
      const { data: trainingPlan } = await supabase
        .from('training_plans')
        .select('training_plan_id')
        .eq('id', profile.current_training_plan_id)
        .maybeSingle()
      trainingPlanSlug = trainingPlan?.training_plan_id ?? null
    }

    let mealPlanSlug: string | null = null
    if (profile?.current_meal_plan_id) {
      const { data: mealPlan } = await supabase
        .from('meal_plans')
        .select('meal_plan_id')
        .eq('id', profile.current_meal_plan_id)
        .maybeSingle()
      mealPlanSlug = mealPlan?.meal_plan_id ?? null
    }

    const { error: upsertError } = await supabase
      .from('plan_reviews')
      .upsert(
        {
          user_id: body.userId,
          role: body.role,
          reviewer_name: auth.staff.fullName,
          reviewer_credential: body.reviewer_credential || null,
          note_ptbr: body.note_ptbr || null,
          training_plan_id: trainingPlanSlug,
          meal_plan_id: mealPlanSlug,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id, role' }
      )

    if (upsertError) throw new Error(`Plan review upsert error: ${upsertError.message}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-submit-plan-review error:', err)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
