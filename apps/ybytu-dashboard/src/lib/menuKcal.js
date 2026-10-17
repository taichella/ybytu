// Kcal REAIS dos cardápios (2026-10-17): soma das refeições de cada cardápio,
// calculada na hora a partir do payload. Substitui a meta do plano
// (daily_kcal_target) onde ela aparecia como se fosse o cardápio: nenhum
// cardápio gerado atinge a meta (média −6%; docs/POS_PILOTO.md, "Gerador de
// cardápio"), e um número gravado não acompanha as edições da nutricionista.

export function menuKcal(menu) {
  return Math.round((menu?.meals || []).reduce((acc, m) => acc + (Number(m.kcal) || 0), 0));
}

// { min, max } dos cardápios com refeições, ou null.
export function menuKcalRange(nutrition) {
  const totals = (nutrition?.menus || []).map(menuKcal).filter(k => k > 0);
  if (!totals.length) return null;
  return { min: Math.min(...totals), max: Math.max(...totals) };
}

const fmt = (n) => n.toLocaleString('pt-BR');

// "1.370 a 1.507 kcal" | "1.507 kcal" (todos iguais) | null
export function formatKcalRange(range) {
  if (!range) return null;
  return range.min === range.max ? `${fmt(range.min)} kcal` : `${fmt(range.min)} a ${fmt(range.max)} kcal`;
}

// Para frases com "entre": "entre 1.370 e 1.507 kcal" | "com 1.507 kcal".
export function formatKcalBetween(range) {
  if (!range) return null;
  return range.min === range.max ? `com ${fmt(range.min)} kcal` : `entre ${fmt(range.min)} e ${fmt(range.max)} kcal`;
}
