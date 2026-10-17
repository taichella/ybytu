// Nome em português de cada token de alergênico/restrição. Usado no documento
// do plano (buildPlanPayload.ts) e nas mensagens do construtor
// (ybytu-admin-meal-plans). Movido de buildPlanPayload.ts em 2026-10-17.
export const TOKEN_LABEL_PTBR: Record<string, string> = {
  milk: 'leite', gluten: 'glúten', wheat: 'trigo', rye: 'centeio',
  egg: 'ovo', soy: 'soja', peanuts: 'amendoim', tree_nuts: 'castanhas',
  nuts: 'castanhas', fish: 'peixe', shellfish: 'crustáceos',
  crustacean: 'crustáceos', mollusk: 'moluscos', sesame: 'gergelim',
  lupin: 'tremoço', mustard: 'mostarda', sulfites: 'sulfitos',
  pork: 'carne suína', red_meat: 'carne vermelha',
  // coco: token próprio desde a Sessão 1 (2026-09-12) -- antes disso coco
  // usava tree_nuts, decisão de produto revertida porque cobria a população
  // errada (excluía coco de quem é alérgico a castanha, não de quem é
  // alérgico a coco). Ver scripts/aplicacao_sessao1_20260904.sql Bloco 2b.
  coco: 'coco',
}
