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

// ─── Meta de proteína por objetivo — SINAL pra IA, nunca filtro ──────────────
// Mesma precedência do goalFactor calórico acima (weight_loss bate hypertrophy
// em conflito) — as duas metas do mesmo perfil não podem discordar sobre qual
// objetivo "venceu". Contexto que ordena preferência dentro do pool já seguro,
// nunca um motivo pra excluir ou inventar uma meal (mesmo desenho do reforço de
// idade/atividade no treino).
const PROTEIN_G_PER_KG_BY_GOAL: Record<string, number> = {
  weight_loss: 1.6, // preserva massa magra no déficit
  hypertrophy: 1.8, // suporta síntese proteica no superávit
}
const DEFAULT_PROTEIN_G_PER_KG = 1.2 // manutenção / demais objetivos — padrão geral, sujeito a revisão profissional

function calcTargetProteinG(weight_kg: number, goal_slugs: string[]): number {
  const gPerKg = goal_slugs.includes('weight_loss') ? PROTEIN_G_PER_KG_BY_GOAL.weight_loss
               : goal_slugs.includes('hypertrophy') ? PROTEIN_G_PER_KG_BY_GOAL.hypertrophy
               : DEFAULT_PROTEIN_G_PER_KG
  return Math.round(weight_kg * gPerKg)
}

// ─── Nome amigável — rótulo curto em PT-BR pro usuário, nunca o slug em inglês
// (espelha o mesmo mapa no gerador de treino — cada função mantém sua própria
// cópia, mesmo padrão de duplicação já usado pra corsHeaders/callGemini) ─────
const GOAL_LABEL_PTBR: Record<string, string> = {
  weight_loss:    'Emagrecimento',
  hypertrophy:    'Hipertrofia',
  conditioning:   'Condicionamento',
  health_routine: 'Rotina Saudável',
}
function goalLabelPtbr(goal: string): string {
  return GOAL_LABEL_PTBR[goal] ?? goal
}

// ─── Subscription gate ────────────────────────────────────────────────────────
const MEAL_SUBSCRIPTION_IDS = new Set([
  '7458939c-ed4b-4a16-960e-b647f94e6a9b', // MEAL
  '7b5502f1-eeed-4640-8c4f-0ebc0502481e', // COMPLETE
])

// ─── Gemini flash ─────────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<any> {
  // 'gemini-flash-latest' é um alias mantido pelo Google que sempre aponta pro
  // flash recomendado atual — evita escolher um nome versionado (ex.: 2.5-flash)
  // que a própria API de listagem ainda anuncia mas já responde 404 "no longer
  // available to new users" em generateContent (visto em teste real com chave nova).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

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
// Lower rank = more restrictive. Plan label = the LEAST restrictive tier that
// still covers every selected meal (maxRank) — if even one meal is omnivore,
// the plan can only promise "omnivore", never a stricter label it would break.
const PREF_RANK: Record<string, number> = { vegan: 1, vegetarian: 2, pescetarian: 3 }
const RANK_PREF: Record<number, string> = { 1: 'vegan', 2: 'vegetarian', 3: 'pescetarian', 4: 'omnivore' }

function derivePlanPreference(meals: Array<{ dietary_preference: string | null }>): string {
  let maxRank = 1
  for (const m of meals) {
    const rank = PREF_RANK[m.dietary_preference ?? ''] ?? 4
    if (rank > maxRank) maxRank = rank
  }
  return RANK_PREF[maxRank] ?? 'omnivore'
}

// Union of all restriction_tags present in the selected meals — never hardcoded.
// Guarantees the plan won't lie if promoted to is_active=true later.
function derivePlanTags(meals: Array<{ restriction_tags: string[] | null }>): string[] {
  return [...new Set(meals.flatMap(m => m.restriction_tags ?? []))].sort()
}

