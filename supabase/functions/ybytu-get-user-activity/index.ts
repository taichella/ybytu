import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Telemetria de atividades registradas pelo aluno no app (treino e nutrição).
// Acessível apenas por membros do staff autenticados (admin, personal, nutricionista).
// Retorna registros reais e métricas baseadas estritamente em check-ins confirmados.
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

    const hasAccess = requireRole(auth.staff, 'admin') || requireRole(auth.staff, 'personal') || requireRole(auth.staff, 'nutricionista')
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const url = new URL(req.url)
    const userId = body?.userId || body?.id || url.searchParams.get('userId') || url.searchParams.get('id')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Perfil para cruzar plano ativo e frequência combinada
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, current_training_plan_id, current_meal_plan_id, training_days_per_week')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Janela do mapa de calor do UsuarioDetalhe.dc.html: 12 semanas (84 dias).
    // Por data, não por limite de linhas -- um aluno com 2 sessões/dia passaria
    // de qualquer limite fixo e cortaria o começo do mapa.
    const windowStart = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString()

    // 2. Treinos registrados pelo aluno nas últimas 12 semanas
    const { data: workoutRows, error: wError } = await supabase
      .from('completed_workouts')
      .select('id, completed_at, training_plan_id, day_number, session_name')
      .eq('user_id', userId)
      .gte('completed_at', windowStart)
      .order('completed_at', { ascending: false })

    if (wError) throw wError

    // 3. Refeições registradas pelo aluno nas últimas 12 semanas
    const { data: mealRows, error: mError } = await supabase
      .from('completed_meals')
      .select('id, completed_at, meal_plan_id, day_order, meal_order, meal_name')
      .eq('user_id', userId)
      .gte('completed_at', windowStart)
      .order('completed_at', { ascending: false })
      .limit(200)

    if (mError) throw mError

    // 3b. Nº de exercícios de cada sessão ("6 exercícios" na lista do desenho).
    // training_plan_exercises é por SLUG (training_plans.training_plan_id), o
    // check-in grava o uuid (training_plans.id) -- mesma landmine do buildPlanPayload.
    const exerciseCountByPlanDay = new Map<string, number>()
    const workoutPlanUuids = [...new Set((workoutRows ?? []).map((w) => w.training_plan_id).filter(Boolean))]
    if (workoutPlanUuids.length) {
      const { data: planRows, error: pError } = await supabase
        .from('training_plans')
        .select('id, training_plan_id')
        .in('id', workoutPlanUuids)
      if (pError) throw pError
      const uuidBySlug = new Map((planRows ?? []).map((p) => [p.training_plan_id, p.id]))
      if (uuidBySlug.size) {
        const { data: tpeRows, error: tpeError } = await supabase
          .from('training_plan_exercises')
          .select('training_plan_id, day_number')
          .in('training_plan_id', [...uuidBySlug.keys()])
        if (tpeError) throw tpeError
        for (const r of tpeRows ?? []) {
          const key = `${uuidBySlug.get(r.training_plan_id)}_${r.day_number}`
          exerciseCountByPlanDay.set(key, (exerciseCountByPlanDay.get(key) ?? 0) + 1)
        }
      }
    }

    // 3c. kcal e tipo de cada refeição registrada ("520 kcal consumidas" no desenho).
    // Landmine INVERSA do lado nutrição: meal_plan_meals.meal_plan_id e .meal_id
    // são TEXT guardando uuid (meal_plans.id / meals.id), não slug.
    const slotByKey = new Map<string, { meal_type_id: string; meal_id: string }>()
    const kcalByMealId = new Map<string, number | null>()
    const mealTypeNameBySlug = new Map<string, string>()
    const mealPlanUuids = [...new Set((mealRows ?? []).map((m) => m.meal_plan_id).filter(Boolean))]
    if (mealPlanUuids.length) {
      const { data: slotRows, error: sError } = await supabase
        .from('meal_plan_meals')
        .select('meal_plan_id, day_order, meal_order, meal_type_id, meal_id')
        .in('meal_plan_id', mealPlanUuids)
      if (sError) throw sError
      for (const s of slotRows ?? []) {
        slotByKey.set(`${s.meal_plan_id}_${s.day_order}_${s.meal_order}`, s)
      }
      const mealIds = [...new Set((slotRows ?? []).map((s) => s.meal_id).filter(Boolean))]
      const typeIds = [...new Set((slotRows ?? []).map((s) => s.meal_type_id).filter(Boolean))]
      const [mealsRes, typesRes] = await Promise.all([
        mealIds.length ? supabase.from('meals').select('id, calories').in('id', mealIds) : Promise.resolve({ data: [], error: null }),
        typeIds.length ? supabase.from('meal_types').select('meal_type_id, name_ptbr').in('meal_type_id', typeIds) : Promise.resolve({ data: [], error: null }),
      ])
      if (mealsRes.error) throw mealsRes.error
      if (typesRes.error) throw typesRes.error
      for (const m of mealsRes.data ?? []) kcalByMealId.set(m.id, m.calories != null ? Math.round(Number(m.calories)) : null)
      for (const t of typesRes.data ?? []) mealTypeNameBySlug.set(t.meal_type_id, t.name_ptbr)
    }

    // 4. Último acesso ao app (auth.users via admin API)
    let lastSignInAt = null
    const { data: authUserData } = await supabase.auth.admin.getUserById(userId)
    if (authUserData?.user) {
      lastSignInAt = authUserData.user.last_sign_in_at
    }

    const summary = {
      last_sign_in_at: lastSignInAt,
      window_start: windowStart,
      training_days_per_week: profile.training_days_per_week ?? null,
    }

    const workouts = (workoutRows ?? []).map((w) => ({
      ...w,
      exercise_count: w.training_plan_id ? (exerciseCountByPlanDay.get(`${w.training_plan_id}_${w.day_number}`) ?? null) : null,
      is_current_plan: w.training_plan_id ? w.training_plan_id === profile.current_training_plan_id : null,
    }))

    const meals = (mealRows ?? []).map((m) => {
      const slot = slotByKey.get(`${m.meal_plan_id}_${m.day_order}_${m.meal_order}`)
      return {
        ...m,
        kcal: slot ? (kcalByMealId.get(slot.meal_id) ?? null) : null,
        meal_type_ptbr: slot ? (mealTypeNameBySlug.get(slot.meal_type_id) ?? null) : null,
        is_current_plan: m.meal_plan_id ? m.meal_plan_id === profile.current_meal_plan_id : null,
      }
    })

    return new Response(JSON.stringify({ summary, workouts, meals }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('ybytu-get-user-activity error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
