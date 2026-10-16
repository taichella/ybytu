/**
 * Traduz o erro de um check-in (insert direto no banco via PostgREST ou RPC)
 * para o aluno. Antes, a tela mostrava o texto cru do banco ("JWT expired",
 * "new row violates row-level security policy", "meal_slot_not_found").
 * kind 'session_expired' -> quem chama manda para o login.
 *
 * Códigos dos gatilhos/RPCs: meal_slot_not_found (20261004120000);
 * exercise_not_in_plan_day, training_plan_not_active, workout_not_reopenable
 * (20261015120000).
 */
export function describeCheckinError(err) {
  const code = err?.code || '';
  const message = err?.message || '';
  if (code === 'PGRST301' || code === 'PGRST303' || /jwt/i.test(message) || message.includes('not_authenticated')) {
    return { kind: 'session_expired', text: 'Sua sessão expirou. Entre de novo para registrar.' };
  }
  // Posição/exercício não existe mais no plano: foi editado com a tela aberta.
  if (message.includes('meal_slot_not_found')) {
    return { kind: 'plan_changed', text: 'Seu cardápio foi atualizado, recarregue a página.' };
  }
  if (message.includes('exercise_not_in_plan_day') || message.includes('training_plan_not_active')) {
    return { kind: 'plan_changed', text: 'Seu treino foi atualizado, recarregue a página.' };
  }
  if (message.includes('workout_not_reopenable')) {
    return { kind: 'not_reopenable', text: 'Este treino foi fechado há mais de 3 horas e já está no seu histórico; não dá para reabrir.' };
  }
  if (message.includes('meal_not_undoable')) {
    return { kind: 'not_undoable', text: 'Só dá para desfazer o registro de uma refeição no mesmo dia. Depois disso ele fica no seu histórico.' };
  }
  if (code === '23505') {
    return { kind: 'already_marked', text: 'Esse exercício já está marcado. Recarregue a página.' };
  }
  if (code === '42501') {
    return { kind: 'forbidden', text: 'Não foi possível registrar neste plano. Recarregue a página; se continuar, fale com o suporte.' };
  }
  if (err instanceof TypeError || /failed to fetch|network/i.test(message)) {
    return { kind: 'network', text: 'Sem conexão com o servidor. Confira sua internet e tente de novo.' };
  }
  return { kind: 'unknown', text: 'Não foi possível registrar agora. Tente de novo em instantes.' };
}
