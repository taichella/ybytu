import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Piso de segurança calórico (2026-10-17, decisão da Taina após o parecer da
// IA nutricionista; docs/POS_PILOTO.md, "BLOQUEIO CLÍNICO"). Antes o piso só
// valia para a META (calcTargetCalories): um cardápio 13% abaixo de uma meta no
// piso entregava ~1.044 kcal. Agora é regra dura sobre a SOMA ENTREGUE de cada
// cardápio, sem margem percentual. Usado em três pontos:
//   1. ybytu-generate-meal-plan, composição (conserta trocando refeições do
//      próprio pool seguro; sem conserto, não entrega);
//   2. ybytu-generate-meal-plan, fallback de plano de catálogo;
//   3. ybytu-admin-meal-plans, construtor do dashboard (bloqueia salvar).
// non_binary/not_declared usam o piso feminino, como a fórmula da meta.

export const SAFETY_FLOOR_KCAL_MALE = 1500
export const SAFETY_FLOOR_KCAL_DEFAULT = 1200

export function safetyFloorForGender(genderSlug: string | null | undefined): number {
  return genderSlug === 'male' ? SAFETY_FLOOR_KCAL_MALE : SAFETY_FLOOR_KCAL_DEFAULT
}

export interface DayBelowFloor { day: number; kcal: number }

// slots: uma linha por refeição do plano, com o dia e as kcal da refeição.
export function menuTotalsByDay(slots: Array<{ day: number; kcal: number | null | undefined }>): Map<number, number> {
  const totals = new Map<number, number>()
  for (const s of slots) totals.set(s.day, (totals.get(s.day) ?? 0) + (Number(s.kcal) || 0))
  return totals
}

export function daysBelowFloor(totals: Map<number, number>, floor: number): DayBelowFloor[] {
  return [...totals.entries()]
    .filter(([, kcal]) => kcal < floor)
    .map(([day, kcal]) => ({ day, kcal: Math.round(kcal) }))
    .sort((a, b) => a.day - b.day)
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

// Motivo legível -- é o texto que aparece em "Planos que falharam", no alerta
// por e-mail e no erro do construtor. Nada de código interno aqui.
export function belowFloorReason(days: DayBelowFloor[], floor: number): string {
  const list = days.map(d => `cardápio ${d.day} com ${fmt(d.kcal)} kcal`).join(', ')
  return `Cardápio abaixo do piso de segurança (${fmt(floor)} kcal): ${list}.`
}

// Piso de um plano já existente: o maior piso entre os alunos que têm este
// plano como atual (um plano de catálogo pode servir a vários). Sem aluno,
// o piso padrão.
export async function safetyFloorForPlan(supabase: SupabaseClient, planUuid: string): Promise<{ floor: number; students: number }> {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('gender_id')
    .eq('current_meal_plan_id', planUuid)
  if (error) throw new Error(`Lookup de alunos do plano falhou: ${error.message}`)
  const genderIds = [...new Set((users ?? []).map((u: any) => u.gender_id).filter(Boolean))]
  let floor = SAFETY_FLOOR_KCAL_DEFAULT
  if (genderIds.length > 0) {
    const { data: genders, error: gErr } = await supabase.from('genders').select('id, name').in('id', genderIds)
    if (gErr) throw new Error(`Lookup de gênero falhou: ${gErr.message}`)
    for (const g of genders ?? []) floor = Math.max(floor, safetyFloorForGender(g.name))
  }
  return { floor, students: (users ?? []).length }
}