// ─── Preferência (disliked_foods) — filtro LEVE, nunca duro ──────────────────
// HIERARQUIA (a parte crítica): isto roda depois do pool já ter passado pelo
// filtro DURO de restrição (RPC ybytu_match_meals, que já eliminou alérgenos e
// violações de dietary_preference antes de devolver uma linha). A preferência
// NUNCA olha pra fora desse pool já seguro — só reordena o que já está dentro
// dele. É estruturalmente impossível a preferência reintroduzir um alérgeno,
// porque ela nunca vê nada que a restrição já excluiu.
// Normaliza acento pra matching: lowercase + NFD (separa base do diacritico) +
// remove os diacriticos (faixa Unicode U+0300 a U+036F) + trim. Aplicado nos
// DOIS lados (token do usuario E nome do alimento) - sem isso, "figado" (como
// o usuario digita, sem acento) nunca batia com "Figado bovino grelhado" (nome
// do banco, com acento), e a preferencia silenciosamente nao pesava nada.
function normalizeForMatch(s: string): string {
  const COMBINING_DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .trim()
}

function parseDislikedTokens(dislikedFoodsText: string | null): string[] {
  if (!dislikedFoodsText) return []
  return dislikedFoodsText
    .split(/,| e /i)
    .map(t => normalizeForMatch(t))
    .filter(t => t.length > 0)
}

function mealMatchesDislikedTokens(
  mealId: string,
  dislikedTokens: string[],
  ingredientsByMealId: Map<string, Array<{ id: string }>>,
  foodNameById: Map<string, string>,
): boolean {
  if (dislikedTokens.length === 0) return false
  const ingredients = ingredientsByMealId.get(mealId) ?? []
  return ingredients.some(ing => {
    const name = foodNameById.get(ing.id) ?? '' // já normalizado na construção do map
    return dislikedTokens.some(tok => name.includes(tok))
  })
}

// ─── Rodízio — opções por tipo × N dias (o "caminho do meio" pro multi-dia) ──
// Em vez de compor um dia único (perderia a variedade semanal do catálogo) ou
// compor N dias via N chamadas de IA (N× custo/latência), a IA escolhe 2-3
// OPÇÕES intercambiáveis por tipo NUMA chamada só, e o código distribui essas
// opções pelos dias em rodízio determinístico (dia 1 → opção 0, dia 2 → opção
// 1, ... módulo o nº de opções daquele tipo). Pool raso (1 opção segura) faz o
// rodízio repetir a mesma meal todo dia — aceito, mesmo princípio do treino
// (bom exercício repetido > variedade forçada).
const OPTIONS_PER_TYPE_MAX = 3

