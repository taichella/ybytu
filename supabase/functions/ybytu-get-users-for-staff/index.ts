import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'

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

    // List all users from the profiles table. We use service_role to bypass RLS.
    // For a real app, pagination should be handled here, but for this PR we'll
    // fetch all or a limited set that fits the dashboard's needs.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        age,
        weight_kg,
        height_cm,
        gender_id,
        activity_level_id,
        exercise_level_id,
        subscription_type_id,
        goals_ids,
        plan_generation_status,
        current_training_plan_id,
        current_meal_plan_id
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(`Lookup de profiles falhou: ${error.message}`)

    // gender_id, exercise_level_id e goals_ids são UUIDs que referenciam
    // tabelas de lookup (genders/exercise_levels/goals) — o dashboard não
    // tem acesso a elas (RLS deny-all), então resolvemos os rótulos aqui
    // com o service_role antes de devolver pro frontend.
    const [gendersRes, levelsRes, goalsRes] = await Promise.all([
      supabase.from('genders').select('id, name_ptbr'),
      supabase.from('exercise_levels').select('id, name_ptbr'),
      supabase.from('goals').select('id, name_ptbr'),
    ])

    const genderLabels = new Map((gendersRes.data ?? []).map((g) => [g.id, g.name_ptbr]))
    const levelLabels = new Map((levelsRes.data ?? []).map((l) => [l.id, l.name_ptbr]))
    const goalLabels = new Map((goalsRes.data ?? []).map((g) => [g.id, g.name_ptbr]))

    const enrichedProfiles = (profiles ?? []).map((p) => ({
      ...p,
      gender_label: genderLabels.get(p.gender_id) ?? null,
      exercise_level_label: levelLabels.get(p.exercise_level_id) ?? null,
      goals_labels: (p.goals_ids ?? []).map((id: string) => goalLabels.get(id)).filter(Boolean),
    }))

    return new Response(JSON.stringify(enrichedProfiles), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-get-users-for-staff error:', err)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
