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
//
// 1.200 SÓ para "female"; todo o resto -- male, non_binary, not_declared, vazio
// ou desconhecido -- recebe 1.500 (decisão da Taina 2026-10-17). Antes o padrão
// era 1.200 para tudo que não fosse "male": um homem que não declarou o sexo
// podia receber cardápio abaixo do mínimo dele. Errar para cima só recusa
// planos a mais; errar para baixo é risco clínico. Vale nos quatro lugares que
// usam o piso (gerador, construtor, onboarding, atribuição) porque todos passam
// por esta função.

export const SAFETY_FLOOR_KCAL_FEMALE = 1200
export const SAFETY_FLOOR_KCAL_DEFAULT = 1500

export function safetyFloorForGender(genderSlug: string | null | undefined): number {
  return genderSlug === 'female' ? SAFETY_FLOOR_KCAL_FEMALE : SAFETY_FLOOR_KCAL_DEFAULT
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
// o piso feminino (ninguém recebe; a atribuição confere com o aluno).
export async function safetyFloorForPlan(supabase: SupabaseClient, planUuid: string): Promise<{ floor: number; students: number }> {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('gender_id')
    .eq('current_meal_plan_id', planUuid)
  if (error) throw new Error(`Lookup de alunos do plano falhou: ${error.message}`)
  const list = (users ?? []) as Array<{ gender_id: string | null }>
  // Sem aluno: plano de catálogo/rascunho, ninguém recebe -- o piso mais baixo;
  // a atribuição confere de novo com o aluno de verdade.
  if (list.length === 0) return { floor: SAFETY_FLOOR_KCAL_FEMALE, students: 0 }
  const genderIds = [...new Set(list.map((u) => u.gender_id).filter((g): g is string => !!g))]
  const nameById = new Map<string, string>()
  if (genderIds.length > 0) {
    const { data: genders, error: gErr } = await supabase.from('genders').select('id, name').in('id', genderIds)
    if (gErr) throw new Error(`Lookup de gênero falhou: ${gErr.message}`)
    for (const g of genders ?? []) nameById.set(g.id, g.name)
  }
  // Aluno sem gênero gravado conta como desconhecido (1.500).
  const floor = Math.max(...list.map((u) => safetyFloorForGender(u.gender_id ? nameById.get(u.gender_id) : null)))
  return { floor, students: list.length }
}
