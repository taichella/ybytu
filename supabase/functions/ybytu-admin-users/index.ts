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

      // ATENÇÃO: onboarding_physical_conditions / onboarding_muscle_groups /
      // onboarding_exercise_equipments são os catálogos CURADOS que o
      // onboarding realmente usa (7/9/7 linhas) -- physical_conditions,
      // muscle_groups e exercise_equipments são os catálogos grandes usados
      // em outro lugar (16/49/72 linhas), com UUIDs DIFERENTES. Resolver
      // contra a tabela errada sempre retorna vazio (find por id que não
      // existe lá), mesmo com o dado salvo certinho no profile. Bug
      // encontrado e corrigido 2026-08-22 (achado no teste E2E da Taina).
      const gender = await fetchLookup('genders', profile.gender_id, 'name_ptbr')
      const activityLevel = await fetchLookup('activity_levels', profile.activity_level_id, 'label_ptbr')
      const dietaryPreference = await fetchLookup('dietary_preferences', profile.dietary_preference_id, 'name_ptbr')
      const exerciseLevel = await fetchLookup('exercise_levels', profile.exercise_level_id, 'name_ptbr')
      const exerciseEnvironment = await fetchLookup('exercise_environment', profile.exercise_environment_id, 'name_ptbr')

      const goals = await fetchLookupMulti('goals', profile.goals_ids, 'name_ptbr')
      const healthConditions = await fetchLookupMulti('health_conditions', profile.health_conditions_ids, 'name_ptbr')
      const physicalConditions = await fetchLookupMulti('onboarding_physical_conditions', profile.physical_conditions_ids, 'name_ptbr')
      const dietaryRestrictions = await fetchLookupMulti('dietary_restrictions', profile.dietary_restrictions_ids, 'name_ptbr')
      const muscleGroups = await fetchLookupMulti('onboarding_muscle_groups', profile.muscle_groups_ids, 'name_ptbr')
      const exerciseEquipments = await fetchLookupMulti('onboarding_exercise_equipments', profile.exercise_equipments_ids, 'name_ptbr')

      let subName = null
      let subIncludesTraining = null
      let subIncludesMeals = null
      if (profile.subscription_type_id) {
          const { data: subData } = await supabase.from('subscription_types').select('name_ptbr, includes_training, includes_meals').eq('id', profile.subscription_type_id).maybeSingle()
          if (subData) {
            subName = subData.name_ptbr
            subIncludesTraining = subData.includes_training
            subIncludesMeals = subData.includes_meals
          }
      }

      // Histórico de Atribuições (UsuarioDetalhe.dc.html) -- user_training_plans
      // e user_meal_plans são logs append-only reais: toda geração de plano
      // insere uma linha nova aqui e NUNCA sobrescreve (ver ybytu-generate-
      // training-plan/ybytu-generate-meal-plan). Não existe aderência/duração/
      // status/responsável por atribuição no schema -- só nome do plano e data,
      // ver [[project_userdetail_design_gaps_product_decisions]] pro resto.
      const [{ data: utpRows }, { data: umpRows }] = await Promise.all([
        supabase.from('user_training_plans').select('training_plan_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_meal_plans').select('meal_plan_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      ])
      const trainingPlanUuids = [...new Set((utpRows ?? []).map(r => r.training_plan_id).filter(Boolean))]
      const mealPlanUuids = [...new Set((umpRows ?? []).map(r => r.meal_plan_id).filter(Boolean))]
      const [{ data: tpNameRows }, { data: mpNameRows }] = await Promise.all([
        trainingPlanUuids.length ? supabase.from('training_plans').select('id, name_ptbr').in('id', trainingPlanUuids) : Promise.resolve({ data: [] }),
        mealPlanUuids.length ? supabase.from('meal_plans').select('id, name_ptbr').in('id', mealPlanUuids) : Promise.resolve({ data: [] }),
      ])
      const tpNameById = new Map((tpNameRows ?? []).map(r => [r.id, r.name_ptbr]))
      const mpNameById = new Map((mpNameRows ?? []).map(r => [r.id, r.name_ptbr]))
      const planHistory = [
        ...(utpRows ?? []).map(r => ({
          kind: 'training',
          name: tpNameById.get(r.training_plan_id) ?? 'Plano de treino',
          assignedAt: r.created_at,
          isCurrent: r.training_plan_id === profile.current_training_plan_id,
        })),
        ...(umpRows ?? []).map(r => ({
          kind: 'nutrition',
          name: mpNameById.get(r.meal_plan_id) ?? 'Plano alimentar',
          assignedAt: r.created_at,
          isCurrent: r.meal_plan_id === profile.current_meal_plan_id,
        })),
      ].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())

      // last_sign_in_at mora em auth.users, não em profiles -- só dá pra ler
      // via admin API (service_role). Usado no card "Conta & Assinatura" do
      // UserDetail (dado real que a tela de design pedia e tinha como pegar).
      let lastSignInAt = null
      const { data: authUserData } = await supabase.auth.admin.getUserById(userId)
      if (authUserData?.user) lastSignInAt = authUserData.user.last_sign_in_at

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
        subscriptionName: subName,
        subscriptionIncludesTraining: subIncludesTraining,
        subscriptionIncludesMeals: subIncludesMeals,
        lastSignInAt,
        planHistory,
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
