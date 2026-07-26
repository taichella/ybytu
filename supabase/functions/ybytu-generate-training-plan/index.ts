import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  // DÉBITO pré-lançamento: restringir à(s) origem(ns) do frontend antes do
  // go-live — mesma família do débito de RLS já fechado nesta revisão.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Gate de acesso (piloto) ──────────────────────────────────────────────────
// DÉBITO: não existe tabela `subscriptions` nem coluna de início de trial
// (trial_started_at) hoje — não há como calcular "dias restantes de trial".
// Enquanto isso não existir, o piloto é permissivo: todo usuário autenticado
// passa, e a decisão fica logada. Quando o pagamento/trial por data existir,
// trocar o corpo desta função pela checagem real e virar PILOT_MODE=false.
const PILOT_MODE = true

function checkAccess(profile: { id: string }): { allowed: boolean; reason: string } {
  if (PILOT_MODE) return { allowed: true, reason: 'pilot_mode_open' }
  return { allowed: false, reason: 'no_active_subscription_or_trial' }
}

// ─── Equipamento elegível por ambiente (decisão A/B da revisão de arquitetura) ─
// bar_fixed_bar entra em "casa": barra de porta é equipamento doméstico comum
// e barato — sem ela o pool de costas em casa cai para quase zero (verificado:
// 197 exercícios sem ela, 242 com ela — bate com o número fechado na revisão).
const HOME_EQUIPMENT_WHITELIST = [
  'none_bodyweight', 'dumbbells', 'elastic_band_mini_band', 'bench', 'box',
  'kettlebell', 'step', 'ab_wheel', 'wall', 'medicine_ball', 'jump_rope',
  'mat_rug', 'trx', 'swiss_ball', 'battle_rope', 'bar_fixed_bar',
]

// ─── Molde de dias (esqueleto de split) ───────────────────────────────────────
// tr_201 (o único Original "home") não tem day_number/order_within_day
// preenchidos no banco — é uma lista solta de 79 exercícios, não um plano
// estruturado por dia. Por isso o esqueleto de dias vem SEMPRE de um Original
// de academia, para qualquer ambiente: a estrutura (quais grupos musculares em
// qual dia, quantos slots) é agnóstica de equipamento — só o exercício que
// preenche cada slot muda pelo pool seguro (casa vs. academia).

function nearestMoldeDays(days: number): number {
  const options = [3, 4, 5]
  return options.reduce((best, opt) => (Math.abs(opt - days) < Math.abs(best - days) ? opt : best))
}

// ─── REGRA 0: seleção do molde por (objetivo × dias) ──────────────────────────
// Confirmado por query real do banco (goals_ids): weight_loss e hypertrophy têm
// moldes próprios de academia por dias (3/4/5). conditioning e health_routine
// NÃO têm molde próprio — usam a MESMA estrutura do molde weight_loss (decisão
// da Taina: ritmo moderado/sustentável pra saúde geral, não emagrecimento
// intenso — só a matriz de séries muda, não o esqueleto de dias, ver abaixo).
// tr_201 (o único Original "home", health_routine) fica FORA da REGRA 0:
// day_number nulo, gaps, exercício repetido 3x — pendente de revisão
// profissional, nunca é selecionado aqui.
const MOLDE_BY_GOAL_AND_DAYS: Record<string, Record<number, string>> = {
  weight_loss:    { 3: 'tr_202', 4: 'tr_204', 5: 'tr_206' },
  hypertrophy:    { 3: 'tr_203', 4: 'tr_205', 5: 'tr_207' },
  conditioning:   { 3: 'tr_202', 4: 'tr_204', 5: 'tr_206' }, // empresta estrutura do weight_loss
  health_routine: { 3: 'tr_202', 4: 'tr_204', 5: 'tr_206' }, // empresta estrutura do weight_loss
}

function moldeForGoal(goal: string, requestedDays: number): { moldeDays: number; moldeTrainingPlanId: string } {
  const moldeDays = nearestMoldeDays(requestedDays)
  const byGoal = MOLDE_BY_GOAL_AND_DAYS[goal] ?? MOLDE_BY_GOAL_AND_DAYS.health_routine
  return { moldeDays, moldeTrainingPlanId: byGoal[moldeDays] }
}

