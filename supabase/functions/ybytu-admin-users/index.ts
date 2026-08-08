import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

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

    // Role check: Admin, Personal, or Nutricionista
    const hasAccess = requireRole(auth.staff, 'admin') || requireRole(auth.staff, 'personal') || requireRole(auth.staff, 'nutricionista')
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const url = new URL(req.url)
    const userId = body?.id || url.searchParams.get('id')

    if (userId) {
      // Detail Mode
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch lookup tables for labels
      const fetchLookup = async (table: string, id: string | null, col: string = 'name_ptbr') => {
        if (!id) return null
        const { data } = await supabase.from(table).select(`id, ${col}`).eq('id', id).maybeSingle()
        return data ? data[col] : null
      }

      const fetchLookupMulti = async (table: string, ids: string[] | null, col: string = 'name_ptbr') => {
        if (!ids || ids.length === 0) return []
        const { data } = await supabase.from(table).select(`id, ${col}`).in('id', ids)
        return (data || []).map(row => row[col])
      }

      const gender = await fetchLookup('genders', profile.gender_id, 'label_ptbr')
      const activityLevel = await fetchLookup('activity_levels', profile.activity_level_id, 'label_ptbr')
      const dietaryPreference = await fetchLookup('dietary_preferences', profile.dietary_preference_id, 'name_ptbr')
      const exerciseLevel = await fetchLookup('exercise_levels', profile.exercise_level_id, 'name_ptbr')
      const exerciseEnvironment = await fetchLookup('exercise_environment', profile.exercise_environment_id, 'name_ptbr')

      const goals = await fetchLookupMulti('goals', profile.goals_ids, 'name_ptbr')
      const healthConditions = await fetchLookupMulti('health_conditions', profile.health_conditions_ids, 'name_ptbr')
      const physicalConditions = await fetchLookupMulti('physical_conditions', profile.physical_conditions_ids, 'name_ptbr')
      const dietaryRestrictions = await fetchLookupMulti('dietary_restrictions', profile.dietary_restrictions_ids, 'name_ptbr')
      const muscleGroups = await fetchLookupMulti('muscle_groups', profile.muscle_groups_ids, 'name_ptbr')
      const exerciseEquipments = await fetchLookupMulti('exercise_equipments', profile.exercise_equipments_ids, 'name_ptbr')

      let subName = null
      if (profile.subscription_type_id) {
          const { data: subData } = await supabase.from('subscription_types').select('name_ptbr').eq('id', profile.subscription_type_id).maybeSingle()
          if (subData) subName = subData.name_ptbr
      }

      const resolved = {
        gender,
        activityLevel,
        dietaryPreference,
        exerciseLevel,
        exerciseEnvironment,
        goals,
        healthConditions,
        physicalConditions,
        dietaryRestrictions,
        muscleGroups,
        exerciseEquipments,
        subscriptionName: subName
      }

      return new Response(JSON.stringify({ profile, resolved }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // List Mode
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          subscription_type_id,
          goals_ids,
          exercise_level_id,
          current_training_plan_id,
          current_meal_plan_id,
          onboarding_completed
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Need to resolve just enough to show in the list (e.g. goals, level, sub, and plan review status)
      // Since fetching all lookup multi for all users is slow, we'll fetch the whole lookups once and map
      const [goalsRes, levelsRes, subsRes, reviewsRes] = await Promise.all([
          supabase.from('goals').select('id, name_ptbr'),
          supabase.from('exercise_levels').select('id, name_ptbr'),
          supabase.from('subscription_types').select('id, name_ptbr'),
          supabase.from('plan_reviews').select('user_id, role')
      ])

      const goalsMap = new Map((goalsRes.data || []).map(g => [g.id, g.name_ptbr]))
      const levelsMap = new Map((levelsRes.data || []).map(l => [l.id, l.name_ptbr]))
      const subsMap = new Map((subsRes.data || []).map(s => [s.id, s.name_ptbr]))

      const reviewsByUser = new Map()
      for (const r of (reviewsRes.data || [])) {
          if (!reviewsByUser.has(r.user_id)) reviewsByUser.set(r.user_id, new Set())
          reviewsByUser.get(r.user_id).add(r.role)
      }

      const mappedUsers = (profiles || []).map(p => {
          const userGoals = (p.goals_ids || []).map((id: string) => goalsMap.get(id)).filter(Boolean)
          const levelName = p.exercise_level_id ? levelsMap.get(p.exercise_level_id) : '—'
          const subName = p.subscription_type_id ? subsMap.get(p.subscription_type_id) : 'Free'

          const userReviews = reviewsByUser.get(p.id) || new Set()
          const needsReview = (p.current_training_plan_id && !userReviews.has('personal')) ||
                              (p.current_meal_plan_id && !userReviews.has('nutricionista'))

          return {
              ...p,
              resolvedGoals: userGoals,
              resolvedLevel: levelName,
              resolvedSub: subName,
              needsReview
          }
      })

      return new Response(JSON.stringify(mappedUsers), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (err) {
    console.error('ybytu-admin-users error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
