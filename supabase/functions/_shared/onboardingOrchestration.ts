import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Núcleo compartilhado da geração pós-onboarding -- usado por
// ybytu-onboarding-complete (chamada pelo widget logo após o cadastro),
// ybytu-onboarding-retry-cron (retoma travados/falhos) e
// ybytu-admin-retry-plan-generation (botão manual do staff). Um só lugar
// escreve plan_generation_status/error/attempts -- antes disso cada chamador
// tinha sua própria lógica, e o caso Rayan Road (2026-09-17) mostrou o custo:
// um gate de 403 no gerador de nutrição nunca escrevia status nenhum, e o
// treino (chamado depois) sobrescrevia com 'ok', escondendo a falha real.

const SUBSCRIPTION_PLANS = {
  TRAINING: '3a5ccc00-77ed-4b87-8e83-bc35be63a862',
  MEAL: '7458939c-ed4b-4a16-960e-b647f94e6a9b',
  COMPLETE: '7b5502f1-eeed-4640-8c4f-0ebc0502481e',
}

export const MAX_GENERATION_ATTEMPTS = 3
export const STUCK_AFTER_MINUTES = 10

export type ClaimResult =
  | { claimed: true; attempts: number; startedAt: string }
  | { claimed: false; reason: 'already_in_progress_or_done' | 'max_attempts_reached' }

// Reivindicação atômica: WHERE na mesma query que faz o UPDATE é o que
// garante exclusão mútua real (o Postgres serializa updates concorrentes na
// mesma linha) -- duas chamadas simultâneas pra este userId só uma recebe
// linha de volta, a outra recebe null e sai sem gerar de novo.
export async function claimGenerationJob(supabase: SupabaseClient, userId: string): Promise<ClaimResult> {
  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select('plan_generation_attempts')
    .eq('id', userId)
    .maybeSingle()
  if (readError) throw new Error(`claimGenerationJob leitura falhou: ${readError.message}`)

  const attemptsSoFar = current?.plan_generation_attempts ?? 0
  if (attemptsSoFar >= MAX_GENERATION_ATTEMPTS) {
    return { claimed: false, reason: 'max_attempts_reached' }
  }

  const nowIso = new Date().toISOString()
  const stuckCutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000).toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      plan_generation_status: 'generating',
      plan_generation_started_at: nowIso,
      plan_generation_attempts: attemptsSoFar + 1,
    })
    .eq('id', userId)
    .lt('plan_generation_attempts', MAX_GENERATION_ATTEMPTS)
    .or(`plan_generation_status.in.(pending,failed),and(plan_generation_status.eq.generating,plan_generation_started_at.lt.${stuckCutoff})`)
    .select('id, plan_generation_attempts, plan_generation_started_at')
    .maybeSingle()

  if (error) throw new Error(`claimGenerationJob update falhou: ${error.message}`)
  if (!data) return { claimed: false, reason: 'already_in_progress_or_done' }

  return { claimed: true, attempts: data.plan_generation_attempts, startedAt: data.plan_generation_started_at }
}

