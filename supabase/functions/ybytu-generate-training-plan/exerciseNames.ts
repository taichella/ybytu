// Nome de exercício normalizado (minúsculas, sem acento) e colapso de
// duplicatas por nome no pool do gerador de treino.
//
// Por que existe (2026-09-19, caso Gisele): o catálogo tem 19 pares de
// exercícios com o MESMO nome e exercise_id diferente (ex: ex_194 e ex_216,
// "Flexão de braço com pegada fechada" -- mesmo movimento, mesmo vídeo). A
// dedupe DENTRO do dia (index.ts, depois da escolha) só troca o exercício se
// achar outro candidato no pool do próprio slot; sem alternativa, ela mantinha
// a repetição em silêncio quando os ids eram diferentes. Resultado: o mesmo
// exercício duas vezes no mesmo dia. Colapsar o pool ANTES de montar os slots
// resolve na raiz: o pool passa a ter 1 registro por nome, e os dois ramos
// que já existem (mesmo id -> pula o slot se o dia aguentar, senão mantém com
// aviso) passam a valer também pra esses pares.
//
// Arquivo separado (e sem import de Deno) pra poder ser testado em Node.

export function normalizeExerciseName(name: string): string {
  // NFD separa a letra do sinal diacritico (acento/til/cedilha) em dois
  // code points -- filtra pelo range Unicode de "Combining Diacritical
  // Marks" (U+0300-U+036F) numericamente, em vez de literal na regex,
  // pra nao depender de encoding de arquivo pro caractere combinado.
  const codePoints = Array.from(name.normalize('NFD')).filter((ch) => {
    const code = ch.codePointAt(0) ?? 0
    return code < 0x0300 || code > 0x036f
  })
  return codePoints.join('').toLowerCase().trim()
}

// "ex_194" < "ex_216" pelo número, não pelo texto ("ex_99" vs "ex_100"). Id
// fora do padrão cai na comparação de texto.
export function compareExerciseIds(a: string, b: string): number {
  const na = /^ex_(\d+)$/.exec(a)
  const nb = /^ex_(\d+)$/.exec(b)
  if (na && nb) return Number(na[1]) - Number(nb[1])
  return a < b ? -1 : a > b ? 1 : 0
}

export interface PoolExercise {
  exercise_id: string
  name_ptbr: string | null
  muscle_groups_ids: string[] | null
}

export interface CollapsedGroup {
  name: string
  kept: string
  dropped: string[]
}

// Ids que têm pelo menos um irmão de mesmo nome no pool (candidatos a colapso).
// Serve pro gerador buscar as cautelas só desses ids, em vez do pool inteiro.
export function findDuplicateNameIds(pool: PoolExercise[]): string[] {
  const byName = new Map<string, string[]>()
  for (const ex of pool) {
    const key = ex.name_ptbr ? normalizeExerciseName(ex.name_ptbr) : ''
    if (!key) continue
    byName.set(key, [...(byName.get(key) ?? []), ex.exercise_id])
  }
  return [...byName.values()].filter((ids) => ids.length > 1).flat()
}

// Mantém 1 registro por nome normalizado. Qual: o que tem MAIS cautelas pras
// condições deste aluno (cautionCountById); empate -> MENOR exercise_id (que é
// o caso normal, sem cautela nenhuma em jogo). Motivo (2026-09-19, medido nos
// 19 pares): em 8 deles as cautelas divergem entre os dois registros, e em 3
// (cadeira flexora, pular corda, wall ball) o de id MAIOR é o mais restritivo
// -- manter cegamente o menor id esconderia do aluno/staff um aviso que o
// catálogo já tinha pro mesmo movimento. Os músculos do registro mantido viram
// a UNIÃO dos músculos do grupo -- 4 dos 19 pares têm muscle_groups_ids
// divergentes (ex: um lista o músculo principal e o outro não); sem a união, o
// colapso poderia tirar do slot certo um exercício que ele cobria. Nome
// vazio/nulo não é agrupado (não há o que comparar).
// Roda DEPOIS do filtro de 'avoid': só colapsa entre exercícios já seguros pra
// este aluno, então nunca traz de volta um exercício removido por 'avoid'.
export function collapseDuplicateNames<T extends PoolExercise>(
  pool: T[],
  cautionCountById: Map<string, number> = new Map(),
): { pool: T[]; collapsed: CollapsedGroup[] } {
  const groups = new Map<string, T[]>()
  for (const ex of pool) {
    const key = ex.name_ptbr ? normalizeExerciseName(ex.name_ptbr) : ''
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(ex)
    groups.set(key, list)
  }

  const replacement = new Map<string, T>() // exercise_id mantido -> registro com músculos unidos
  const dropIds = new Set<string>()
  const collapsed: CollapsedGroup[] = []

  for (const [name, members] of groups) {
    if (members.length < 2) continue
    const sorted = [...members].sort((a, b) =>
      ((cautionCountById.get(b.exercise_id) ?? 0) - (cautionCountById.get(a.exercise_id) ?? 0))
      || compareExerciseIds(a.exercise_id, b.exercise_id))
    const keep = sorted[0]
    const mergedMuscles = [...new Set([keep, ...sorted.slice(1)].flatMap((m) => m.muscle_groups_ids ?? []))]
    replacement.set(keep.exercise_id, { ...keep, muscle_groups_ids: mergedMuscles })
    const dropped = sorted.slice(1).map((m) => m.exercise_id)
    for (const id of dropped) dropIds.add(id)
    collapsed.push({ name, kept: keep.exercise_id, dropped })
  }

  const result = pool
    .filter((ex) => !dropIds.has(ex.exercise_id))
    .map((ex) => replacement.get(ex.exercise_id) ?? ex)
  return { pool: result, collapsed }
}