// ─── REGRA 0: matriz de séries/reps/descanso — SÓ para objetivos sem molde
// dedicado ──────────────────────────────────────────────────────────────────
// weight_loss (tr_202/204/206) e hypertrophy (tr_203/205/207) JÁ têm
// sets/reps/rest_seconds curados por exercício no banco (confirmado: ex_031 é
// rest 60s em tr_202 vs 120s em tr_203 pro MESMO exercício; ex_098 é 1x25 em
// ambos — um finisher deliberado, não um "3 séries" genérico). Sobrescrever
// isso com uma matriz genérica seria regressão, não melhoria — por isso essa
// matriz NUNCA se aplica a esses dois objetivos, e o ajuste de nível (abaixo)
// também não mexe neles: a única molde por (objetivo × dias) já serve todo
// nível — a personalização por nível acontece na SELEÇÃO do exercício (pool
// filtrado por exercise_level_id), não nas séries. Rebaixar ex_098 de 1→2
// séries pra um beginner, por exemplo, destruiria o finisher curado.
//
// conditioning/health_routine tomam emprestada a ESTRUTURA do molde
// weight_loss, mas os números emprestados são a curadoria do weight_loss —
// não fariam o objetivo pesar de verdade. Aqui sim a matriz sobrescreve, com
// ajuste de séries por nível: beginner -1 (mín. 2), intermediate = base,
// advanced +1. Reps e descanso são fixos por objetivo, não variam por nível.
const SETS_REPS_REST_BY_GOAL: Record<string, { sets: number; reps: number; rest_seconds: number }> = {
  conditioning:   { sets: 3, reps: 12, rest_seconds: 50 },
  health_routine: { sets: 3, reps: 12, rest_seconds: 50 }, // mesma matriz do conditioning (decisão da Taina)
}

const GOALS_WITH_DEDICATED_MOLDE = new Set(['weight_loss', 'hypertrophy'])

// ─── Nome amigável — rótulo curto em PT-BR pro usuário, nunca o slug em inglês ─
const GOAL_LABEL_PTBR: Record<string, string> = {
  weight_loss:    'Emagrecimento',
  hypertrophy:    'Hipertrofia',
  conditioning:   'Condicionamento',
  health_routine: 'Rotina Saudável',
}
function goalLabelPtbr(goal: string): string {
  return GOAL_LABEL_PTBR[goal] ?? goal
}

function setsRepsRestForSlot(
  goal: string,
  level: string,
  moldeSlot: { sets: number; reps: number; rest_seconds: number },
): { sets: number; reps: number; rest_seconds: number } {
  if (GOALS_WITH_DEDICATED_MOLDE.has(goal)) return moldeSlot // preserva curadoria real do banco

  const base = SETS_REPS_REST_BY_GOAL[goal] ?? SETS_REPS_REST_BY_GOAL.health_routine
  const levelDelta = level === 'beginner' ? -1 : level === 'advanced' ? 1 : 0
  return { sets: Math.max(2, base.sets + levelDelta), reps: base.reps, rest_seconds: base.rest_seconds }
}

// ─── REGRA 1: duração → nº de slots por dia ────────────────────────────────────
// Fórmula calibrada nos moldes reais (~7min/slot, 5min fixos de aquecimento já
// embutidos na instruction_pt): round((duração-5)/7), piso 3 slots/dia.
// Confere com os nativos: 15→3, 30→4, 45→6, 60→8, 75→10, 90→12. O piso é um
// mínimo da FÓRMULA, não um mínimo forçado no dia — se o molde nativo tiver
// menos slots que o piso, ele não é esticado (ver cutSlotsForDuration abaixo).
function targetSlotsPerDay(durationMinutes: number): number {
  return Math.max(3, Math.round((durationMinutes - 5) / 7))
}

// ─── REGRA 1 + REGRA 2 (parte 1 — proteção): corta slots por dia até bater com
// targetSlotsPerDay. NUNCA estende além do nativo do molde (dia com 7 slots e
// duração pedindo 8 fica em 7 — mais curto, mas honesto).
//
// Prioridade de corte (quem sai primeiro):
//   1. slot NÃO focado sai antes de um focado — foco fica imune ao corte
//      ENQUANTO houver outro slot cortável. Essa imunidade é RELATIVA: se só
//      sobrarem slots focados e ainda faltar cortar, o corte invade eles
//      também — a duração é o teto físico e nunca cede pro foco.
//   2. dentro do mesmo grupo (focado/não-focado), sai primeiro quem cobre
//      MENOS grupos musculares (isolado antes de composto).
//   3. empate → sai primeiro quem tem order_within_day MAIOR (o molde já põe
//      compostos no início do dia, isolados no fim).
function cutSlotsForDuration<
  T extends { day_number: number; order_within_day: number; target_muscle_groups: string[] }
>(slots: T[], targetSlots: number, focusMuscleGroups: string[]): { survivors: T[]; anyDayTrimmed: boolean } {
  const byDay = new Map<number, T[]>()
  for (const slot of slots) {
    const list = byDay.get(slot.day_number) ?? []
    list.push(slot)
    byDay.set(slot.day_number, list)
  }

  let anyDayTrimmed = false
  const survivors: T[] = []

  for (const daySlots of byDay.values()) {
    const native = daySlots.length
    if (native <= targetSlots) {
      survivors.push(...daySlots) // não estende além do nativo — piso da fórmula não força slot extra
      continue
    }
    anyDayTrimmed = true
    const toRemove = native - targetSlots

    const isFocused = (s: T) =>
      focusMuscleGroups.length > 0 && s.target_muscle_groups.some(m => focusMuscleGroups.includes(m))

    // Ordenado do "sai primeiro" pro "sai por último". Quando todos os slots
    // restantes são focados (isFocused empata em true), o critério cai pra
    // cobertura/order_within_day normalmente — o corte continua acontecendo,
    // só não prioriza QUEM entre eles sai. toRemove sempre é respeitado.
    const removalOrder = [...daySlots].sort((a, b) => {
      if (isFocused(a) !== isFocused(b)) return isFocused(a) ? 1 : -1
      if (a.target_muscle_groups.length !== b.target_muscle_groups.length)
        return a.target_muscle_groups.length - b.target_muscle_groups.length
      return b.order_within_day - a.order_within_day
    })

    const removed = new Set(removalOrder.slice(0, toRemove).map(s => s.order_within_day))
    survivors.push(...daySlots.filter(s => !removed.has(s.order_within_day)))
  }

  return { survivors, anyDayTrimmed }
}

