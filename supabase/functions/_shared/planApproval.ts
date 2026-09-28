import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Regra de liberação do plano pro ALUNO (decisão da Taina, 2026-09-28):
// o aluno só vê o plano depois do parecer de TODOS os profissionais exigidos
// pela assinatura dele, e todos como 'approved'. Tudo de uma vez -- nunca
// treino liberado com nutrição pendente (mesmo momento do WhatsApp "plano
// pronto"). Fonte ÚNICA da regra: ybytu-get-user-plan (app), ybytu-get-plan-payload
// (link /plano/<token>) e ybytu-submit-plan-review (quando avisar o aluno)
// chamam isto -- se a regra mudar, muda só aqui.
//
// - Especialidade exigida vem da assinatura (subscription_types):
//   includes_training -> 'personal'; includes_meals -> 'nutricionista'.
// - O parecer vale pro PLANO que foi revisado, não pro aluno: plan_reviews guarda
//   o código do plano (training_plans.training_plan_id / meal_plans.meal_plan_id,
//   ex. 'tr_ai_4b3fdaf2' -- únicos por plano gerado). Plano refeito (retry,
//   nova geração) tem código novo -> o parecer antigo deixa de valer e o aluno
//   volta a ver "em preparação" até o parecer novo. Plano apagado -> FK
//   ON DELETE SET NULL -> também deixa de valer.
// - 'needs_changes' ou status null (pareceres de antes de 2026-08-27) NÃO liberam.
// - Falha fechada: assinatura desconhecida, plano ausente ou erro de leitura =
//   não liberado. Mostrar "em preparação" por engano é recuperável; mostrar
//   plano sem revisão não é.
//
// Não vale pra visão do staff (ybytu-get-plan-for-staff) -- é lá que o
// profissional revisa o plano antes de aprovar.

export type ReviewRole = 'personal' | 'nutricionista'

export interface CurrentPlanCodes {
  trainingPlanCode: string | null
  mealPlanCode: string | null
}

export interface PlanApproval {
  approved: boolean
  requiredRoles: ReviewRole[]
  pendingRoles: ReviewRole[]
}

// Código (não o uuid) do plano ATIVO do aluno -- é o que plan_reviews guarda.
export async function getCurrentPlanCodes(
  supabase: SupabaseClient,
  userId: string,
): Promise<CurrentPlanCodes & { subscriptionTypeId: string | null }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_type_id, current_training_plan_id, current_meal_plan_id')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`Lookup de profile falhou: ${error.message}`)

  let trainingPlanCode: string | null = null
  let mealPlanCode: string | null = null
  if (profile?.current_training_plan_id) {
    const { data, error: tErr } = await supabase
      .from('training_plans')
      .select('training_plan_id')
      .eq('id', profile.current_training_plan_id)
      .maybeSingle()
    if (tErr) throw new Error(`Lookup de training_plan falhou: ${tErr.message}`)
    trainingPlanCode = data?.training_plan_id ?? null
  }
  if (profile?.current_meal_plan_id) {
    const { data, error: mErr } = await supabase
      .from('meal_plans')
      .select('meal_plan_id')
      .eq('id', profile.current_meal_plan_id)
      .maybeSingle()
    if (mErr) throw new Error(`Lookup de meal_plan falhou: ${mErr.message}`)
    mealPlanCode = data?.meal_plan_id ?? null
  }
  return { trainingPlanCode, mealPlanCode, subscriptionTypeId: profile?.subscription_type_id ?? null }
}

export async function getPlanApproval(supabase: SupabaseClient, userId: string): Promise<PlanApproval> {
  const current = await getCurrentPlanCodes(supabase, userId)

  let requiredRoles: ReviewRole[] = ['personal', 'nutricionista'] // falha fechada
  if (current.subscriptionTypeId) {
    const { data: sub, error } = await supabase
      .from('subscription_types')
      .select('includes_training, includes_meals')
      .eq('id', current.subscriptionTypeId)
      .maybeSingle()
    if (error) throw new Error(`Lookup de subscription_type falhou: ${error.message}`)
    if (sub) {
      requiredRoles = []
      if (sub.includes_training) requiredRoles.push('personal')
      if (sub.includes_meals) requiredRoles.push('nutricionista')
    }
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('plan_reviews')
    .select('role, status, training_plan_id, meal_plan_id')
    .eq('user_id', userId)
  if (reviewsError) throw new Error(`Lookup de plan_reviews falhou: ${reviewsError.message}`)
  const byRole = new Map((reviews ?? []).map((r: any) => [r.role, r]))

  const pendingRoles = requiredRoles.filter((role) => {
    const review: any = byRole.get(role)
    if (!review || review.status !== 'approved') return true
    const reviewedCode = role === 'personal' ? review.training_plan_id : review.meal_plan_id
    const currentCode = role === 'personal' ? current.trainingPlanCode : current.mealPlanCode
    return !currentCode || reviewedCode !== currentCode
  })

  return {
    approved: requiredRoles.length > 0 && pendingRoles.length === 0,
    requiredRoles,
    pendingRoles,
  }
}
