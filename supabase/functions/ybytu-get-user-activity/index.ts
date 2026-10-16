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
      .select('id, current_training_plan_id, current_meal_plan_id, training_days_per_week, timezone')
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
      .select('id, completed_at, training_plan_id, day_number, session_name, exercise_count, exercises_done, auto_closed')
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
      .select('id, completed_at, meal_plan_id, day_order, meal_order, meal_name, meal_id, calories_consumed, meals_planned')
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

    // Refeições agrupadas por DATA no fuso do aluno (2026-10-15). O "dia
    // alimentar" é só esse agrupamento -- não existe registro de "dia
    // concluído" (docs/PRINCIPIOS_DE_PRODUTO.md: dia sem registro não é dia
    // sem comer). Só vêm os dias COM registro; a tela mostra os outros como
    // "sem registros". planned = refeições do dia do cardápio no momento do
    // registro (meals_planned; null nos registros antigos); se o aluno usou
    // dias de cardápio diferentes na mesma data, vale o maior. kcal é só a
    // soma do que foi registrado -- nunca comparar com a meta (decisão da
    // Taina 2026-10-15).
    let tz = 'America/Sao_Paulo'
    if (profile.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: profile.timezone })
        tz = profile.timezone
      } catch { /* fuso inválido: padrão */ }
    }
    const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })

    // "Sem registro" na linha expandida (desenho AlunoAlimentacaoCheckin.dc.html):
    // as refeições planejadas daquele dia de cardápio vêm do cardápio ATUAL
    // (meal_plan_meals), porque o histórico só guarda quantas eram
    // (meals_planned), não quais. Só listamos os nomes quando dá para provar
    // que o cardápio daquele dia não mudou: mesma quantidade de refeições e
    // todo prato registrado presente nele. Senão, só a contagem.
    const pairKey = (planId: string, dayOrder: number) => `${planId}|${dayOrder}`
    const pairs = [...new Set(meals.filter((m) => m.meal_plan_id).map((m) => pairKey(m.meal_plan_id, m.day_order)))]
    const slotsByPair = new Map<string, Array<{ meal_order: number; meal_type_id: string; meal_id: string }>>()
    const planIds = [...new Set(pairs.map((k) => k.split('|')[0]))]
    if (planIds.length) {
      const { data: slotRows, error: sError } = await supabase
        .from('meal_plan_meals')
        .select('meal_plan_id, day_order, meal_order, meal_type_id, meal_id')
        .in('meal_plan_id', planIds)
      if (sError) throw sError
      for (const r of slotRows ?? []) {
        const k = pairKey(r.meal_plan_id, r.day_order)
        if (!pairs.includes(k)) continue
        const list = slotsByPair.get(k) ?? []
        list.push(r)
        slotsByPair.set(k, list)
      }
      const extraTypes = [...new Set([...slotsByPair.values()].flat().map((r) => r.meal_type_id).filter((t) => t && !mealTypeNameBySlug.has(t)))]
      if (extraTypes.length) {
        const { data: typeRows, error: tError } = await supabase
          .from('meal_types')
          .select('meal_type_id, name_ptbr')
          .in('meal_type_id', extraTypes)
        if (tError) throw tError
        for (const t of typeRows ?? []) mealTypeNameBySlug.set(t.meal_type_id, t.name_ptbr)
      }
    }

    type DayGroup = { meal_plan_id: string | null; menu_day: number | null; registered_ids: string[]; unregistered: Array<{ meal_order: number; meal_type_ptbr: string | null }> | null; unregistered_count: number | null }
    const dayMap = new Map<string, { date: string; registered: number; planned: number | null; kcal_registered: number; meal_ids: string[]; groups: DayGroup[] }>()
    for (const m of meals) {
      const date = localDate.format(new Date(m.completed_at))
      const d = dayMap.get(date) ?? { date, registered: 0, planned: null, kcal_registered: 0, meal_ids: [], groups: [] }
      d.registered += 1
      if (m.meals_planned != null) d.planned = Math.max(d.planned ?? 0, m.meals_planned)
      if (m.kcal != null) d.kcal_registered += Number(m.kcal)
      d.meal_ids.push(m.id)
      let g = d.groups.find((x) => x.meal_plan_id === (m.meal_plan_id ?? null) && x.menu_day === (m.day_order ?? null))
      if (!g) {
        g = { meal_plan_id: m.meal_plan_id ?? null, menu_day: m.day_order ?? null, registered_ids: [], unregistered: null, unregistered_count: null }
        d.groups.push(g)
      }
      g.registered_ids.push(m.id)
      dayMap.set(date, d)
    }
    const mealById = new Map(meals.map((m) => [m.id, m]))
    for (const d of dayMap.values()) {
      for (const g of d.groups) {
        const regs = g.registered_ids.map((id) => mealById.get(id)!)
        const planned = Math.max(0, ...regs.map((r) => r.meals_planned ?? 0)) || null
        const slots = g.meal_plan_id != null && g.menu_day != null ? (slotsByPair.get(pairKey(g.meal_plan_id, g.menu_day)) ?? []) : []
        const regMealIds = regs.map((r) => r.meal_id).filter(Boolean)
        const unchanged = planned != null && slots.length === planned && regMealIds.every((id) => slots.some((sl) => sl.meal_id === id))
        if (unchanged) {
          const used = new Set<string>()
          g.unregistered = slots
            .filter((sl) => {
              if (regMealIds.includes(sl.meal_id) && !used.has(sl.meal_id)) { used.add(sl.meal_id); return false }
              return true
            })
            .sort((a, b) => a.meal_order - b.meal_order)
            .map((sl) => ({ meal_order: sl.meal_order, meal_type_ptbr: mealTypeNameBySlug.get(sl.meal_type_id) ?? null }))
          g.unregistered_count = g.unregistered.length
        } else if (planned != null) {
          g.unregistered_count = Math.max(0, planned - regs.length)
        }
      }
    }
    const meal_days = [...dayMap.values()].sort((a, b) => b.date.localeCompare(a.date))

    // Treinos por dia (2026-10-16), no mesmo fuso, com os exercícios marcados
    // em cada sessão (completed_exercises.workout_id) e a carga registrada.
    // Só dias COM treino: dia sem treino é descanso na maioria dos planos, o
    // mapa de calor já mostra a frequência.
    const workoutIds = workouts.map((w) => w.id)
    const marksByWorkout = new Map<string, Array<{ exercise_id: string; name_ptbr: string | null; load_kg: number | null; completed_at: string }>>()
    if (workoutIds.length) {
      const { data: markRows, error: mkError } = await supabase
        .from('completed_exercises')
        .select('workout_id, exercise_id, load_kg, completed_at')
        .in('workout_id', workoutIds)
        .order('completed_at', { ascending: true })
      if (mkError) throw mkError
      const exIds = [...new Set((markRows ?? []).map((r) => r.exercise_id))]
      const exName = new Map<string, string>()
      if (exIds.length) {
        const { data: exRows, error: exError } = await supabase.from('exercises').select('exercise_id, name_ptbr').in('exercise_id', exIds)
        if (exError) throw exError
        for (const e of exRows ?? []) exName.set(e.exercise_id, e.name_ptbr)
      }
      for (const r of markRows ?? []) {
        const list = marksByWorkout.get(r.workout_id) ?? []
        list.push({ exercise_id: r.exercise_id, name_ptbr: exName.get(r.exercise_id) ?? null, load_kg: r.load_kg != null ? Number(r.load_kg) : null, completed_at: r.completed_at })
        marksByWorkout.set(r.workout_id, list)
      }
    }
    const workoutDayMap = new Map<string, { date: string; workouts: Array<Record<string, unknown>> }>()
    for (const w of workouts) {
      const date = localDate.format(new Date(w.completed_at))
      const d = workoutDayMap.get(date) ?? { date, workouts: [] }
      d.workouts.push({ ...w, exercises: marksByWorkout.get(w.id) ?? [] })
      workoutDayMap.set(date, d)
    }
    const workout_days = [...workoutDayMap.values()].sort((a, b) => b.date.localeCompare(a.date))
    const today_local = localDate.format(new Date())

    return new Response(JSON.stringify({ summary, workouts, workout_days, meals, meal_days, timezone: tz, today_local }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('ybytu-get-user-activity error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