function pickForDay(options: any[], dayIndexZeroBased: number): any {
  return options[dayIndexZeroBased % options.length]
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
      .select('id, age, weight_kg, height_cm, meals_per_day, nutrition_days_per_week, gender_id, activity_level_id, dietary_preference_id, dietary_restrictions_ids, goals_ids, subscription_type_id, disliked_foods')
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
    const primaryGoal      = goalSlugs[0] ?? 'health_routine'

    const targetCalories = calcTargetCalories({
      gender_slug:   genderSlug,
      age:           profile.age       ?? 30,
      weight_kg:     profile.weight_kg ?? 70,
      height_cm:     profile.height_cm ?? 170,
      activity_slug: activitySlug,
      goal_slugs:    goalSlugs,
    })

    const mealsPerDay    = profile.meals_per_day ?? 3
    const nutritionDays  = profile.nutrition_days_per_week ?? 7 // full-week default — espelha o padrão de 7 dias do catálogo
    const targetProteinG = calcTargetProteinG(profile.weight_kg ?? 70, goalSlugs)

    const profileContext = {
      target_calories:       targetCalories,
      target_protein_g:      targetProteinG,
      dietary_preference:    preferenceSlug,
      restriction_ids:       restrictionSlugs,
      goal_slugs:            goalSlugs,
      meals_per_day:         mealsPerDay,
      nutrition_days_per_week: nutritionDays,
    }

    // ── CAMADA PRINCIPAL: compor do pool seguro (invertida — antes era fallback) ─
    // 1. Pool seguro por tipo — a RPC já aplicou o filtro DURO de segurança
    // (preferência + restrições) antes de devolver uma linha sequer. Tudo que
    // vem depois (protein_g, preferência leve) enriquece ou reordena ESTE pool
    // já seguro — nunca amplia pra fora dele.
    const { data: poolRaw, error: poolError } = await supabase.rpc('ybytu_match_meals', {
      p_dietary_preference: preferenceSlug,
      p_restriction_ids:    restrictionSlugs,
      p_target_calories:    targetCalories,
      p_meals_per_day:      mealsPerDay,
      p_limit_per_type:     10,
    })
    if (poolError) throw new Error('ybytu_match_meals: ' + poolError.message)

    // Enriquece com protein_g — a RPC não devolve isso, e não precisa: é só
    // sinal pro prompt da IA, nunca critério de filtro ou de score da RPC.
    const { data: proteinRows } = await supabase
      .from('meals')
      .select('meal_id, protein_g')
      .in('meal_id', (poolRaw ?? []).map((m: any) => m.meal_id))
    const proteinByMealId = new Map<string, number | null>(
      (proteinRows ?? []).map((r: any) => [r.meal_id, r.protein_g ?? null])
    )

    // Enriquece com o sinal de preferência (disliked_foods) — HIERARQUIA: isto
    // roda sobre `poolRaw`, que já é o resultado DEPOIS do filtro duro de
    // restrição da RPC acima. Preferência nunca vê o que a restrição já barrou;
    // ela só reordena dentro do que sobrou.
    const dislikedTokens = parseDislikedTokens(profile.disliked_foods ?? null)

    const { data: ingredientRows } = await supabase
      .from('meals')
      .select('meal_id, ingredients_json')
      .in('meal_id', (poolRaw ?? []).map((m: any) => m.meal_id))
    const ingredientsByMealId = new Map<string, Array<{ id: string }>>(
      (ingredientRows ?? []).map((r: any) => [r.meal_id, r.ingredients_json ?? []])
    )

    const allFoodIds = [...new Set(
      (ingredientRows ?? []).flatMap((r: any) => (r.ingredients_json ?? []).map((i: any) => i.id))
    )]
    const { data: foodRows } = await supabase
      .from('foods')
      .select('food_id, name_ptbr')
      .in('food_id', allFoodIds)
    const foodNameById = new Map<string, string>(
      (foodRows ?? []).map((f: any) => [f.food_id, normalizeForMatch(f.name_ptbr ?? '')])
    )

    const pool = (poolRaw ?? []).map((m: any) => ({
      ...m,
      protein_g: proteinByMealId.get(m.meal_id) ?? null,
      disliked:  mealMatchesDislikedTokens(m.meal_id, dislikedTokens, ingredientsByMealId, foodNameById),
    }))

    // 2. Agrupa por tipo
    const byType: Record<string, any[]> = {}
    for (const meal of (pool ?? [])) {
      if (!byType[meal.meal_type]) byType[meal.meal_type] = []
      byType[meal.meal_type].push(meal)
    }

    // Reordena CADA tipo: não-evitado primeiro (sort estável — preserva a
    // ordem de score que a RPC já trouxe dentro de cada grupo).
    for (const type of Object.keys(byType)) {
      byType[type].sort((a, b) => Number(a.disliked) - Number(b.disliked))
    }

    // 3. Verifica viabilidade: B+L+D obrigatórios; snack só se meals_per_day > 3
    const requiredTypes = ['breakfast', 'lunch', 'dinner']
    if (mealsPerDay > 3) requiredTypes.push('snack')

    const missingTypes = requiredTypes.filter(t => !byType[t]?.length)

    if (missingTypes.length > 0) {
      // ── FALLBACK FINAL: casar plano pronto do catálogo (a antiga Camada 1) ──
      // Só chega aqui se a composição não tem nem uma meal segura pra algum
      // tipo obrigatório — situação rara (restrição muito agressiva).
      const { data: plans, error: plansError } = await supabase.rpc('ybytu_match_meal_plans', {
        p_dietary_preference: preferenceSlug,
        p_restriction_ids:    restrictionSlugs,
        p_target_calories:    targetCalories,
        p_goal_slugs:         goalSlugs,
        p_meals_per_day:      mealsPerDay,
        p_limit:              1,
      })
      if (plansError) throw new Error('ybytu_match_meal_plans: ' + plansError.message)

      if (!plans || plans.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          status:  'no_safe_meals',
          message: `No safe meals for types: ${missingTypes.join(', ')}, and no catalog plan matched as fallback. Cannot compose a complete day.`,
          profile_context: profileContext,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const chosen = plans[0]

      const { data: catalogRows, error: catalogErr } = await supabase
        .from('meal_plan_meals')
        .select('day_order, meal_order, meal_type_id, meals ( meal_id, name_ptbr, calories, protein_g )')
        .eq('meal_plan_id', chosen.id)
        .order('day_order', { ascending: true })
        .order('meal_order', { ascending: true })
      if (catalogErr) throw new Error('Catalog composition lookup failed: ' + catalogErr.message)

      // ybytu_match_meal_plans não retorna days_per_week — deriva do maior
      // day_order realmente presente na composição, em vez de mentir com null
      // ou fazer um round-trip extra só pra essa coluna.
      const catalogDaysPerWeek = (catalogRows ?? []).length > 0
        ? Math.max(...catalogRows!.map((r: any) => r.day_order))
        : null

      const [insertRes, updateRes] = await Promise.all([
        supabase.from('user_meal_plans').insert({ user_id: userId, meal_plan_id: chosen.id }),
        supabase.from('profiles').update({ current_meal_plan_id: chosen.id }).eq('id', userId),
      ])
      if (insertRes.error) throw new Error('Failed to save plan: '    + insertRes.error.message)
      if (updateRes.error) throw new Error('Failed to update profile: ' + updateRes.error.message)

      return new Response(JSON.stringify({
        success:   true,
        ai_layer:  false,
        layer:     'catalog_fallback',
        meal_plan: {
          id:                 chosen.id,
          meal_plan_id:       chosen.meal_plan_id,
          name:               chosen.name_ptbr,
          calories:           chosen.calories,
          days_per_week:      catalogDaysPerWeek,
          dietary_preference: chosen.dietary_preference,
          restriction_tags:   chosen.restriction_tags,
        },
        composition: (catalogRows ?? []).map((r: any) => ({
          day_number: r.day_order,
          meal_type:  r.meal_type_id,
          meal_id:    r.meals?.meal_id,
          name:       r.meals?.name_ptbr,
          calories:   r.meals?.calories,
          protein_g:  r.meals?.protein_g,
          filled_by:  'catalog_fallback' as const,
        })),
        preference_conflicts: [],
        ai_filled_slots: 0,
        deterministic_fallback_slots: 0,
        catalog_fallback_slots: (catalogRows ?? []).length,
        profile_context: profileContext,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 4. Caloric target por tipo (cotas que a ybytu_match_meals já usa) ────
    const quotaMain  = mealsPerDay > 3 ? Math.round(targetCalories * 0.20) : Math.round(targetCalories / 3)
    const quotaSnack = mealsPerDay > 3 ? Math.round(targetCalories * 0.40 / (mealsPerDay - 3)) : 0

    const poolSummary = requiredTypes.map(type => ({
      type,
      target_kcal: type === 'snack' ? quotaSnack : quotaMain,
      options: byType[type].slice(0, 10).map((m: any) => ({
        meal_id:    m.meal_id,
        name:       m.name_ptbr,
        calories:   m.calories,
        protein_g:  m.protein_g,
        score:      m.score,
        disliked:   m.disliked, // sinal de preferência — NÃO uma exclusão
      })),
    }))

    // ── 5. IA: UMA chamada pedindo 2-3 opções intercambiáveis POR TIPO ───────
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    const optionsSchema = requiredTypes.map(t => `"${t}": ["meal_id_1", "meal_id_2", "meal_id_3"]`).join(', ')
    const aiPrompt = `You are a clinical nutrition composer. Build a rotating weekly menu for ${mealsPerDay} meals/day targeting ${targetCalories} kcal total and approximately ${targetProteinG}g of protein (secondary goal — see rule 3).

POOL (all options are pre-validated safe for this user — do not add restrictions):
${JSON.stringify(poolSummary, null, 2)}

Rules:
1. For EACH required type, select 2 to 3 meal_ids from that type's own "options" list — these become the rotating choices used across the week (day 1 uses option 1, day 2 uses option 2, etc.), so they must all be independently reasonable for that meal type and target.
2. Choose meal_ids whose calories are close to that type's target_kcal — this is the PRIMARY criterion. All 2-3 options for a type should be roughly interchangeable in caloric fit, so any day's combination lands close to ${targetCalories} kcal total.
3. Among options that fit calories well, prefer ones whose protein_g is closest to a proportional share of ${targetProteinG}g. Protein is a preference signal, not a hard requirement.
4. "disliked: true" means the user asked to avoid this item — prefer "disliked: false" options when they fit the calorie/protein targets reasonably well. Only include a disliked option if there aren't enough non-disliked ones to reach 2 options for that type.
5. ONLY use meal_ids listed in that type's own "options" — never invent ids, never borrow a meal_id from another type's list.
6. If a type's list has fewer than 2 safe options, return all of them (1 is acceptable when the pool is shallow).

Return ONLY valid JSON: { "options": { ${optionsSchema} } }`

    // Any Gemini failure (parse error, empty candidates, 503 exhausted, network)
    // leaves aiOptions={} → re-validation fills every type with top-N from pool.
    // User always receives a plan; Gemini is best-effort, not a hard dependency.
    let aiOptions: Record<string, string[]> = {}
    if (geminiKey) {
      try {
        const aiResult = await callGemini(aiPrompt, geminiKey)
        aiOptions      = (aiResult?.options ?? {}) as Record<string, string[]>
      } catch (err) {
        console.error('[ybytu-generate-meal-plan] Gemini call failed, falling back to deterministic top-N:', err)
      }
    }

    // ── 6. RE-VALIDAÇÃO por tipo (a cerca): filtra hallucinations e ids de
    // outro tipo. Pick da IA só conta se está no pool DAQUELE tipo. Se a IA
    // não deu nenhuma opção válida pro tipo, cai 100% no determinístico (topo
    // do ranking, já ordenado por score + preferência). Se deu ALGUMA válida,
    // completa até OPTIONS_PER_TYPE_MAX com o próximo determinístico não
    // repetido — maximiza variedade sem inventar nada fora do pool. ─────────
    const optionsByType: Record<string, any[]> = {}
    const sourceByType: Record<string, 'ai' | 'deterministic'> = {}

    for (const type of requiredTypes) {
      const poolForType = byType[type]
      const poolBySlugForType = new Map<string, any>(poolForType.map((m: any) => [m.meal_id, m]))

      const aiPicksRaw = Array.isArray(aiOptions[type]) ? aiOptions[type] : []
      const aiValid: any[] = []
      const seen = new Set<string>()
      for (const pick of aiPicksRaw) {
        const meal = poolBySlugForType.get(pick)
        if (meal && !seen.has(meal.meal_id)) {
          aiValid.push(meal)
          seen.add(meal.meal_id)
        }
      }

      if (aiValid.length > 0) {
        sourceByType[type] = 'ai'
        const filled = [...aiValid]
        for (const candidate of poolForType) {
          if (filled.length >= OPTIONS_PER_TYPE_MAX) break
          if (!seen.has(candidate.meal_id)) {
            filled.push(candidate)
            seen.add(candidate.meal_id)
          }
        }
        optionsByType[type] = filled
      } else {
        sourceByType[type] = 'deterministic'
        optionsByType[type] = poolForType.slice(0, OPTIONS_PER_TYPE_MAX)
      }
    }

    // ── 7. RODÍZIO: distribui as opções de cada tipo pelos N dias ────────────
    const dayMealTypeOrder = requiredTypes // ordem fixa dentro do dia
    const rotationRows: Array<{ day: number; type: string; meal: any }> = []
    for (let day = 1; day <= nutritionDays; day++) {
      for (const type of dayMealTypeOrder) {
        rotationRows.push({ day, type, meal: pickForDay(optionsByType[type], day - 1) })
      }
    }

    // ── 8. Lookup slug → UUID (meal_plan_meals guarda UUIDs, não slugs) ──────
    const allChosenSlugs = [...new Set(rotationRows.map(r => r.meal.meal_id))]
    const { data: mealRows, error: mealErr } = await supabase
      .from('meals')
      .select('id, meal_id, restriction_tags, dietary_preference')
      .in('meal_id', allChosenSlugs)
    if (mealErr) throw new Error('Meal UUID lookup: ' + mealErr.message)

    const mealBySlug = new Map<string, any>(mealRows.map((m: any) => [m.meal_id, m]))

    // ── 9. DERIVA dietary_preference e restriction_tags de TODAS as meals
    // realmente usadas no rodízio (não só a 1ª opção) — nunca hardcoded.
    // Garante que o plano não mente mesmo se promovido para is_active=true.
    const derivedPreference = derivePlanPreference(mealRows)
    const derivedTags       = derivePlanTags(mealRows)

    // ── 10. Cria meal_plan: is_active=false não entra no pool de match direto;
    // created_by_ai=true marca para auditoria e o gate de revisão do nutricionista.
    const aiPlanSlug = `mp_ai_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    const planName   = `Plano IA – ${goalLabelPtbr(primaryGoal)} – ${targetCalories} kcal`

    const { data: newPlan, error: planErr } = await supabase
      .from('meal_plans')
      .insert({
        meal_plan_id:       aiPlanSlug,
        name_ptbr:          planName,
        name_en:            planName,
        calories:           targetCalories,
        meals_per_day:      mealsPerDay,
        days_per_week:      nutritionDays,
        goals_ids:          goalSlugs,
        dietary_preference: derivedPreference,
        restriction_tags:   derivedTags,
        created_by_ai:      true,
        is_active:          false,
        created_at:         new Date().toISOString(),
      })
      .select('id')
      .single()
    if (planErr) throw new Error('Failed to create AI meal plan: ' + planErr.message)

    // ── 11. Insere meal_plan_meals — um por (dia, tipo) do rodízio.
    // ATENÇÃO: meal_plan_meals.meal_plan_id e .meal_id são TEXT que guardam
    // UUIDs (não os slugs mp_NNN / meal_NNN).
    const mpmRows = rotationRows.map(r => {
      const dbMeal = mealBySlug.get(r.meal.meal_id)
      if (!dbMeal) throw new Error(`Meal UUID not found for slug: ${r.meal.meal_id}`)
      return {
        meal_plan_id: newPlan.id,                                   // UUID do meal_plan (TEXT)
        meal_id:      dbMeal.id,                                    // UUID do meal (TEXT)
        day_order:    r.day,
        meal_order:   dayMealTypeOrder.indexOf(r.type) + 1,
        meal_type_id: r.type,
      }
    })

    const { error: mpmErr } = await supabase.from('meal_plan_meals').insert(mpmRows)
    if (mpmErr) throw new Error('Failed to insert meal_plan_meals: ' + mpmErr.message)

    // ── 12. Salva nas 2 tabelas de vínculo ────────────────────────────────────
    const [insertRes, updateRes] = await Promise.all([
      supabase.from('user_meal_plans').insert({ user_id: userId, meal_plan_id: newPlan.id }),
      supabase.from('profiles').update({ current_meal_plan_id: newPlan.id }).eq('id', userId),
    ])
    if (insertRes.error) throw new Error('Failed to save plan link: '  + insertRes.error.message)
    if (updateRes.error) throw new Error('Failed to update profile: '  + updateRes.error.message)

    // ── 13. Degradação graciosa, não falha: opção usada em algum dia ainda
    // era "disliked" — só acontece quando não havia opções suficientes
    // não-evitadas pra aquele tipo. Reporta 1x por (tipo, meal_id) distinto.
    const conflictSeen = new Set<string>()
    const preferenceConflicts = rotationRows
      .filter(r => r.meal.disliked && !conflictSeen.has(`${r.type}:${r.meal.meal_id}`))
      .map(r => {
        conflictSeen.add(`${r.type}:${r.meal.meal_id}`)
        return {
          type:    r.type,
          meal_id: r.meal.meal_id,
          name:    r.meal.name_ptbr,
          message: 'Incluímos esta opção por falta de alternativas seguras compatíveis com suas preferências — nenhuma restrição de segurança foi violada.',
        }
      })

    return new Response(JSON.stringify({
      success:   true,
      ai_layer:  !!geminiKey,
      layer:     'compose',
      meal_plan: {
        id:                 newPlan.id,
        meal_plan_id:       aiPlanSlug,
        name:               planName,
        calories:           targetCalories,
        days_per_week:      nutritionDays,
        dietary_preference: derivedPreference,
        restriction_tags:   derivedTags,
      },
      composition: rotationRows.map(r => ({
        day_number: r.day,
        meal_type:  r.type,
        meal_id:    r.meal.meal_id,
        name:       r.meal.name_ptbr,
        calories:   r.meal.calories,
        protein_g:  r.meal.protein_g,
        filled_by:  sourceByType[r.type],
      })),
      preference_conflicts: preferenceConflicts,
      ai_filled_slots:              rotationRows.filter(r => sourceByType[r.type] === 'ai').length,
      deterministic_fallback_slots: rotationRows.filter(r => sourceByType[r.type] === 'deterministic').length,
      catalog_fallback_slots: 0,
      profile_context: profileContext,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