// ─── REGRA 2 (parte 2 — reforço): +1 set nos slots focados sobreviventes. Só
// entra pra conditioning/health_routine (matriz genérica) — pra
// weight_loss/hypertrophy (molde curado), foco já atuou como proteção no corte
// acima e NÃO soma set: mesma razão do ex_098 na REGRA 0 (nível também não
// mexe no molde curado). Sets curados não levam patches acumuláveis de nível
// nem de foco — só a proteção contra corte conta como reforço nesses casos.
function applyFocusBonus<T extends { sets: number; target_muscle_groups: string[] }>(
  slots: T[],
  goal: string,
  focusMuscleGroups: string[],
): T[] {
  if (GOALS_WITH_DEDICATED_MOLDE.has(goal) || focusMuscleGroups.length === 0) return slots
  return slots.map(slot =>
    slot.target_muscle_groups.some(m => focusMuscleGroups.includes(m)) ? { ...slot, sets: slot.sets + 1 } : slot,
  )
}

// ─── Mensagens fixas de caution (dicionário, não IA — segurança não pode variar) ─
const CAUTION_MESSAGES: Record<string, string> = {
  asthma: 'Você reportou asma — alguns exercícios abaixo pedem atenção ao ritmo respiratório.',
  diabetes: 'Você reportou diabetes — monitore sinais de hipoglicemia durante os exercícios abaixo.',
  knee_pain: 'Você reportou dor no joelho — os exercícios abaixo pedem atenção redobrada à execução.',
  high_blood_pressure: 'Você reportou pressão alta — evite prender a respiração nos exercícios abaixo.',
  lumbar_hernia: 'Você reportou hérnia lombar — os exercícios abaixo pedem atenção à postura da coluna.',
  lumbar_pain: 'Você reportou dor lombar — os exercícios abaixo pedem atenção à postura da coluna.',
  obesity: 'Considere adaptar a intensidade dos exercícios abaixo ao seu condicionamento atual.',
  heart_condition: 'Você reportou uma condição cardíaca — monitore sua frequência cardíaca nos exercícios abaixo.',
  pregnancy: 'Você está gestante — os exercícios abaixo pedem adaptação e acompanhamento médico.',
  pregnancy_postpartum: 'Você está no pós-parto — os exercícios abaixo pedem progressão gradual.',
  cervical_hernia: 'Você reportou hérnia cervical — os exercícios abaixo pedem atenção ao pescoço.',
  neck_pain: 'Você reportou dor no pescoço — os exercícios abaixo pedem atenção à postura cervical.',
  back_pain: 'Você reportou dor nas costas — os exercícios abaixo pedem atenção à execução.',
  shoulder_pain: 'Você reportou dor no ombro — os exercícios abaixo pedem atenção à amplitude de movimento.',
  ankle_pain: 'Você reportou dor no tornozelo — os exercícios abaixo pedem atenção ao apoio e equilíbrio.',
  elbow_pain: 'Você reportou dor no cotovelo — os exercícios abaixo pedem atenção à execução.',
  groin_pain: 'Você reportou dor na virilha — os exercícios abaixo pedem atenção à amplitude de movimento.',
  hamstring_injury: 'Você reportou lesão nos posteriores de coxa — os exercícios abaixo pedem progressão cautelosa.',
  hip_pain: 'Você reportou dor no quadril — os exercícios abaixo pedem atenção à execução.',
  pelvic_floor_issues: 'Você reportou questões de assoalho pélvico — os exercícios abaixo pedem atenção à pressão intra-abdominal.',
  wrist_pain: 'Você reportou dor no punho — os exercícios abaixo pedem atenção ao apoio de mãos.',
  joint_problems_severe: 'Você reportou problemas articulares — os exercícios abaixo pedem atenção redobrada.',
  balance_issues: 'Você reportou questões de equilíbrio — os exercícios abaixo pedem atenção extra.',
  anxiety: 'Os exercícios abaixo podem elevar a frequência cardíaca — ajuste a intensidade se sentir desconforto.',
  depression: 'Vá no seu ritmo com os exercícios abaixo.',
}
const DEFAULT_CAUTION_MESSAGE = 'Você reportou uma condição que pede atenção extra em alguns exercícios deste plano.'

function pgArrayLiteral(values: string[]): string {
  return `{${values.join(',')}}`
}

