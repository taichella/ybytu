// Regra ÚNICA de "em que ambiente este exercício é executável", usada por:
//   - ybytu-generate-training-plan  (filtra o pool do aluno por ambiente)
//   - ybytu-admin-exercises         (devolve environment_tag na lista, pra tag do card)
// Sem dependência de Deno/Supabase: pura, testável em Node.
//
// Nasceu da lógica que estava inline no gerador (2026-09-19, pedido: a tag do
// card TEM que vir da mesma regra que o gerador usa pra escolher exercício,
// senão a tela promete um ambiente que o gerador não respeita, ou o contrário).
//
// O ambiente NÃO é uma coluna de exercises: é derivado de
// exercises.exercise_equipments_ids, assim:
//   - casa sem equipamento / ar livre -> só exercícios cujo equipamento ⊆ {peso do corpo}
//   - casa com equipamento            -> ⊆ {peso do corpo} ∪ (equipamentos do aluno ∩ HOME_EQUIPMENT_WHITELIST)
//   - academia                        -> qualquer exercício
// "Ar livre" não tem exercício próprio no catálogo, é tratado como peso do corpo.

export const BODYWEIGHT_EQUIPMENT = 'none_bodyweight'

// bar_fixed_bar entra em "casa": barra de porta é equipamento doméstico comum
// e barato — sem ela o pool de costas em casa cai para quase zero (verificado:
// 197 exercícios sem ela, 242 com ela — bate com o número fechado na revisão).
export const HOME_EQUIPMENT_WHITELIST = [
  'none_bodyweight', 'dumbbells', 'elastic_band_mini_band', 'bench', 'box',
  'kettlebell', 'step', 'ab_wheel', 'wall', 'medicine_ball', 'jump_rope',
  'mat_rug', 'trx', 'swiss_ball', 'battle_rope', 'bar_fixed_bar',
]

// Lista de equipamentos que um exercício pode exigir pra caber no ambiente do
// aluno, ou null = sem restrição (academia). É exatamente o que o gerador
// passava pro filtro `exercise_equipments_ids <@ allowed`.
export function allowedEquipmentForEnvironment(
  environmentSlug: string,
  userEquipmentSlugs: string[],
): string[] | null {
  if (environmentSlug === 'home_no_equipment' || environmentSlug === 'outdoors') {
    // Confirmado: catálogo não tem exercício outdoor-específico — tratamos como bodyweight puro.
    return [BODYWEIGHT_EQUIPMENT]
  }
  if (environmentSlug === 'home_with_equipment') {
    return [...new Set([
      BODYWEIGHT_EQUIPMENT,
      ...userEquipmentSlugs.filter((s) => HOME_EQUIPMENT_WHITELIST.includes(s)),
    ])]
  }
  return null // gym: qualquer equipamento
}

export type ExerciseEnvironmentTag =
  | 'home_no_equipment'   // roda em qualquer lugar: só peso do corpo
  | 'home_with_equipment' // precisa de equipamento doméstico (halter, elástico, barra de porta...)
  | 'gym_only'            // exige equipamento que não é doméstico (máquina, barra olímpica...)
  | 'undefined'           // sem equipamento cadastrado: NÃO presume nada

export const ENVIRONMENT_TAG_LABEL_PTBR: Record<ExerciseEnvironmentTag, string> = {
  home_no_equipment: 'Casa (sem equipamento)',
  home_with_equipment: 'Casa (com equipamento)',
  gym_only: 'Só academia',
  undefined: 'Ambiente não definido',
}

// Tag de UM exercício, pela mesma regra do gerador: o menor ambiente onde o
// exercício passa no filtro. Lista de equipamento vazia/nula = 'undefined'
// (o filtro do gerador aceitaria um array vazio em qualquer ambiente, o que
// seria "presumir" -- a tela mostra "ambiente não definido" em vez disso).
export function environmentTagForEquipment(equipmentIds: string[] | null | undefined): ExerciseEnvironmentTag {
  if (!equipmentIds || equipmentIds.length === 0) return 'undefined'
  const fits = (allowed: string[] | null) => allowed === null || equipmentIds.every((e) => allowed.includes(e))
  if (fits(allowedEquipmentForEnvironment('home_no_equipment', []))) return 'home_no_equipment'
  if (fits(HOME_EQUIPMENT_WHITELIST)) return 'home_with_equipment'
  return 'gym_only'
}
