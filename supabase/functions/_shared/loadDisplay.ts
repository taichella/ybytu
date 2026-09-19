// Texto de carga mostrado ao ALUNO (tela /plano e PDF) e ao staff (documento do
// aluno), calculado no servidor pra os dois lugares nunca divergirem.
//
// Regras (decisão da Taina, 2026-09-19): a carga só aparece quando o tipo do
// exercício admite carga E há valor. Sem valor: "a definir" -- NUNCA "0 kg".
//   weighted / machine  -> "12,5 kg" | "10 · 12 · 14 kg" (séries diferentes) | "a definir"
//   bodyweight          -> "Peso corporal"  (sem kg)
//   band                -> "Elástico"       (sem kg)
//   tipo ausente/desconhecido -> tratado como weighted (mesmo default do banco):
//                          errar por mostrar "a definir" é visível; errar por
//                          esconder deixaria o aluno sem saber com quanto treinar.
// Puro (sem Deno): testável em Node.

export type LoadType = 'bodyweight' | 'weighted' | 'machine' | 'band'

export const LOAD_TYPES_WITH_KG: LoadType[] = ['weighted', 'machine']

export function loadTypeUsesKg(loadType: string | null | undefined): boolean {
  if (loadType === 'bodyweight' || loadType === 'band') return false
  return true // weighted, machine, ausente ou desconhecido
}

// 0, null, NaN, negativo, texto: "sem valor" (0 kg nunca é exibido como carga).
function validKg(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

function fmtKg(n: number): string {
  return String(n).replace('.', ',')
}

export function formatLoadPtbr(
  loadType: string | null | undefined,
  setsDetail: Array<{ load_kg?: unknown }> | null | undefined,
): string {
  if (loadType === 'bodyweight') return 'Peso corporal'
  if (loadType === 'band') return 'Elástico'
  const perSet = (Array.isArray(setsDetail) ? setsDetail : []).map((s) => validKg(s?.load_kg))
  if (perSet.every((v) => v === null)) return 'a definir'
  // Todas as séries iguais (o caso do construtor, que replica 1 valor): 1 número só.
  const defined = perSet.filter((v): v is number => v !== null)
  if (defined.length === perSet.length && new Set(defined).size === 1) return `${fmtKg(defined[0])} kg`
  return perSet.map((v) => (v === null ? '—' : fmtKg(v))).join(' · ') + ' kg'
}