// ─── Etapa 2: IA compõe (Gemini flash, mesma função/retry da nutrição) ───────
// Camada opcional — qualquer falha aqui é absorvida pela re-validação por slot
// mais abaixo, que cai no determinístico da Etapa 1. Nunca é dependência dura.
async function callGemini(prompt: string, apiKey: string, retries = 3): Promise<any> {
  // 'gemini-flash-latest' é um alias mantido pelo Google que sempre aponta pro
  // flash recomendado atual — evita escolher um nome versionado (ex.: 2.5-flash)
  // que a própria API de listagem ainda anuncia mas já responde 404 "no longer
  // available to new users" em generateContent (visto em teste real com chave nova).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    const data = await res.json()

    if (data.error?.code === 503 || data.error?.code === 429) {
      if (attempt === retries) throw new Error('Gemini overloaded: ' + data.error.message)
      await new Promise(r => setTimeout(r, attempt * 3000))
      continue
    }
    if (data.error) throw new Error('Gemini error: ' + JSON.stringify(data.error))

    return JSON.parse(
      data.candidates[0].content.parts[0].text
        .replace(/```json/gi, '').replace(/```/g, '').trim()
    )
  }
}

// ─── Ranking de candidatos por slot (base do determinístico E do que a IA vê) ─
// Mesmo critério que a Etapa 1 sempre usou: mais overlap com o grupo-alvo do
// slot vence, empate quebra por exercise_id. Cortado em CANDIDATE_LIMIT — essa
// é a MESMA lista oferecida à IA e usada pra validar a resposta dela (nenhuma
// lista "escondida" maior por trás). Posição 0 é sempre o pick determinístico.
const CANDIDATE_LIMIT = 8

