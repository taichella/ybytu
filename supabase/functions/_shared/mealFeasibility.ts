import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { safetyFloorForGender } from './safetyFloor.ts'

// Viabilidade do número de refeições (2026-10-17, versão curta aprovada pela
// Taina; docs/propostas/20261017_proposta_viabilidade_refeicoes.md). UM lugar
// só, usado por:
//   - ybytu-generate-meal-plan: traduz o perfil e calcula a meta por aqui, e
//     falha cedo, com o motivo, quando o número escolhido não alcança o piso;
//   - ybytu-meal-feasibility (público): o onboarding consulta no FIM, com todas
//     as respostas, e oferece ajustar o número de refeições.
// Nenhum número de kcal sai daqui para o aluno.

// ─── Mifflin-St Jeor + piso da META (movido de ybytu-generate-meal-plan) ─────
// non_binary/not_declared → fórmula feminina (conservadora). O piso da SOMA
// ENTREGUE é conferido no gerador depois do rodízio (_shared/safetyFloor.ts).
export function calcTargetCalories(p: {
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

  const raw = Math.round(tdee * goalFactor)
  return Math.max(raw, safetyFloorForGender(p.gender_slug))
}

export interface NutritionProfileInput {
  gender_id?: string | null
  activity_level_id?: string | null
  dietary_preference_id?: string | null
  dietary_restrictions_ids?: string[] | null
  goals_ids?: string[] | null
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
}

export interface NutritionProfile {
  genderSlug: string
  activitySlug: string
  preferenceSlug: string
  restrictionSlugs: string[]
  goalSlugs: string[]
  targetCalories: number
}

// UUIDs do perfil/onboarding → slugs + meta. Mesmos padrões de antes no gerador.
export async function resolveNutritionProfile(supabase: SupabaseClient, p: NutritionProfileInput): Promise<NutritionProfile> {
  const restrictionIds = Array.isArray(p.dietary_restrictions_ids) ? p.dietary_restrictions_ids : []
  const goalIds = Array.isArray(p.goals_ids) ? p.goals_ids : []
  const [genderRes, activityRes, preferenceRes, restrictionsRes, goalsRes] = await Promise.all([
    p.gender_id
      ? supabase.from('genders').select('name').eq('id', p.gender_id).single()
      : Promise.resolve({ data: { name: 'not_declared' }, error: null }),
    p.activity_level_id
      ? supabase.from('activity_levels').select('name').eq('id', p.activity_level_id).single()
      : Promise.resolve({ data: { name: 'sedentary' }, error: null }),
    p.dietary_preference_id
      ? supabase.from('dietary_preferences').select('dietary_preference_id').eq('id', p.dietary_preference_id).single()
      : Promise.resolve({ data: { dietary_preference_id: 'omnivore' }, error: null }),
    restrictionIds.length > 0
      ? supabase.from('dietary_restrictions').select('dietary_restriction_id').in('id', restrictionIds)
      : Promise.resolve({ data: [], error: null }),
    goalIds.length > 0
      ? supabase.from('goals').select('goal_id').in('id', goalIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const genderSlug       = (genderRes.data as any)?.name ?? 'not_declared'
  const activitySlug     = (activityRes.data as any)?.name ?? 'sedentary'
  const preferenceSlug   = (preferenceRes.data as any)?.dietary_preference_id ?? 'omnivore'
  const restrictionSlugs = ((restrictionsRes.data ?? []) as any[]).map((r) => r.dietary_restriction_id)
  const goalSlugs        = ((goalsRes.data ?? []) as any[]).map((g) => g.goal_id)

  const targetCalories = calcTargetCalories({
    gender_slug:   genderSlug,
    age:           p.age       ?? 30,
    weight_kg:     p.weight_kg ?? 70,
    height_cm:     p.height_cm ?? 170,
    activity_slug: activitySlug,
    goal_slugs:    goalSlugs,
  })
  return { genderSlug, activitySlug, preferenceSlug, restrictionSlugs, goalSlugs, targetCalories }
}

export interface MealCountCheck {
  meals_per_day: number
  // 'ok': alcança o piso; 'below_floor': nem o máximo possível alcança;
  // 'missing_type': falta opção segura para alguma refeição -- o gerador cai no
  // plano de catálogo (que tem o próprio teste de piso), então não dá para dizer
  // "não cabe" aqui.
  result: 'ok' | 'below_floor' | 'missing_type'
}

// Para cada número de refeições: o MÁXIMO que o gerador consegue montar com as
// opções seguras que ele recebe (ybytu_match_meals, top 10 por tipo), com o
// prato mais calórico em cada refeição principal e os lanches mais calóricos
// DISTINTOS. É exatamente o limite do conserto do gerador (passo 7b: troca só
// dentro do pool e sem repetir prato no dia), então "máximo >= piso" é a
// mesma pergunta que "o gerador vai conseguir".
export async function checkMealCounts(
  supabase: SupabaseClient,
  profile: Pick<NutritionProfile, 'preferenceSlug' | 'restrictionSlugs' | 'genderSlug' | 'targetCalories'>,
  counts: number[] = [3, 4, 5, 6],
): Promise<{ floor: number; checks: MealCountCheck[] }> {
  const floor = safetyFloorForGender(profile.genderSlug)
  const checks = await Promise.all(counts.map(async (mpd): Promise<MealCountCheck> => {
    const { data, error } = await supabase.rpc('ybytu_match_meals', {
      p_dietary_preference: profile.preferenceSlug,
      p_restriction_ids:    profile.restrictionSlugs,
      p_target_calories:    profile.targetCalories,
      p_meals_per_day:      mpd,
      p_limit_per_type:     10,
    })
    if (error) throw new Error('ybytu_match_meals: ' + error.message)
    const byType = new Map<string, number[]>()
    for (const m of (data ?? []) as any[]) {
      const list = byType.get(m.meal_type) ?? []
      list.push(Number(m.calories) || 0)
      byType.set(m.meal_type, list)
    }
    const snackSlots = mpd > 3 ? mpd - 3 : 0
    const required = ['breakfast', 'lunch', 'dinner', ...(snackSlots > 0 ? ['snack'] : [])]
    if (required.some((t) => !(byType.get(t)?.length))) return { meals_per_day: mpd, result: 'missing_type' }
    let max = 0
    for (const t of ['breakfast', 'lunch', 'dinner']) max += Math.max(...byType.get(t)!)
    if (snackSlots > 0) {
      const snacks = [...byType.get('snack')!].sort((a, b) => b - a)
      // Menos lanches distintos que lugares: o rodízio repete -- conta o maior.
      for (let i = 0; i < snackSlots; i++) max += snacks[i] ?? snacks[0]
    }
    return { meals_per_day: mpd, result: max >= floor ? 'ok' : 'below_floor' }
  }))
  return { floor, checks }
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function belowFloorForMealCountReason(mealsPerDay: number, floor: number): string {
  return `Cardápio abaixo do piso de segurança (${fmt(floor)} kcal): com ${mealsPerDay} refeições por dia, nenhuma combinação das opções seguras para este aluno alcança o piso.`
}
