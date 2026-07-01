import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Mifflin-St Jeor + safety floor ──────────────────────────────────────────
// non_binary/not_declared → female formula (conservative)
function calcTargetCalories(p: {
  gender_slug: string
  age: number
  weight_kg: number
  height_cm: number
  activity_slug: string
  goal_slugs: string[]
}): number {
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age
  const bmr  = p.gender_slug === 'male' ? base + 5 : base - 161

  const activityFactor: Record<string, number> = {
    sedentary:      1.200,
    lightly_active: 1.375,
    active:         1.550,
    very_active:    1.725,
  }
  const tdee = bmr * (activityFactor[p.activity_slug] ?? 1.375)

  // weight_loss beats hypertrophy on conflict (safety wins)
  const goalFactor = p.goal_slugs.includes('weight_loss') ? 0.80
                   : p.goal_slugs.includes('hypertrophy')  ? 1.10
                   : 1.00

  const raw   = Math.round(tdee * goalFactor)
  const floor = p.gender_slug === 'male' ? 1500 : 1200
  return Math.max(raw, floor)
}

// ─── Subscription gate ────────────────────────────────────────────────────────
const MEAL_SUBSCRIPTION_IDS = new Set([
  '7458939c-ed4b-4a16-960e-b647f94e6a9b', // MEAL
  '7b5502f1-eeed-4640-8c4f-0ebc0502481e', // COMPLETE
])