async function invokeGeneratorInternal(
  supabaseUrl: string,
  internalSecret: string,
  fnName: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  let res: Response
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalSecret}` },
      body: JSON.stringify({ user_id: userId }),
    })
  } catch (fetchErr) {
    return { ok: false, error: `${fnName}: falha de rede/infra ao chamar -- ${(fetchErr as Error).message}` }
  }

  const body = await res.json().catch(() => null)

  // Confere as TRÊS coisas -- achado 2026-09-17 (caso Rayan Road): um fetch
  // não "rejeita" sozinho em 4xx/5xx, e um corpo success:false com HTTP 200
  // (ex: no_safe_meals) passa batido se só olhar res.ok. Nunca segue adiante
  // em silêncio em nenhum dos três casos.
  if (!res.ok) {
    return { ok: false, error: `${fnName}: HTTP ${res.status} -- ${body?.message || body?.error || 'sem detalhe no corpo'}` }
  }
  if (!body || typeof body !== 'object') {
    return { ok: false, error: `${fnName}: corpo de resposta vazio ou não é JSON` }
  }
  if (body.success === false || body.access_denied === true) {
    return { ok: false, error: `${fnName}: success=false${body.status ? ` (${body.status})` : ''} -- ${body.message || body.error || 'sem detalhe'}` }
  }
  return { ok: true }
}

export async function runGenerationAndVerify(
  supabase: SupabaseClient,
  userId: string,
  startedAt: string,
): Promise<{ status: 'ok' | 'failed'; error?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_type_id')
    .eq('id', userId)
    .single()
  if (profileError || !profile) {
    const msg = `profile não encontrado no início da geração: ${profileError?.message ?? 'sem linha'}`
    await supabase.from('profiles').update({ plan_generation_status: 'failed', plan_generation_error: msg }).eq('id', userId)
    return { status: 'failed', error: msg }
  }

  // subscription_type_id lido do BANCO (já salvo pelo profile-save desta
  // mesma execução, ou de uma anterior) -- nunca mais confiar num valor local
  // do client, que foi a causa raiz do caso Rayan Road (client sempre
  // assumia COMPLETE independente do que estava gravado).
  //
  // Assinatura NULL ou fora dos 3 planos conhecidos = 'failed', nunca 'ok'
  // (achado 2026-09-21, conta Rayan Road de 17/09: com NULL, isMeal e
  // isTraining davam false, nada era gerado, e a conferência abaixo passava
  // por vazio -- 'ok' sem plano nenhum exigido, invisível em FailedPlans).
  // 'ok' só vale depois de conferir que os planos EXIGIDOS existem, e sem
  // saber a assinatura não se sabe o que é exigido.
  if (!Object.values(SUBSCRIPTION_PLANS).includes(profile.subscription_type_id)) {
    const msg = 'assinatura ausente ou desconhecida'
    await supabase.from('profiles').update({ plan_generation_status: 'failed', plan_generation_error: msg }).eq('id', userId)
    return { status: 'failed', error: msg }
  }
  const isMeal = [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(profile.subscription_type_id)
  const isTraining = [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(profile.subscription_type_id)

  const errors: string[] = []

  // SEQUENCIAL, nutrição primeiro -- mesmo motivo já documentado no widget
  // (rate limit de TPM do Groq compartilhado, nutrição é 1 chamada só).
  if (isMeal) {
    const result = await invokeGeneratorInternal(supabaseUrl, internalSecret, 'ybytu-generate-meal-plan', userId)
    if (!result.ok) { errors.push(result.error!); console.error('[onboardingOrchestration]', result.error) }
  }
  if (isTraining) {
    const result = await invokeGeneratorInternal(supabaseUrl, internalSecret, 'ybytu-generate-training-plan', userId)
    if (!result.ok) { errors.push(result.error!); console.error('[onboardingOrchestration]', result.error) }
  }

  // Confere o plano DESTA execução -- created_at >= startedAt. Sem isso, uma
  // retomada do cron marcaria 'ok' por causa de um plano ANTIGO (current_*_
  // plan_id de uma tentativa anterior), mesmo que a geração de agora tenha
  // falhado. user_training_plans/user_meal_plans são logs append-only reais
  // (nunca sobrescrevem), então "existe linha criada depois de startedAt" é
  // uma prova real de que ESTA tentativa gerou o plano, não uma anterior.
  let hasTraining = true
  let hasMeal = true

  if (isTraining) {
    const { count, error: countErr } = await supabase
      .from('user_training_plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startedAt)
    if (countErr) throw new Error(`conferência de user_training_plans falhou: ${countErr.message}`)
    hasTraining = (count ?? 0) > 0
  }
  if (isMeal) {
    const { count, error: countErr } = await supabase
      .from('user_meal_plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startedAt)
    if (countErr) throw new Error(`conferência de user_meal_plans falhou: ${countErr.message}`)
    hasMeal = (count ?? 0) > 0
  }

  if (hasTraining && hasMeal) {
    await supabase.from('profiles').update({ plan_generation_status: 'ok', plan_generation_error: null }).eq('id', userId)
    return { status: 'ok' }
  }

  const missing: string[] = []
  if (isTraining && !hasTraining) missing.push('treino')
  if (isMeal && !hasMeal) missing.push('nutrição')
  const finalError = [...errors, `sem linha nova em: ${missing.join(', ')}`].join(' | ')
  await supabase.from('profiles').update({ plan_generation_status: 'failed', plan_generation_error: finalError }).eq('id', userId)
  return { status: 'failed', error: finalError }
}
