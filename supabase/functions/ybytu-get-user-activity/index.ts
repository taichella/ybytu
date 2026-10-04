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

    // 2. Treinos registrados pelo aluno nas últimas 12 semanas.
    // exercise_count é gravado pelo banco NO MOMENTO do check-in (trigger da
    // migration 20261004120000) -- nunca recontar no plano atual: salvar o plano
    // apaga e recria as linhas de exercício, e a conta mudaria em silêncio.
    const { data: workoutRows, error: wError } = await supabase
      .from('completed_workouts')
      .select('id, completed_at, training_plan_id, day_number, session_name, exercise_count')
      .eq('user_id', userId)
      .gte('completed_at', windowStart)
      .order('completed_at', { ascending: false })

    if (wError) throw wError

    // 3. Refeições registradas pelo aluno nas últimas 12 semanas.
    // meal_id e calories_consumed também são gravados no check-in (mesma
    // migration). NÃO buscar o prato pela posição (day_order/meal_order) no
    // cardápio atual: editar o cardápio troca o prato daquela posição.
    const { data: mealRows, error: mError } = await supabase
      .from('completed_meals')
      .select('id, completed_at, meal_plan_id, day_order, meal_order, meal_name, meal_id, calories_consumed')
      .eq('user_id', userId)
      .gte('completed_at', windowStart)
      .order('completed_at', { ascending: false })
      .limit(200)

    if (mError) throw mError

    // 3b. Tipo da refeição (ícone na lista), pelo PRATO gravado (meals.meal_type),
    // não pela posição no cardápio.
    const mealTypeByMealId = new Map<string, string>()
    const mealTypeNameBySlug = new Map<string, string>()
    const mealIds = [...new Set((mealRows ?? []).map((m) => m.meal_id).filter(Boolean))]
    if (mealIds.length) {
      const { data: mealCatalog, error: mcError } = await supabase
        .from('meals')
        .select('id, meal_type')
        .in('id', mealIds)
      if (mcError) throw mcError
      for (const m of mealCatalog ?? []) if (m.meal_type) mealTypeByMealId.set(m.id, m.meal_type)
      const typeIds = [...new Set(mealTypeByMealId.values())]
      if (typeIds.length) {
        const { data: typeRows, error: tError } = await supabase
          .from('meal_types')
          .select('meal_type_id, name_ptbr')
          .in('meal_type_id', typeIds)
        if (tError) throw tError
        for (const t of typeRows ?? []) mealTypeNameBySlug.set(t.meal_type_id, t.name_ptbr)
      }
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
      is_current_plan: w.training_plan_id ? w.training_plan_id === profile.current_training_plan_id : null,
    }))

    const meals = (mealRows ?? []).map((m) => {
      const mealType = m.meal_id ? mealTypeByMealId.get(m.meal_id) : undefined
      return {
        ...m,
        kcal: m.calories_consumed ?? null,
        meal_type_ptbr: mealType ? (mealTypeNameBySlug.get(mealType) ?? null) : null,
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