function rankedCandidates(targetMuscles: string[], pool: any[]) {
  return pool
    .map((ex: any) => ({
      ...ex,
      __overlap: (ex.muscle_groups_ids ?? []).filter((m: string) => targetMuscles.includes(m)).length,
    }))
    .filter((ex: any) => targetMuscles.length === 0 || ex.__overlap > 0)
    .sort((a: any, b: any) => b.__overlap - a.__overlap || a.exercise_id.localeCompare(b.exercise_id))
    .slice(0, CANDIDATE_LIMIT)
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth: userId from JWT, never from body
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return new Response(
      JSON.stringify({ success: false, error: 'Missing authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    const userId = user.id

    // ── PASSO 0: ler perfil ──────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, exercise_level_id, exercise_environment_id, exercise_equipments_ids, goals_ids, physical_conditions_ids, health_conditions_ids, training_days_per_week, training_duration_minutes, muscle_groups_ids, age, activity_level_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) throw new Error('Profile not found')

    // ── GUARD CLAUSE: gate isolado da geração, roda antes de tudo abaixo ─────
    const access = checkAccess(profile)
    console.log(`[checkAccess] user=${userId} allowed=${access.allowed} reason=${access.reason}`)
    if (!access.allowed) {
      return new Response(
        JSON.stringify({ success: false, access_denied: true, message: 'Access denied.', reason: access.reason }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── PASSO 0: traduzir UUIDs → slugs (1 hop) em paralelo ──────────────────
    const [levelRes, envRes, goalsRes, healthRes, activityRes] = await Promise.all([
      profile.exercise_level_id
        ? supabase.from('exercise_levels').select('exercise_level_id').eq('id', profile.exercise_level_id).single()
        : Promise.resolve({ data: { exercise_level_id: 'beginner' }, error: null }),

      profile.exercise_environment_id
        ? supabase.from('exercise_environment').select('exercise_environment_id').eq('id', profile.exercise_environment_id).single()
        : Promise.resolve({ data: { exercise_environment_id: 'home_no_equipment' }, error: null }),

      profile.goals_ids?.length > 0
        ? supabase.from('goals').select('goal_id').in('id', profile.goals_ids)
        : Promise.resolve({ data: [], error: null }),

      profile.health_conditions_ids?.length > 0
        ? supabase.from('health_conditions').select('health_condition_id').in('id', profile.health_conditions_ids)
        : Promise.resolve({ data: [], error: null }),

      // BLOCO 2 (ponto 2): sinal de personalização pra IA, NÃO um novo filtro
      // de segurança — se ausente, fica null e a IA simplesmente não recebe
      // esse sinal (nunca inventa um default, ao contrário de level/environment
      // acima que precisam de fallback pro pool não quebrar).
      profile.activity_level_id
        ? supabase.from('activity_levels').select('name').eq('id', profile.activity_level_id).single()
        : Promise.resolve({ data: null, error: null }),
    ])

    const levelSlug = levelRes.data?.exercise_level_id ?? 'beginner'
    const environmentSlug = envRes.data?.exercise_environment_id ?? 'home_no_equipment'
    const goalSlugs = (goalsRes.data ?? []).map((g: any) => g.goal_id)
    const healthConditionSlugs = (healthRes.data ?? [])
      .map((h: any) => h.health_condition_id)
      .filter((s: string) => s && s !== 'none' && s !== 'other')

    const userAge: number | null = profile.age ?? null
    const activityLevelSlug: string | null = activityRes.data?.name ?? null

    // ── PASSO 0: equipamento — 2 hops (onboarding grouping → equipamento fino) ─
    let equipmentSlugs: string[] = []
    if (profile.exercise_equipments_ids?.length > 0) {
      const { data: onboardingEq } = await supabase
        .from('onboarding_exercise_equipments')
        .select('main_exercise_equipments_ids')
        .in('id', profile.exercise_equipments_ids)

      const fineEquipIds = [...new Set(
        (onboardingEq ?? []).flatMap((row: any) => row.main_exercise_equipments_ids ?? [])
      )]

      if (fineEquipIds.length > 0) {
        const { data: fineEquip } = await supabase
          .from('exercise_equipments')
          .select('exercise_equipment_id')
          .in('id', fineEquipIds)
        equipmentSlugs = (fineEquip ?? []).map((e: any) => e.exercise_equipment_id)
      }
    }

    // ── PASSO 0: physical conditions — 3 hops (onboarding → physical_conditions → bridge) ─
    let physicalConditionSlugs: string[] = []
    if (profile.physical_conditions_ids?.length > 0) {
      const { data: onboardingPain } = await supabase
        .from('onboarding_physical_conditions')
        .select('main_physical_conditions_ids')
        .in('id', profile.physical_conditions_ids)

      // main_physical_conditions_ids é TEXT (1 uuid por linha), não array — apesar do nome no plural
      const finePainIds = [...new Set(
        (onboardingPain ?? []).map((row: any) => row.main_physical_conditions_ids).filter(Boolean)
      )]

      if (finePainIds.length > 0) {
        const { data: finePain } = await supabase
          .from('physical_conditions')
          .select('physical_condition_id')
          .in('id', finePainIds)

        const painSlugs = (finePain ?? []).map((p: any) => p.physical_condition_id).filter(Boolean)

        if (painSlugs.length > 0) {
          // Bridge: physical_condition_id não é o mesmo slug usado em exercises —
          // ex: 'neck' expande para ['cervical_hernia','neck_pain'].
          const { data: bridgeRows } = await supabase
            .from('physical_condition_exercise_slugs')
            .select('exercise_condition_slugs')
            .in('physical_condition_id', painSlugs)

          physicalConditionSlugs = [...new Set(
            (bridgeRows ?? []).flatMap((r: any) => r.exercise_condition_slugs ?? [])
          )]
        }
      }
    }

    const userConditionSlugs = [...new Set([...healthConditionSlugs, ...physicalConditionSlugs])]
      .filter(s => s && s !== 'none' && s !== 'other')

    // ── PASSO 0: foco muscular (REGRA 2) — 2 hops (onboarding grouping → slug fino) ─
    let focusMuscleGroupSlugs: string[] = []
    if (profile.muscle_groups_ids?.length > 0) {
      const { data: onboardingMuscle } = await supabase
        .from('onboarding_muscle_groups')
        .select('main_muscle_groups_ids')
        .in('id', profile.muscle_groups_ids)

      const fineMuscleIds = [...new Set(
        (onboardingMuscle ?? []).flatMap((row: any) => row.main_muscle_groups_ids ?? [])
      )]

      if (fineMuscleIds.length > 0) {
        const { data: fineMuscle } = await supabase
          .from('muscle_groups')
          .select('muscle_group_id')
          .in('id', fineMuscleIds)
        focusMuscleGroupSlugs = (fineMuscle ?? []).map((m: any) => m.muscle_group_id)
      }
    }

    const requestedDays = profile.training_days_per_week ?? 3
    const trainingDuration = profile.training_duration_minutes ?? 45
    const primaryGoal = goalSlugs[0] ?? 'health_routine'

    // ── POOL SEGURO ───────────────────────────────────────────────────────────
    const eligibleLevels = levelSlug === 'intermediate' ? ['intermediate', 'beginner'] : [levelSlug]

    let allowedEquipment: string[] | null = null // null = qualquer equipamento (gym tem tudo)
    if (environmentSlug === 'home_no_equipment' || environmentSlug === 'outdoors') {
      // Confirmado: catálogo não tem exercício outdoor-específico — tratamos como bodyweight puro.
      allowedEquipment = ['none_bodyweight']
    } else if (environmentSlug === 'home_with_equipment') {
      allowedEquipment = [...new Set([
        'none_bodyweight',
        ...equipmentSlugs.filter(s => HOME_EQUIPMENT_WHITELIST.includes(s)),
      ])]
    }
    // environmentSlug === 'gym' → allowedEquipment fica null (todo o catálogo)

    let poolQuery = supabase
      .from('exercises')
      .select('exercise_id, name_ptbr, muscle_groups_ids, exercise_level_id')
      .in('exercise_level_id', eligibleLevels)

    if (allowedEquipment !== null) {
      poolQuery = poolQuery.filter('exercise_equipments_ids', 'cd', pgArrayLiteral(allowedEquipment))
    }

    const { data: candidatePool, error: poolError } = await poolQuery
    if (poolError) throw new Error('Pool query failed: ' + poolError.message)

    // SEGURANÇA — roda ANTES de qualquer montagem, igual ao alérgeno na nutrição.
    // Exclui quem tem 'avoid' pra qualquer condição do usuário via a view
    // exercise_effective_cautions (nunca lê exercises.avoid_*_ids direto).
    let avoidExerciseIds = new Set<string>()
    if (userConditionSlugs.length > 0) {
      const { data: avoidRows, error: avoidError } = await supabase
        .from('exercise_effective_cautions')
        .select('exercise_id')
        .eq('tipo', 'avoid')
        .in('condition_slug', userConditionSlugs)
      if (avoidError) throw new Error('Avoid lookup failed: ' + avoidError.message)
      avoidExerciseIds = new Set((avoidRows ?? []).map((r: any) => r.exercise_id))
    }

    const safePool = (candidatePool ?? []).filter((e: any) => !avoidExerciseIds.has(e.exercise_id))

    if (safePool.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        status: 'no_safe_exercises',
        message: 'No safe exercises found for this profile (environment/level/equipment/conditions too restrictive).',
        profile_context: { level: levelSlug, environment: environmentSlug, condition_slugs: userConditionSlugs },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── MOLDE: esqueleto de dias vindo de um Original de academia (REGRA 0) ──
    const { moldeDays: moldeDaysCount, moldeTrainingPlanId } = moldeForGoal(primaryGoal, requestedDays)

    const { data: moldeSlotsRaw, error: moldeError } = await supabase
      .from('training_plan_exercises')
      .select('day_number, order_within_day, sets, reps, rest_seconds, exercise_id, cadence_eccentric, cadence_isometric_bottom, cadence_concentric, cadence_isometric_top')
      .eq('training_plan_id', moldeTrainingPlanId)
      .order('day_number', { ascending: true })
      .order('order_within_day', { ascending: true })
    if (moldeError || !moldeSlotsRaw || moldeSlotsRaw.length === 0) throw new Error('Molde not found: ' + moldeTrainingPlanId)

    const moldeExerciseIds = [...new Set(moldeSlotsRaw.map((s: any) => s.exercise_id))]
    const { data: moldeExercises, error: moldeExError } = await supabase
      .from('exercises')
      .select('exercise_id, muscle_groups_ids')
      .in('exercise_id', moldeExerciseIds)
    if (moldeExError) throw new Error('Molde exercises lookup failed: ' + moldeExError.message)

    const moldeMuscleGroupsById = new Map<string, string[]>(
      (moldeExercises ?? []).map((e: any) => [e.exercise_id, e.muscle_groups_ids ?? []])
    )

    const slots = moldeSlotsRaw.map((s: any) => {
      const { sets, reps, rest_seconds } = setsRepsRestForSlot(primaryGoal, levelSlug, {
        sets: s.sets,
        reps: s.reps,
        rest_seconds: s.rest_seconds,
      })
      return {
        day_number: s.day_number,
        order_within_day: s.order_within_day,
        sets,
        reps,
        rest_seconds,
        cadence_eccentric: s.cadence_eccentric,
        cadence_isometric_bottom: s.cadence_isometric_bottom,
        cadence_concentric: s.cadence_concentric,
        cadence_isometric_top: s.cadence_isometric_top,
        target_muscle_groups: moldeMuscleGroupsById.get(s.exercise_id) ?? [],
      }
    })

    // ── REGRA 1: corta slots por duração ANTES de escolher exercício — não faz
    // sentido montar candidatos pra um slot que vai ser cortado. REGRA 2 entra
    // aqui como proteção (imunidade relativa no corte) e depois como reforço
    // (+1 set nos focados sobreviventes, só onde a matriz genérica rege).
    const targetSlots = targetSlotsPerDay(trainingDuration)
    const { survivors: slotsAfterDurationCut, anyDayTrimmed } = cutSlotsForDuration(slots, targetSlots, focusMuscleGroupSlugs)
    const focusedSlots = applyFocusBonus(slotsAfterDurationCut, primaryGoal, focusMuscleGroupSlugs)

    // ── CANDIDATOS POR SLOT (base do determinístico E do que a IA vê) ────────
    // Cada slot ganha sua lista de candidatos já ranqueada e cortada — a mesma
    // lista serve pra montar o prompt da IA e pra validar a resposta dela.
    const slotsWithCandidates = focusedSlots.map(slot => ({
      ...slot,
      candidates: rankedCandidates(slot.target_muscle_groups, safePool),
    }))

    // Determinístico (Etapa 1): posição 0 do ranking, ou fallback alfabético
    // do safePool se nenhum candidato cobre o grupo-alvo do slot.
    //
    // REGRA DE DESIGN (registrada na revisão de arquitetura): reuso do mesmo
    // exercício entre dias é OK e ESPERADO quando o pool de um grupo muscular
    // é raso (ex: costas em beginner+casa) — o próprio tr_204 já repete
    // dia1==dia3 e dia2==dia4. Um bom exercício repetido é melhor que um ruim
    // forçado por "variedade".
    function deterministicPick(candidates: any[]) {
      if (candidates.length > 0) return { exercise_id: candidates[0].exercise_id, degraded: false }
      const fallback = [...safePool].sort((a, b) => a.exercise_id.localeCompare(b.exercise_id))[0]
      return { exercise_id: fallback.exercise_id, degraded: true }
    }

    // ── ETAPA 2: IA compõe (opcional) ────────────────────────────────────────
    // Uma única chamada pro plano inteiro (todos os dias, todos os slots) —
    // dá pra IA visão do plano completo pra decidir variedade/distribuição
    // com coerência entre dias, não slot por slot isolado.
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    let aiSelections: Record<string, string> = {}
    if (geminiKey) {
      const slotsForPrompt = slotsWithCandidates.map(s => ({
        slot_key: `${s.day_number}_${s.order_within_day}`,
        day: s.day_number,
        target_muscle_groups: s.target_muscle_groups,
        candidates: s.candidates.map((c: any) => ({
          exercise_id: c.exercise_id,
          name: c.name_ptbr,
          muscle_groups: c.muscle_groups_ids,
        })),
      }))

      // BLOCO 2 (ponto 2): age/activity level só entram na linha quando o
      // usuário preencheu — nunca fabrica um valor pra não enviesar a IA com
      // um sinal que não existe.
      const profileLines = [
        `- level: ${levelSlug}`,
        `- environment: ${environmentSlug}`,
        `- goals: ${goalSlugs.join(', ') || 'general fitness'}`,
        `- requested days per week: ${requestedDays}`,
        userAge !== null ? `- age: ${userAge}` : null,
        activityLevelSlug !== null ? `- activity level: ${activityLevelSlug}` : null,
      ].filter((line): line is string => line !== null).join('\n')

      const aiPrompt = `You are an expert personal trainer composing a ${moldeDaysCount}-day training plan personalized to this user.

USER PROFILE:
${profileLines}
(safety is already enforced upstream — every candidate below is pre-validated safe for this user; you never need to filter for conditions)

PLAN STRUCTURE (fixed — sets/reps/day layout already defined, you only choose which exercise fills each slot):
${JSON.stringify(slotsForPrompt, null, 2)}

Rules:
1. For each slot, pick exactly one exercise_id from THAT SLOT'S OWN "candidates" list only. Never invent ids, never use a candidate offered to a different slot.
2. Personalize using ALL profile signals together — level and goals are the primary drivers; age and activity level (when provided) are secondary PREFERENCE signals for choosing AMONG the candidates already offered for each slot. They are never a reason to exclude a candidate or invent one outside the list — every candidate in a slot's list is already safe and level-appropriate. Older and/or sedentary/lightly_active users: prefer the more accessible, lower-complexity candidate in the slot's list. Younger and/or active/very_active users: you may prefer the more challenging candidate that maximizes stimulus for the target muscles. If age/activity level are absent, personalize using level and goals alone.
3. Consider the plan as a whole: avoid repeating the same exercise across different days when a slot's candidate list offers a good alternative. Repetition is fine and expected when a slot's candidate list is shallow (few or one viable option) — do not sacrifice match quality just to avoid repetition.
4. You must return one selection per slot listed above.

Return ONLY valid JSON: { "selections": { "<slot_key>": "exercise_id", ... } }`

      try {
        const aiResult = await callGemini(aiPrompt, geminiKey)
        aiSelections   = (aiResult?.selections ?? {}) as Record<string, string>
      } catch (err) {
        console.error('[ybytu-generate-training-plan] Gemini call failed, falling back to deterministicPick:', err)
      }
    }

    // ── RE-VALIDAÇÃO (a cerca): confina a IA aos candidatos do slot certo ────
    // Aceita o pick da IA só se ele está na lista de candidatos DAQUELE slot
    // específico. Qualquer alucinação, invenção, ou pick de outro slot cai no
    // determinístico — o mesmo que a Etapa 1 já escolheria sozinha.
    const filledSlots = slotsWithCandidates.map(slot => {
      const key        = `${slot.day_number}_${slot.order_within_day}`
      const aiPick     = aiSelections[key]
      const validPick  = aiPick ? slot.candidates.find((c: any) => c.exercise_id === aiPick) : null

      if (validPick) {
        return { ...slot, chosen_exercise_id: validPick.exercise_id, degraded: false, filled_by: 'ai' as const }
      }

      const det = deterministicPick(slot.candidates)
      return { ...slot, chosen_exercise_id: det.exercise_id, degraded: det.degraded, filled_by: 'deterministic' as const }
    })

    const chosenExerciseIds = [...new Set(filledSlots.map(s => s.chosen_exercise_id))]

    // Equipamento realmente usado — derivado dos exercícios escolhidos, nunca hardcoded.
    const { data: chosenExDetails, error: chosenExError } = await supabase
      .from('exercises')
      .select('exercise_id, exercise_equipments_ids')
      .in('exercise_id', chosenExerciseIds)
    if (chosenExError) throw new Error('Chosen exercises lookup failed: ' + chosenExError.message)

    const equipmentActuallyUsed = [...new Set(
      (chosenExDetails ?? []).flatMap((e: any) => e.exercise_equipments_ids ?? [])
    )].sort()

    // ── CAUTION WARNINGS: consolidado por condição, não por exercício (R11) ──
    let cautionWarnings: any[] = []
    if (userConditionSlugs.length > 0) {
      const { data: cautionRows, error: cautionError } = await supabase
        .from('exercise_effective_cautions')
        .select('exercise_id, condition_slug')
        .eq('tipo', 'caution')
        .in('condition_slug', userConditionSlugs)
        .in('exercise_id', chosenExerciseIds)
      if (cautionError) throw new Error('Caution lookup failed: ' + cautionError.message)

      const byCondition: Record<string, Set<string>> = {}
      for (const row of (cautionRows ?? [])) {
        if (!byCondition[row.condition_slug]) byCondition[row.condition_slug] = new Set()
        byCondition[row.condition_slug].add(row.exercise_id)
      }

      cautionWarnings = Object.entries(byCondition).map(([condition, exIds]) => ({
        condition,
        mensagem: CAUTION_MESSAGES[condition] ?? DEFAULT_CAUTION_MESSAGE,
        exercise_ids: [...exIds].sort(),
      }))
    }

    // ── SALVA: training_plans (derivado, nunca mente) ────────────────────────
    const aiPlanSlug = `tr_ai_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    const planName = `Treino IA – ${goalLabelPtbr(primaryGoal)} – ${moldeDaysCount}x/semana`

    const { data: newPlan, error: planErr } = await supabase
      .from('training_plans')
      .insert({
        training_plan_id: aiPlanSlug,
        name_ptbr: planName,
        name_en: planName,
        days_per_week: moldeDaysCount,
        duration_minutes: trainingDuration,
        exercise_level_id: levelSlug,
        exercise_environments_ids: environmentSlug,
        exercise_equipment_ids: equipmentActuallyUsed.join(','),
        goals_ids: goalSlugs.join(','),
        created_by_ai: true,
        is_active: false,
        created_at: new Date().toISOString(),
        caution_warnings: cautionWarnings,
      })
      .select('id')
      .single()
    if (planErr) throw new Error('Failed to create AI training plan: ' + planErr.message)

    // ATENÇÃO — landmine de schema confirmada nesta sessão:
    // training_plan_exercises.training_plan_id é TEXT e guarda o SLUG
    // (ex: 'tr_204'), NÃO o uuid de training_plans.id — confirmado consultando
    // tr_204 direto. Já user_training_plans.training_plan_id é UUID e guarda
    // training_plans.id. Mesmo nome de coluna, tabelas diferentes, tipos e
    // significados diferentes — não trocar um pelo outro.
    const tpeRows = filledSlots.map(s => ({
      training_plan_id: aiPlanSlug,
      exercise_id: s.chosen_exercise_id,
      day_number: s.day_number,
      order_within_day: s.order_within_day,
      sets: s.sets,
      reps: s.reps,
      rest_seconds: s.rest_seconds,
      cadence_eccentric: s.cadence_eccentric,
      cadence_isometric_bottom: s.cadence_isometric_bottom,
      cadence_concentric: s.cadence_concentric,
      cadence_isometric_top: s.cadence_isometric_top,
    }))

    const { error: tpeErr } = await supabase.from('training_plan_exercises').insert(tpeRows)
    if (tpeErr) throw new Error('Failed to insert training_plan_exercises: ' + tpeErr.message)

    const [insertRes, updateRes] = await Promise.all([
      supabase.from('user_training_plans').insert({ user_id: userId, training_plan_id: newPlan.id }),
      supabase.from('profiles').update({ current_training_plan_id: newPlan.id }).eq('id', userId),
    ])
    if (insertRes.error) throw new Error('Failed to save plan link: ' + insertRes.error.message)
    if (updateRes.error) throw new Error('Failed to update profile: ' + updateRes.error.message)

    return new Response(JSON.stringify({
      success: true,
      ai_layer: !!geminiKey, // tentou IA; ver ai_filled_slots pra saber quanto dela realmente colou
      training_plan: {
        id: newPlan.id,
        training_plan_id: aiPlanSlug,
        name: planName,
        days_per_week: moldeDaysCount,
        duration_minutes: trainingDuration,
      },
      composition: filledSlots.map(s => ({
        day_number: s.day_number,
        order_within_day: s.order_within_day,
        exercise_id: s.chosen_exercise_id,
        sets: s.sets,
        reps: s.reps,
        rest_seconds: s.rest_seconds,
        degraded: s.degraded,
        filled_by: s.filled_by,
      })),
      caution_warnings: cautionWarnings,
      degraded_slots: filledSlots.some(s => s.degraded),
      ai_filled_slots: filledSlots.filter(s => s.filled_by === 'ai').length,
      deterministic_fallback_slots: filledSlots.filter(s => s.filled_by === 'deterministic').length,
      profile_context: {
        level: levelSlug,
        environment: environmentSlug,
        equipment_selected: equipmentSlugs,
        equipment_allowed: allowedEquipment,
        goals: goalSlugs,
        condition_slugs: userConditionSlugs,
        requested_days: requestedDays,
        plan_days: moldeDaysCount,
        days_adjusted: requestedDays !== moldeDaysCount,
        requested_duration_minutes: trainingDuration,
        target_slots_per_day: targetSlots,
        duration_adjusted: anyDayTrimmed,
        focus_muscle_groups: focusMuscleGroupSlugs,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