// ─── Gemini flash ─────────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<any> {
  const listRes  = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const listData = await listRes.json()
  const models   = (listData.models ?? []).filter((m: any) =>
    m.supportedGenerationMethods?.includes('generateContent')
  )
  const model = models.find((m: any) => m.name.includes('flash'))
             ?? models.find((m: any) => m.name.includes('pro'))
  if (!model) throw new Error('No Gemini model available')

  const url = `https://generativelanguage.googleapis.com/v1beta/${model.name}:generateContent?key=${apiKey}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    })
    const data = await res.json()

    if (data.error?.code === 503 || data.error?.code === 429) {
      if (attempt === 3) throw new Error('Gemini overloaded: ' + data.error.message)
      await new Promise(r => setTimeout(r, attempt * 3000))
      continue
    }
    if (data.error) throw new Error('Gemini error: ' + JSON.stringify(data.error))

    return JSON.parse(
      data.candidates[0].content.parts[0].text
        .replace(/```json/gi, '').replace(/```/g, '').trim()
    )
  }
}

// ─── Dietary hierarchy helpers ────────────────────────────────────────────────
// Lower rank = more restrictive. Used to derive the plan's dietary_preference
// from the selected meals (most restrictive wins).
const PREF_RANK: Record<string, number> = { vegan: 1, vegetarian: 2, pescetarian: 3 }
const RANK_PREF: Record<number, string> = { 1: 'vegan', 2: 'vegetarian', 3: 'pescetarian', 4: 'omnivore' }

function derivePlanPreference(meals: Array<{ dietary_preference: string | null }>): string {
  let minRank = 4
  for (const m of meals) {
    const rank = PREF_RANK[m.dietary_preference ?? ''] ?? 4
    if (rank < minRank) minRank = rank
  }
  return RANK_PREF[minRank] ?? 'omnivore'
}

// Union of all restriction_tags present in the selected meals — never hardcoded.
// Guarantees the plan won't lie if promoted to is_active=true later.
function derivePlanTags(meals: Array<{ restriction_tags: string[] | null }>): string[] {
  return [...new Set(meals.flatMap(m => m.restriction_tags ?? []))].sort()
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth: userId from JWT, never from body
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return new Response(
      JSON.stringify({ success: false, error: 'Missing authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    const userId = user.id

    // ── PASSO 0: ler perfil ──────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, age, weight_kg, height_cm, meals_per_day, gender_id, activity_level_id, dietary_preference_id, dietary_restrictions_ids, goals_ids, subscription_type_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) throw new Error('Profile not found')

    if (!MEAL_SUBSCRIPTION_IDS.has(profile.subscription_type_id)) {
      return new Response(
        JSON.stringify({ success: false, access_denied: true, message: 'Subscription does not include meal plans.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── PASSO 0: traduzir UUIDs → slugs em paralelo ──────────────────────────
    const [genderRes, activityRes, preferenceRes, restrictionsRes, goalsRes] = await Promise.all([
      profile.gender_id
        ? supabase.from('genders').select('name').eq('id', profile.gender_id).single()
        : Promise.resolve({ data: { name: 'not_declared' }, error: null }),

      profile.activity_level_id
        ? supabase.from('activity_levels').select('name').eq('id', profile.activity_level_id).single()
        : Promise.resolve({ data: { name: 'sedentary' }, error: null }),

      profile.dietary_preference_id
        ? supabase.from('dietary_preferences').select('dietary_preference_id').eq('id', profile.dietary_preference_id).single()
        : Promise.resolve({ data: { dietary_preference_id: 'omnivore' }, error: null }),

      profile.dietary_restrictions_ids?.length > 0
        ? supabase.from('dietary_restrictions').select('dietary_restriction_id').in('id', profile.dietary_restrictions_ids)
        : Promise.resolve({ data: [], error: null }),

      profile.goals_ids?.length > 0
        ? supabase.from('goals').select('goal_id').in('id', profile.goals_ids)
        : Promise.resolve({ data: [], error: null }),
    ])

    const genderSlug       = genderRes.data?.name                       ?? 'not_declared'
    const activitySlug     = activityRes.data?.name                     ?? 'sedentary'
    const preferenceSlug   = preferenceRes.data?.dietary_preference_id  ?? 'omnivore'
    const restrictionSlugs = (restrictionsRes.data ?? []).map((r: any) => r.dietary_restriction_id)
    const goalSlugs        = (goalsRes.data        ?? []).map((g: any) => g.goal_id)

    const targetCalories = calcTargetCalories({
      gender_slug:   genderSlug,
      age:           profile.age       ?? 30,
      weight_kg:     profile.weight_kg ?? 70,
      height_cm:     profile.height_cm ?? 170,
      activity_slug: activitySlug,
      goal_slugs:    goalSlugs,
    })

    const mealsPerDay = profile.meals_per_day ?? 3

    const profileContext = {
      target_calories:    targetCalories,
      dietary_preference: preferenceSlug,
      restriction_ids:    restrictionSlugs,
      goal_slugs:         goalSlugs,
      meals_per_day:      mealsPerDay,
    }

    // ── CAMADA 1: plano pronto do catálogo ───────────────────────────────────
    const { data: plans, error: plansError } = await supabase.rpc('ybytu_match_meal_plans', {
      p_dietary_preference: preferenceSlug,
      p_restriction_ids:    restrictionSlugs,
      p_target_calories:    targetCalories,
      p_goal_slugs:         goalSlugs,
      p_meals_per_day:      mealsPerDay,
      p_limit:              1,
    })

    if (plansError) throw new Error('ybytu_match_meal_plans: ' + plansError.message)

    if (plans && plans.length > 0) {
      const chosen = plans[0]

      const [insertRes, updateRes] = await Promise.all([
        supabase.from('user_meal_plans').insert({ user_id: userId, meal_plan_id: chosen.id }),
        supabase.from('profiles').update({ current_meal_plan_id: chosen.id }).eq('id', userId),
      ])
      if (insertRes.error) throw new Error('Failed to save plan: '    + insertRes.error.message)
      if (updateRes.error) throw new Error('Failed to update profile: ' + updateRes.error.message)

      return new Response(JSON.stringify({
        success:   true,
        layer:     1,
        meal_plan: {
          id:           chosen.id,
          meal_plan_id: chosen.meal_plan_id,
          name:         chosen.name_ptbr,
          calories:     chosen.calories,
          score:        chosen.score,
        },
        profile_context: profileContext,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── CAMADA 2: IA compõe do pool seguro ───────────────────────────────────
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')

    // 2a. Pool seguro por tipo de refeição
    const { data: pool, error: poolError } = await supabase.rpc('ybytu_match_meals', {
      p_dietary_preference: preferenceSlug,
      p_restriction_ids:    restrictionSlugs,
      p_target_calories:    targetCalories,
      p_meals_per_day:      mealsPerDay,
      p_limit_per_type:     10,
    })
    if (poolError) throw new Error('ybytu_match_meals: ' + poolError.message)

    // 2b. Agrupa por tipo
    const byType: Record<string, any[]> = {}
    for (const meal of (pool ?? [])) {
      if (!byType[meal.meal_type]) byType[meal.meal_type] = []
      byType[meal.meal_type].push(meal)
    }

    // 2c. Verifica viabilidade: B+L+D obrigatórios; snack só se meals_per_day > 3
    const requiredTypes = ['breakfast', 'lunch', 'dinner']
    if (mealsPerDay > 3) requiredTypes.push('snack')

    const missingTypes = requiredTypes.filter(t => !byType[t]?.length)
    if (missingTypes.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        status:  'no_safe_meals',
        message: `No safe meals for types: ${missingTypes.join(', ')}. Cannot compose a complete day.`,
        profile_context: profileContext,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2d. Caloric target por tipo (replica a lógica de cotas da ybytu_match_meals)
    const quotaMain  = mealsPerDay > 3 ? Math.round(targetCalories * 0.20) : Math.round(targetCalories / 3)
    const quotaSnack = mealsPerDay > 3 ? Math.round(targetCalories * 0.40 / (mealsPerDay - 3)) : 0

    const poolSummary = requiredTypes.map(type => ({
      type,
      target_kcal: type === 'snack' ? quotaSnack : quotaMain,
      options: byType[type].map((m: any) => ({
        meal_id:  m.meal_id,
        name:     m.name_ptbr,
        calories: m.calories,
        score:    m.score,
      })),
    }))

    // 2e. IA escolhe 1 meal_id por tipo do pool
    const selectionsSchema = requiredTypes.map(t => `"${t}": "meal_id_here"`).join(', ')
    const aiPrompt = `You are a clinical nutrition composer. Select exactly one meal per required type to build a ${mealsPerDay}-meal day targeting ${targetCalories} kcal total.

POOL (all options are pre-validated safe for this user — do not add restrictions):
${JSON.stringify(poolSummary, null, 2)}

Rules:
1. Select exactly ONE meal_id per required type from the options listed for that type only.
2. Choose combinations whose calories sum closest to ${targetCalories} kcal.
3. Prefer higher score when calories are similar.
4. ONLY use meal_ids listed above — do not invent new ones.

Return ONLY valid JSON: { "selections": { ${selectionsSchema} } }`

    // Any Gemini failure (parse error, empty candidates, 503 exhausted, network)
    // leaves aiSelections={} → re-validation fills every slot with top-score from pool.
    // User always receives a plan; Gemini is best-effort, not a hard dependency.
    let aiSelections: Record<string, string> = {}
    try {
      const aiResult = await callGemini(aiPrompt, geminiKey)
      aiSelections   = (aiResult?.selections ?? {}) as Record<string, string>
    } catch {
      // intentionally silent — 2f handles missing picks via top-score fallback
    }

    // 2f. RE-VALIDAÇÃO: filtra hallucinations e tipos errados
    // Estratégia: se o pick da IA não existe no pool OU é do tipo errado →
    // substitui pelo top-score do tipo (já ordenado pela RPC, índice 0).
    // Nunca aborta: viabilidade já garantida no passo 2c.
    const poolBySlug = new Map<string, any>(pool.map((m: any) => [m.meal_id, m]))
    const validatedMeals: Record<string, any> = {}

    for (const type of requiredTypes) {
      const aiPick   = aiSelections[type]
      const candidate = aiPick ? poolBySlug.get(aiPick) : null
      if (candidate && candidate.meal_type === type) {
        validatedMeals[type] = candidate
      } else {
        // Fallback: top-score do tipo (posição 0, já ranqueado pela RPC)
        validatedMeals[type] = byType[type][0]
      }
    }

    // 2g. Lookup slug → UUID (meal_plan_meals guarda UUIDs, não slugs)
    const slugsNeeded = requiredTypes.map(t => validatedMeals[t].meal_id)
    const { data: mealRows, error: mealErr } = await supabase
      .from('meals')
      .select('id, meal_id, restriction_tags, dietary_preference')
      .in('meal_id', slugsNeeded)
    if (mealErr) throw new Error('Meal UUID lookup: ' + mealErr.message)

    const mealBySlug = new Map<string, any>(mealRows.map((m: any) => [m.meal_id, m]))

    // 2h. DERIVA dietary_preference e restriction_tags das meals selecionadas — NUNCA hardcoded.
    // Garante que o plano não mente mesmo se promovido para is_active=true futuramente.
    const derivedPreference = derivePlanPreference(mealRows)
    const derivedTags       = derivePlanTags(mealRows)

    // 2i. Cria meal_plan: is_active=false não entra no pool da Camada 1;
    // created_by_ai=true marca para auditoria e promoção manual futura.
    const aiPlanSlug = `mp_ai_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    const planName   = `Plano IA – ${targetCalories} kcal (${derivedPreference})`

    const { data: newPlan, error: planErr } = await supabase
      .from('meal_plans')
      .insert({
        meal_plan_id:       aiPlanSlug,
        name_ptbr:          planName,
        name_en:            planName,
        calories:           targetCalories,
        meals_per_day:      mealsPerDay,
        dietary_preference: derivedPreference,
        restriction_tags:   derivedTags,
        created_by_ai:      true,
        is_active:          false,
        created_at:         new Date().toISOString(),
      })
      .select('id')
      .single()
    if (planErr) throw new Error('Failed to create AI meal plan: ' + planErr.message)

    // 2j. Insere meal_plan_meals
    // ATENÇÃO: meal_plan_meals.meal_plan_id e .meal_id são TEXT que guardam UUIDs
    // (não os slugs mp_NNN / meal_NNN — convenção confirmada no schema).
    const mpmRows: any[] = []
    for (const [i, type] of requiredTypes.entries()) {
      const poolMeal = validatedMeals[type]
      const dbMeal   = mealBySlug.get(poolMeal.meal_id)
      if (!dbMeal) throw new Error(`Meal UUID not found for slug: ${poolMeal.meal_id}`)
      mpmRows.push({
        meal_plan_id: newPlan.id,  // UUID do meal_plan (TEXT)
        meal_id:      dbMeal.id,   // UUID do meal (TEXT)
        day_order:    1,
        meal_order:   i + 1,
        meal_type_id: type,
      })
    }

    const { error: mpmErr } = await supabase.from('meal_plan_meals').insert(mpmRows)
    if (mpmErr) throw new Error('Failed to insert meal_plan_meals: ' + mpmErr.message)

    // 2k. Salva nas 2 tabelas de vínculo (igual à Camada 1)
    const [insertRes, updateRes] = await Promise.all([
      supabase.from('user_meal_plans').insert({ user_id: userId, meal_plan_id: newPlan.id }),
      supabase.from('profiles').update({ current_meal_plan_id: newPlan.id }).eq('id', userId),
    ])
    if (insertRes.error) throw new Error('Failed to save plan link: '  + insertRes.error.message)
    if (updateRes.error) throw new Error('Failed to update profile: '  + updateRes.error.message)

    return new Response(JSON.stringify({
      success:   true,
      layer:     2,
      meal_plan: {
        id:                 newPlan.id,
        meal_plan_id:       aiPlanSlug,
        name:               planName,
        calories:           targetCalories,
        dietary_preference: derivedPreference,
        restriction_tags:   derivedTags,
      },
      composition: Object.fromEntries(
        requiredTypes.map(type => {
          const m = validatedMeals[type]
          return [type, { meal_id: m.meal_id, name: m.name_ptbr, calories: m.calories }]
        })
      ),
      profile_context: profileContext,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
