import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { isInternalServiceCall } from '../_shared/internalAuth.ts'
import { collapseDuplicateNames, findDuplicateNameIds, normalizeExerciseName } from './exerciseNames.ts'

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

// ─── REGRA 0 (reformulada 2026-07-27): papéis de slot × objetivo ─────────────
// Mineração de 179 linhas dos 7 moldes ativos (tr_201-207) mostrou que
// sets/rest não são "por molde inteiro", são POR PAPEL do slot dentro do dia —
// e só os papéis compostos (o "peso" real do treino) escalam rest com o
// objetivo. Isolamento/core/cardio são FIXOS pro objetivo: confirmado que
// finisher (rosca/tríceps/panturrilha), core (abdominal) e cardio (esteira)
// têm o MESMO rest em tr_204 (weight_loss) e tr_205 (hypertrophy) — só os
// slots de 3/2 séries no topo do dia (supino/remada/leg press/agachamento)
// mudam de 60s pra 120s. Isso substitui a dicotomia antiga "molde dedicado
// (weight_loss/hypertrophy, sets intocados) vs matriz genérica achatada
// (conditioning/health_routine, 3x12@50s pra TUDO, ignorando o papel do
// slot)" — agora TODO objetivo passa pela MESMA matriz de papéis.
type SlotRole =
  | 'composto_principal'
  | 'composto_secundario'
  | 'isolamento'
  | 'core'
  | 'cardio'
  | 'leve_mobilidade' // papel NOVO — ver comentário mais abaixo, sem dado observado

const SETS_BY_ROLE: Record<SlotRole, number> = {
  composto_principal: 3,
  composto_secundario: 2,
  isolamento: 1,
  core: 3,
  cardio: 3,
  leve_mobilidade: 2,
}

// Só os dois papéis compostos escalam rest com o objetivo (60s ritmo
// sustentável / 120s hipertrofia). isolamento e cardio ficam fixos em 60s;
// core fixo em 45s (normaliza a variação 30s/60s que existia entre os moldes
// de 3 dias — nos moldes de 4/5 dias o core já era 45s fixo nos dois
// objetivos, então 45s é o padrão real, não um número inventado).
function restSecondsForRole(role: SlotRole, goal: string): number {
  if (role === 'composto_principal' || role === 'composto_secundario') {
    return goal === 'hypertrophy' ? 120 : 60
  }
  if (role === 'core') return 45
  // leve_mobilidade: PENDENTE de validação do personal trainer — não existe
  // nenhuma linha desse papel em nenhum molde real hoje (é o dia leve do
  // split de 7 dias, split novo). 40s é uma proposta razoável (descanso curto,
  // é recuperação ativa/mobilidade, não força bruta), não uma curadoria.
  if (role === 'leve_mobilidade') return 40
  return 60 // isolamento, cardio
}

// Reps-default SÓ pra slots que nunca existiram em nenhum molde real (splits
// desenhados do zero: 2/6/7 dias). Pra 3/4/5 dias, reps SEMPRE vem da linha
// real do molde (fetchMoldeSlotsWithMuscles abaixo) — nunca é reinventado.
const DEFAULT_REPS_BY_ROLE: Record<SlotRole, number> = {
  composto_principal: 12,
  composto_secundario: 12,
  isolamento: 15,
  core: 15,
  cardio: 12,
  leve_mobilidade: 12, // PENDENTE validação do personal trainer
}

// Nome do exercício vence a contagem de séries do molde pra decidir o papel:
// núcleo (abdominal) e cardio (esteira) são gravados com série alta (3, igual
// composto principal) mas NÃO escalam rest com o objetivo — por isso a
// classificação por nome roda ANTES do fallback por nº de séries.
const CORE_EXERCISE_NAMES = new Set(['Abdominal tradicional'])
const CARDIO_EXERCISE_NAMES = new Set(['Corrida em inclinação (esteira inclinada)'])

// Panturrilha entra aqui como isolamento de verdade (decisão desta sessão):
// os moldes de 4/5 dias guardavam ela com 2 séries e rest escalando com o
// objetivo (tratada como "quase-composto"), enquanto os moldes de 3 dias já
// guardavam ela como 1 série @60s fixo — as duas versões foram normalizadas
// pra isolamento (a classificação por nº de séries abaixo já resolve isso
// sozinha, sem precisar de um caso especial por nome).
function roleForMoldeSlot(exerciseNamePtbr: string, moldeSets: number): SlotRole {
  if (CORE_EXERCISE_NAMES.has(exerciseNamePtbr)) return 'core'
  if (CARDIO_EXERCISE_NAMES.has(exerciseNamePtbr)) return 'cardio'
  if (moldeSets === 1) return 'isolamento'
  if (moldeSets === 2) return 'composto_secundario'
  return 'composto_principal'
}

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

// ─── SPLITS: 2 a 7 dias ────────────────────────────────────────────────────
// dias 3/4 vêm direto dos moldes reais (tr_202/204 pra weight_loss/
// conditioning/health_routine — mesmo empréstimo de estrutura de sempre —,
// tr_203/205 pra hypertrophy). dia 5 é uma REFORMULAÇÃO: upper/lower
// U-L-U-L-U repetindo os dias 1(U)/2(L) do molde de 4 dias — o antigo dia 3
// de tr_206/tr_207 (híbrido condicionamento/core) foi identificado como
// acidental, não desenho intencional, e descartado (ver memória
// split-patterns-pending-validation). dias 2/6/7 são desenho NOVO, sem
// exercício-fonte real — action item explícito da Taina: nenhum dos 4 splits
// novos (2/5/6/7) vai pro onboarding do piloto sem validação de um personal
// trainer, mesmo gate que a base de exercícios já tem.
const REAL_MOLDE_DAYS = new Set([3, 4, 5])

const MOLDE_TRAINING_PLAN_BY_GOAL_AND_DAYS: Record<string, Record<3 | 4, string>> = {
  weight_loss:    { 3: 'tr_202', 4: 'tr_204' },
  hypertrophy:    { 3: 'tr_203', 4: 'tr_205' },
  conditioning:   { 3: 'tr_202', 4: 'tr_204' }, // empresta estrutura do weight_loss
  health_routine: { 3: 'tr_202', 4: 'tr_204' }, // empresta estrutura do weight_loss
}

const SUPPORTED_DAYS = [2, 3, 4, 5, 6, 7] as const
function nearestSupportedDays(days: number): number {
  return SUPPORTED_DAYS.reduce((best, opt) => (Math.abs(opt - days) < Math.abs(best - days) ? opt : best))
}

type SplitSlotDraft = {
  day_number: number
  order_within_day: number
  role: SlotRole
  reps: number
  target_muscle_groups: string[]
  cadence_eccentric: number
  cadence_isometric_bottom: number
  cadence_concentric: number
  cadence_isometric_top: number
}

// Cadência default (2-0-2-0) — mesmo valor fixo já usado em toda a base
// (confirmado: 100% dos slots de tr_202/204 têm essa cadência). Splits
// desenhados (2/6/7 dias) não têm linha de molde pra herdar cadência, então
// usam esse mesmo default, não um valor novo.
const DEFAULT_CADENCE = {
  cadence_eccentric: 2,
  cadence_isometric_bottom: 0,
  cadence_concentric: 2,
  cadence_isometric_top: 0,
}

type DesignedSlotSpec = { day_number: number; order_within_day: number; role: SlotRole; target_muscle_groups: string[] }

// ─── Split de 2 dias — full body A/B (DESENHO NOVO, pendente de validação) ──
// Cobertura por padrão de movimento (agachar/dobrar quadril/empurrar/puxar),
// não por músculo isolado — é o que um full body de 2x/semana precisa cobrir.
const SPLIT_2_DAYS: DesignedSlotSpec[] = [
  // Dia A — agachar + empurrar horizontal + puxar horizontal + core
  { day_number: 1, order_within_day: 1, role: 'composto_principal', target_muscle_groups: ['quadriceps', 'glutes', 'hamstrings'] },
  { day_number: 1, order_within_day: 2, role: 'composto_principal', target_muscle_groups: ['pectoralis_major', 'triceps_brachii', 'deltoids'] },
  { day_number: 1, order_within_day: 3, role: 'composto_secundario', target_muscle_groups: ['back', 'biceps_brachii'] },
  { day_number: 1, order_within_day: 4, role: 'composto_secundario', target_muscle_groups: ['glutes', 'hamstrings'] },
  { day_number: 1, order_within_day: 5, role: 'isolamento', target_muscle_groups: ['calves'] },
  { day_number: 1, order_within_day: 6, role: 'core', target_muscle_groups: ['rectus_abdominis', 'core'] },
  // Dia B — dobrar quadril + puxar vertical + empurrar vertical + avanço
  { day_number: 2, order_within_day: 1, role: 'composto_principal', target_muscle_groups: ['hamstrings', 'glutes', 'back'] },
  { day_number: 2, order_within_day: 2, role: 'composto_principal', target_muscle_groups: ['back', 'latissimus_dorsi', 'biceps_brachii'] },
  { day_number: 2, order_within_day: 3, role: 'composto_secundario', target_muscle_groups: ['deltoids', 'triceps_brachii'] },
  { day_number: 2, order_within_day: 4, role: 'composto_secundario', target_muscle_groups: ['quadriceps', 'glutes'] },
  { day_number: 2, order_within_day: 5, role: 'isolamento', target_muscle_groups: ['biceps_brachii'] },
  { day_number: 2, order_within_day: 6, role: 'core', target_muscle_groups: ['rectus_abdominis', 'core'] },
]

// Bloco push/pull/legs — usado 2x no split de 6 dias (dias 1-3 e 4-6), mesma
// convenção do split de 4 dias (upper/lower A-B-A-B repetido).
function pushPullLegsBlock(startDay: number): DesignedSlotSpec[] {
  const push: DesignedSlotSpec[] = [
    { day_number: startDay, order_within_day: 1, role: 'composto_principal', target_muscle_groups: ['pectoralis_major', 'triceps_brachii', 'deltoids'] },
    { day_number: startDay, order_within_day: 2, role: 'composto_principal', target_muscle_groups: ['deltoids', 'triceps_brachii'] },
    { day_number: startDay, order_within_day: 3, role: 'composto_secundario', target_muscle_groups: ['pectoralis_major', 'deltoids'] },
    { day_number: startDay, order_within_day: 4, role: 'isolamento', target_muscle_groups: ['triceps_brachii'] },
    { day_number: startDay, order_within_day: 5, role: 'isolamento', target_muscle_groups: ['deltoids'] },
  ]
  const pull: DesignedSlotSpec[] = [
    { day_number: startDay + 1, order_within_day: 1, role: 'composto_principal', target_muscle_groups: ['back', 'biceps_brachii', 'rhomboids'] },
    { day_number: startDay + 1, order_within_day: 2, role: 'composto_principal', target_muscle_groups: ['back', 'latissimus_dorsi', 'biceps_brachii'] },
    { day_number: startDay + 1, order_within_day: 3, role: 'composto_secundario', target_muscle_groups: ['back', 'trapezius'] },
    { day_number: startDay + 1, order_within_day: 4, role: 'isolamento', target_muscle_groups: ['biceps_brachii'] },
  ]
  const legs: DesignedSlotSpec[] = [
    { day_number: startDay + 2, order_within_day: 1, role: 'composto_principal', target_muscle_groups: ['quadriceps', 'glutes', 'hamstrings'] },
    { day_number: startDay + 2, order_within_day: 2, role: 'composto_principal', target_muscle_groups: ['quadriceps', 'glutes', 'hamstrings'] },
    { day_number: startDay + 2, order_within_day: 3, role: 'isolamento', target_muscle_groups: ['quadriceps'] },
    { day_number: startDay + 2, order_within_day: 4, role: 'isolamento', target_muscle_groups: ['hamstrings'] },
    { day_number: startDay + 2, order_within_day: 5, role: 'isolamento', target_muscle_groups: ['calves'] },
    { day_number: startDay + 2, order_within_day: 6, role: 'core', target_muscle_groups: ['rectus_abdominis', 'core'] },
  ]
  return [...push, ...pull, ...legs]
}

// ─── Split de 6 dias — push/pull/legs ×2 (DESENHO NOVO, pendente de validação) ─
const SPLIT_6_DAYS: DesignedSlotSpec[] = [...pushPullLegsBlock(1), ...pushPullLegsBlock(4)]

// ─── Dia 7 — leve/mobilidade OBRIGATÓRIO (DESENHO NOVO, sem dado observado) ──
// Decisão explícita da Taina: "7 dias" no onboarding NUNCA significa 7 dias de
// treino pesado sem descanso — o 7º dia é sempre mobilidade/recuperação
// ativa, full body, baixa intensidade. Papel leve_mobilidade não existe em
// nenhum molde real hoje — reps/rest daqui (DEFAULT_REPS_BY_ROLE,
// restSecondsForRole) são proposta, não curadoria, pendente de validação do
// personal trainer antes de qualquer split de 7 dias ir pro piloto.
const LIGHT_MOBILITY_DAY: DesignedSlotSpec[] = [
  { day_number: 7, order_within_day: 1, role: 'leve_mobilidade', target_muscle_groups: ['back', 'flexibility_mobility'] },
  { day_number: 7, order_within_day: 2, role: 'leve_mobilidade', target_muscle_groups: ['hip_flexors', 'glutes', 'flexibility_mobility'] },
  { day_number: 7, order_within_day: 3, role: 'leve_mobilidade', target_muscle_groups: ['hamstrings', 'calves', 'flexibility_mobility'] },
  { day_number: 7, order_within_day: 4, role: 'leve_mobilidade', target_muscle_groups: ['shoulders', 'flexibility_mobility'] },
  { day_number: 7, order_within_day: 5, role: 'leve_mobilidade', target_muscle_groups: ['core', 'flexibility_mobility'] },
]

// ─── Split de 7 dias — push/pull/legs ×2 (6 dias reais) + 1 dia leve ────────
const SPLIT_7_DAYS: DesignedSlotSpec[] = [...SPLIT_6_DAYS, ...LIGHT_MOBILITY_DAY]

// Busca as linhas reais de um molde (training_plan_exercises) já com nome do
// exercício (pra classificar o papel) e muscle_groups_ids (pro slot ter
// target_muscle_groups, igual antes) — separado do handler principal porque
// dia 5 precisa chamar isso e reaproveitar só os dias 1/2 (ver buildSplitSlots).
async function fetchMoldeSlotsWithMuscles(supabase: any, trainingPlanId: string): Promise<Array<{
  day_number: number
  order_within_day: number
  exercise_name_ptbr: string
  sets: number
  reps: number
  cadence_eccentric: number
  cadence_isometric_bottom: number
  cadence_concentric: number
  cadence_isometric_top: number
  target_muscle_groups: string[]
}>> {
  const { data: rows, error } = await supabase
    .from('training_plan_exercises')
    .select('day_number, order_within_day, sets, reps, exercise_id, cadence_eccentric, cadence_isometric_bottom, cadence_concentric, cadence_isometric_top')
    .eq('training_plan_id', trainingPlanId)
    .order('day_number', { ascending: true })
    .order('order_within_day', { ascending: true })
  if (error || !rows || rows.length === 0) throw new Error('Molde not found: ' + trainingPlanId)

  const exerciseIds = [...new Set(rows.map((r: any) => r.exercise_id))]
  const { data: exercisesData, error: exError } = await supabase
    .from('exercises')
    .select('exercise_id, name_ptbr, muscle_groups_ids')
    .in('exercise_id', exerciseIds)
  if (exError) throw new Error('Molde exercises lookup failed: ' + exError.message)

  const byId = new Map<string, { name_ptbr: string; muscle_groups_ids: string[] }>(
    (exercisesData ?? []).map((e: any) => [e.exercise_id, { name_ptbr: e.name_ptbr, muscle_groups_ids: e.muscle_groups_ids ?? [] }])
  )

  return rows.map((r: any) => {
    const ex = byId.get(r.exercise_id)
    return {
      day_number: r.day_number,
      order_within_day: r.order_within_day,
      exercise_name_ptbr: ex?.name_ptbr ?? '',
      sets: r.sets,
      reps: r.reps,
      cadence_eccentric: r.cadence_eccentric,
      cadence_isometric_bottom: r.cadence_isometric_bottom,
      cadence_concentric: r.cadence_concentric,
      cadence_isometric_top: r.cadence_isometric_top,
      target_muscle_groups: ex?.muscle_groups_ids ?? [],
    }
  })
}

// ─── Monta o esqueleto de slots pro (objetivo × dias) ───────────────────────
// Reps SEMPRE preservado por-goal do molde de origem quando existe (dias
// 3/4/5) — ex: hypertrophy 3 dias usa a reps curada de tr_203 pro mesmo slot,
// não a de tr_202, mesmo os dois compartilhando o mesmo esqueleto de
// dia/ordem/papel. Só sets e rest vêm da matriz de papéis, uniforme pros 4
// objetivos.
async function buildSplitSlots(
  supabase: any,
  goal: string,
  requestedDays: number,
): Promise<{ moldeDaysCount: number; slots: SplitSlotDraft[] }> {
  const days = nearestSupportedDays(requestedDays)
  const byGoal = MOLDE_TRAINING_PLAN_BY_GOAL_AND_DAYS[goal] ?? MOLDE_TRAINING_PLAN_BY_GOAL_AND_DAYS.health_routine

  if (days === 3 || days === 4) {
    const raw = await fetchMoldeSlotsWithMuscles(supabase, byGoal[days as 3 | 4])
    const slots: SplitSlotDraft[] = raw.map(r => ({
      day_number: r.day_number,
      order_within_day: r.order_within_day,
      role: roleForMoldeSlot(r.exercise_name_ptbr, r.sets),
      reps: r.reps,
      target_muscle_groups: r.target_muscle_groups,
      cadence_eccentric: r.cadence_eccentric,
      cadence_isometric_bottom: r.cadence_isometric_bottom,
      cadence_concentric: r.cadence_concentric,
      cadence_isometric_top: r.cadence_isometric_top,
    }))
    return { moldeDaysCount: days, slots }
  }

  if (days === 5) {
    // REFORMULAÇÃO: U-L-U-L-U repetindo os dias 1(U)/2(L) do molde de 4 dias
    // — ver comentário do bloco SPLITS acima pro porquê do dia 3 antigo
    // (tr_206/tr_207) ter sido descartado.
    const raw = await fetchMoldeSlotsWithMuscles(supabase, byGoal[4])
    const upperDay = raw.filter(r => r.day_number === 1)
    const lowerDay = raw.filter(r => r.day_number === 2)
    const sourceForDay = [upperDay, lowerDay, upperDay, lowerDay, upperDay]
    const slots: SplitSlotDraft[] = []
    sourceForDay.forEach((daySource, idx) => {
      const dayNumber = idx + 1
      for (const r of daySource) {
        slots.push({
          day_number: dayNumber,
          order_within_day: r.order_within_day,
          role: roleForMoldeSlot(r.exercise_name_ptbr, r.sets),
          reps: r.reps,
          target_muscle_groups: r.target_muscle_groups,
          cadence_eccentric: r.cadence_eccentric,
          cadence_isometric_bottom: r.cadence_isometric_bottom,
          cadence_concentric: r.cadence_concentric,
          cadence_isometric_top: r.cadence_isometric_top,
        })
      }
    })
    return { moldeDaysCount: 5, slots }
  }

  // 2, 6, 7 dias — desenho novo, sem exercício-fonte real (ver SPLIT_2_DAYS /
  // SPLIT_6_DAYS / SPLIT_7_DAYS). Reps vem do default por papel; cadência usa
  // o default fixo — não há linha de molde pra herdar nenhum dos dois.
  const designed = days === 2 ? SPLIT_2_DAYS : days === 6 ? SPLIT_6_DAYS : SPLIT_7_DAYS
  const slots: SplitSlotDraft[] = designed.map(spec => ({
    day_number: spec.day_number,
    order_within_day: spec.order_within_day,
    role: spec.role,
    reps: DEFAULT_REPS_BY_ROLE[spec.role],
    target_muscle_groups: spec.target_muscle_groups,
    ...DEFAULT_CADENCE,
  }))
  return { moldeDaysCount: days, slots }
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

// ─── REGRA 2 (parte 2 — reforço): +1 set nos slots focados sobreviventes.
// DECISÃO desta reformulação (não coberta explicitamente por nenhuma
// instrução da Taina — sinalizar se for indesejado): agora que a matriz de
// papéis é a curadoria ÚNICA de sets pra TODOS os objetivos (não só
// weight_loss/hypertrophy como antes), a proteção contra patch se estende
// pros splits com fonte real de molde (3/4/5 dias) igual pra qualquer
// objetivo — foco já atuou como proteção no corte acima (REGRA 2 parte 1) e
// não soma set em cima disso. Isso MUDA o comportamento antigo de
// conditioning/health_routine nos dias 3/4/5 (eles tinham bônus antes, pela
// matriz genérica achatada). Splits desenhados do zero (2/6/7 dias) não têm
// essa curadoria pra proteger, então o reforço continua valendo neles.
function applyFocusBonus<T extends { sets: number; target_muscle_groups: string[] }>(
  slots: T[],
  moldeDaysCount: number,
  focusMuscleGroups: string[],
): T[] {
  if (REAL_MOLDE_DAYS.has(moldeDaysCount) || focusMuscleGroups.length === 0) return slots
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

// ─── sets_detail (2026-08-08) — expande o resumo (sets/reps/rest_seconds) em
// N séries individuais, todas com o mesmo reps/rest — a matriz de papéis não
// tem curadoria de progressão por série (tipo pirâmide) hoje, então isso é
// fiel ao que a matriz já decide, só materializado. load_kg fica null: o
// gerador não prescreve carga (decisão registrada — ver memória do projeto).
function buildSetsDetail(sets: number, reps: number, restSeconds: number) {
  return Array.from({ length: sets }, (_, i) => ({
    set_number: i + 1,
    reps,
    load_kg: null,
    rest_seconds: restSeconds,
    set_type: 'normal' as const,
  }))
}

// ─── Groq (openai/gpt-oss-20b) ────────────────────────────────────────────────
// Migrado de Gemini 2026-08-27 -- cota gratuita do Gemini (20 req/dia) não
// sustenta nem um dia de uso normal, esgotou sozinha nos testes desta mesma
// sessão. Groq free tier: 1.000 req/dia, 30 RPM, ~6-8K TPM (confirmado testando
// o prompt real, sem alterar nada, contra os 3 modelos disponíveis na conta —
// nenhum Llama no catálogo atual, só gpt-oss/qwen). openai/gpt-oss-20b
// escolhido: JSON válido de primeira, respostas <1s, e devolve um campo
// `reasoning` (cadeia de raciocínio em inglês, cru) que os outros formatos não
// davam — guardado como log de auditoria (ver GroqResult.reasoning), não
// mostrado ao profissional ainda.
// GROQ_TIMEOUT_MS: mantido o mesmo guard de timeout que blindava contra o
// limite duro de 150s do Edge Functions do Supabase (achado 2026-08-27) --
// o Groq responde em <1s na prática, mas o guard continua sendo a rede de
// segurança se a API ficar lenta um dia.
const GROQ_TIMEOUT_MS = 20_000
const GROQ_MODEL = 'openai/gpt-oss-20b'

type GroqResult = { data: any; reasoning: string | null }

async function callGroq(prompt: string, apiKey: string, retries = 3): Promise<GroqResult> {
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS)

    let data: any
    let retryAfterSeconds: number | null = null
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal:  controller.signal,
        body: JSON.stringify({
          model:               GROQ_MODEL,
          messages:            [{ role: 'user', content: prompt }],
          temperature:         0.2,
          response_format:     { type: 'json_object' },
          // reasoning_effort 'low': achado ao vivo 2026-08-27 — o default
          // ('medium') gera uma cadeia de raciocínio longa o bastante pra
          // estourar o budget de output ANTES do JSON, devolvendo
          // json_validate_failed com failed_generation vazio (o modelo foi
          // cortado no meio do raciocínio, nunca chegou a escrever a
          // resposta). 'low' + max_completion_tokens generoso resolve.
          // max_completion_tokens 500 (2026-08-31, era 1200): o Groq conta
          // prompt_tokens + max_completion_tokens contra o teto de TPM NO
          // ENVIO, não o uso real depois -- medido ao vivo, completion real
          // nunca passou de 322 tokens em nenhuma chamada (treino ou
          // nutrição). Reservar 1200 pagava ~4x o necessário em toda
          // chamada, essa é a causa raiz do "Used" alto nos 429 observados.
          // 500 dá ~55% de margem sobre o máximo já visto. Não é o prompt —
          // não muda nada do que a IA lê nem pode escolher.
          reasoning_effort:    'low',
          max_completion_tokens: 500,
        }),
      })
      const retryAfterRaw = res.headers.get('retry-after')
      retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : null
      data = await res.json()
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        if (attempt === retries) throw new Error(`Groq timeout after ${GROQ_TIMEOUT_MS}ms (attempt ${attempt})`)
        continue // tenta de novo, sem esperar backoff — timeout já não é sobrecarga (503/429)
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }

    if (data?.error?.type === 'rate_limit_exceeded' || data?.error?.code === 'rate_limit_exceeded') {
      if (attempt === retries) throw new Error('Groq overloaded: ' + JSON.stringify(data.error))
      // retry-after real do Groq (2026-08-31, era attempt*3000 fixo) --
      // medido ao vivo variando 2-16s; o fixo (3s/6s) errava pra baixo na
      // maioria das colisões observadas, gastando a tentativa sem esperar
      // tempo suficiente pra realmente ter espaço no teto.
      const waitMs = retryAfterSeconds && !Number.isNaN(retryAfterSeconds) ? Math.ceil(retryAfterSeconds * 1000) : attempt * 3000
      await new Promise(r => setTimeout(r, waitMs))
      continue
    }
    if (data.error) throw new Error('Groq error: ' + JSON.stringify(data.error))

    const message = data.choices?.[0]?.message
    const content = message?.content ?? ''
    return {
      data: JSON.parse(content.replace(/```json/gi, '').replace(/```/g, '').trim()),
      reasoning: message?.reasoning ?? null,
    }
  }
  throw new Error('Groq: unreachable')
}

// ─── Ranking de candidatos por slot (base do determinístico E do que a IA vê) ─
// Mesmo critério que a Etapa 1 sempre usou: mais overlap com o grupo-alvo do
// slot vence, empate quebra por exercise_id. Cortado em CANDIDATE_LIMIT — essa
// é a MESMA lista oferecida à IA e usada pra validar a resposta dela (nenhuma
// lista "escondida" maior por trás). Posição 0 é sempre o pick determinístico.
const CANDIDATE_LIMIT = 8

// ─── plan_generation_status — autoritativo, escrito pelo próprio gerador no
// fim da sua execução real (não mais inferido pelo client de ter recebido ou
// não uma resposta antes do timeout do fetch — ver memória
// project_plan_generation_status_false_positive). Best-effort: um erro aqui
// nunca deve mascarar o resultado real da geração pro caller.
async function markPlanGenerationStatus(supabase: any, userId: string, status: 'ok' | 'failed', errorMessage: string | null = null) {
  const { error } = await supabase.from('profiles')
    .update({ plan_generation_status: status, plan_generation_error: errorMessage })
    .eq('id', userId)
  if (error) console.error('[ybytu-generate-training-plan] failed to write plan_generation_status:', error)
}

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
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  // Fora do try: precisa estar acessível no catch pra marcar plan_generation_status
  // mesmo quando o erro acontece depois da autenticação (ver markPlanGenerationStatus).
  let authedUserId: string | null = null

  try {
    // Auth: userId from JWT, never from body — EXCETO a chamada interna
    // abaixo (retry disparado pelo admin via ybytu-admin-retry-plan-generation),
    // gated pelo INTERNAL_FUNCTION_SECRET, nunca exposta ao browser do aluno.
    // Mesmo padrão de isInternalServiceCall já usado no cron de lembrete —
    // blast radius menor que aceitar o service_role key direto.
    let userId: string
    if (isInternalServiceCall(req)) {
      const body = await req.json().catch(() => null)
      if (typeof body?.user_id !== 'string' || !body.user_id) return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id for internal call' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      userId = body.user_id
    } else {
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
      userId = user.id
    }
    authedUserId = userId

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

    // Marca 'failed' otimisticamente ANTES do trabalho pesado (pool + Gemini)
    // começar — não depois de um erro. Achado testando ao vivo 2026-08-27:
    // quando o runtime mata a function por limite de recursos
    // (WORKER_RESOURCE_LIMIT, visto numa chamada real >120s no gerador de
    // nutrição), o `catch` deste arquivo NUNCA roda — o isolate morre por
    // fora do try/catch do JS. Sem esta marca prévia, o status ficava com o
    // valor anterior (ex: 'ok' de um treino que tinha acabado de suceder),
    // escondendo silenciosamente que a geração seguinte não completou. 'ok'
    // só é escrito de novo lá embaixo, na conclusão CONFIRMADA — se a
    // function morrer no meio, isto já fica 'failed' por padrão, que é o
    // resultado correto.
    await markPlanGenerationStatus(supabase, userId, 'failed', 'Geração iniciada — se este texto persistir, a function foi interrompida pelo runtime antes de concluir (timeout ou limite de recursos), não por uma exceção capturável.')

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

    const poolAfterAvoid = (candidatePool ?? []).filter((e: any) => !avoidExerciseIds.has(e.exercise_id))

    // Colapsa exercícios de mesmo nome (o catálogo tem 19 pares duplicados) em 1
    // registro -- ver exerciseNames.ts. Depois do filtro de segurança de
    // propósito: só colapsa entre exercícios já seguros. Entre duplicatas, fica
    // a que tem MAIS cautelas pras condições deste aluno (em 8 dos 19 pares as
    // cautelas divergem, e manter só o menor id escondia um aviso do catálogo);
    // sem condição declarada ou sem divergência, empata e vale o menor id.
    const cautionCountById = new Map<string, number>()
    const duplicateNameIds = findDuplicateNameIds(poolAfterAvoid as any[])
    if (userConditionSlugs.length > 0 && duplicateNameIds.length > 0) {
      const { data: dupCautionRows, error: dupCautionError } = await supabase
        .from('exercise_effective_cautions')
        .select('exercise_id, condition_slug')
        .eq('tipo', 'caution')
        .in('condition_slug', userConditionSlugs)
        .in('exercise_id', duplicateNameIds)
      if (dupCautionError) throw new Error('Duplicate-name caution lookup failed: ' + dupCautionError.message)
      const slugsById = new Map<string, Set<string>>()
      for (const row of (dupCautionRows ?? [])) {
        slugsById.set(row.exercise_id, (slugsById.get(row.exercise_id) ?? new Set()).add(row.condition_slug))
      }
      for (const [id, slugs] of slugsById) cautionCountById.set(id, slugs.size)
    }
    const { pool: safePool, collapsed: collapsedNameGroups } = collapseDuplicateNames(poolAfterAvoid as any[], cautionCountById)
    if (collapsedNameGroups.length > 0) {
      console.log('[ybytu-generate-training-plan] pool: nomes duplicados colapsados', JSON.stringify(collapsedNameGroups))
    }

    if (safePool.length === 0) {
      const failMessage = `no_safe_exercises: pool vazio pra level=${levelSlug} environment=${environmentSlug} condition_slugs=${userConditionSlugs.join(',') || '-'}`
      await markPlanGenerationStatus(supabase, userId, 'failed', failMessage)
      return new Response(JSON.stringify({
        success: false,
        status: 'no_safe_exercises',
        message: 'No safe exercises found for this profile (environment/level/equipment/conditions too restrictive).',
        profile_context: { level: levelSlug, environment: environmentSlug, condition_slugs: userConditionSlugs },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── SPLIT: esqueleto de dias × papéis de slot (REGRA 0) ──────────────────
    const { moldeDaysCount, slots: splitSlotsDraft } = await buildSplitSlots(supabase, primaryGoal, requestedDays)

    const slots = splitSlotsDraft.map(s => ({
      day_number: s.day_number,
      order_within_day: s.order_within_day,
      sets: SETS_BY_ROLE[s.role],
      reps: s.reps,
      rest_seconds: restSecondsForRole(s.role, primaryGoal),
      cadence_eccentric: s.cadence_eccentric,
      cadence_isometric_bottom: s.cadence_isometric_bottom,
      cadence_concentric: s.cadence_concentric,
      cadence_isometric_top: s.cadence_isometric_top,
      target_muscle_groups: s.target_muscle_groups,
    }))

    // ── REGRA 1: corta slots por duração ANTES de escolher exercício — não faz
    // sentido montar candidatos pra um slot que vai ser cortado. REGRA 2 entra
    // aqui como proteção (imunidade relativa no corte) e depois como reforço
    // (+1 set nos focados sobreviventes, só nos splits sem curadoria real —
    // ver comentário de applyFocusBonus).
    const targetSlots = targetSlotsPerDay(trainingDuration)
    const { survivors: slotsAfterDurationCut, anyDayTrimmed } = cutSlotsForDuration(slots, targetSlots, focusMuscleGroupSlugs)
    const focusedSlots = applyFocusBonus(slotsAfterDurationCut, moldeDaysCount, focusMuscleGroupSlugs)

    // ── CANDIDATOS POR SLOT (base do determinístico E do que a IA vê) ────────
    // Cada slot ganha sua lista de candidatos já ranqueada e cortada — a mesma
    // lista serve pra montar o prompt da IA e pra validar a resposta dela.
    const slotsWithCandidates = focusedSlots.map(slot => ({
      ...slot,
      candidates: rankedCandidates(slot.target_muscle_groups, safePool),
    }))

    // Determinístico (Etapa 1): posição 0 do ranking, ou PULA o slot se nenhum
    // candidato cobre o grupo-alvo.
    //
    // ATÉ 2026-09-04 isto caía num fallback alfabético (qualquer exercício do
    // safePool, sem relação com o grupo-alvo, ex_id menor primeiro) marcado
    // `degraded: true` — mas esse flag nunca era persistido, só devolvido na
    // resposta HTTP síncrona (que ninguém lê, fluxo é fire-and-forget), então
    // se perdia. Resultado real observado: um slot de antebraço podia receber
    // um agachamento, indistinguível de escolha certa pra quem valida ou pro
    // aluno. Corrigido: pular é melhor que preencher errado — ver
    // docs/ACHADO_DEGRADACAO_SILENCIOSA_20260904.md. Um "estágio 1" de
    // fallback por categoria ampla de músculo foi avaliado e descartado: não
    // existe hierarquia de músculo no schema, e o único mapa pronto
    // (MUSCLE_CATEGORY_MAP, ver docs/ARMADILHAS_SCHEMA.md) é largo demais —
    // trocaria antebraço por peitoral só por estarem no mesmo balde
    // "superior".
    //
    // REGRA DE DESIGN (registrada na revisão de arquitetura): reuso do mesmo
    // exercício entre dias é OK e ESPERADO quando o pool de um grupo muscular
    // é raso (ex: costas em beginner+casa) — o próprio tr_204 já repete
    // dia1==dia3 e dia2==dia4. Um bom exercício repetido é melhor que um ruim
    // forçado por "variedade".
    function deterministicPick(candidates: any[]): { exercise_id: string; skipped: false } | { exercise_id: null; skipped: true } {
      if (candidates.length > 0) return { exercise_id: candidates[0].exercise_id, skipped: false }
      return { exercise_id: null, skipped: true }
    }

    // ── ETAPA 2: IA compõe (opcional) ────────────────────────────────────────
    // 1 chamada POR DIA, sequencial (não Promise.all) -- achado 2026-08-30
    // testando ao vivo: 1 chamada só pro plano inteiro (24-30 slots) já
    // sozinha usa ~5.300-6.000 dos 8.000 TPM do free tier do Groq. Qualquer
    // uso concorrente na mesma janela de 1min (inclusive a chamada da
    // nutrição, que roda em paralelo no mesmo onboarding) estourava o limite
    // e o plano inteiro caía 100% pro determinístico -- 0/24 observado em
    // produção. Cada chamada por dia (6-7 slots) fica bem abaixo do teto
    // mesmo com concorrência, e sequencial (não paralela) evita a colisão
    // entre as próprias chamadas do mesmo plano. Efeito colateral aceito:
    // a IA perde a visão do plano inteiro (só decide variedade DENTRO do
    // dia, não entre dias) -- ok pela REGRA DE DESIGN já registrada acima
    // (reuso do mesmo exercício ENTRE DIAS é esperado, só dentro do mesmo
    // dia é problema de qualidade).
    // Falha de UM dia (timeout/rate limit) só derruba aquele dia pro
    // determinístico -- os outros dias que já tiveram sucesso continuam IA
    // (a re-validação abaixo já opera por slot, então isso é automático:
    // slots sem key em aiSelections caem no determinístico individualmente).
    const groqKey = Deno.env.get('GROQ_API_KEY')

    const AI_PROMPT_CANDIDATE_LIMIT = 5
    const slotsByDayNumber = new Map<number, typeof slotsWithCandidates>()
    for (const s of slotsWithCandidates) {
      const list = slotsByDayNumber.get(s.day_number) ?? []
      list.push(s)
      slotsByDayNumber.set(s.day_number, list)
    }

    let aiSelections: Record<string, string> = {}
    const aiReasoningByDay: string[] = []
    if (groqKey) {
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

      for (const [dayNumber, daySlots] of [...slotsByDayNumber.entries()].sort((a, b) => a[0] - b[0])) {
        const slotsForPrompt = daySlots.map(s => ({
          slot_key: `${s.day_number}_${s.order_within_day}`,
          target_muscle_groups: s.target_muscle_groups,
          candidates: s.candidates.slice(0, AI_PROMPT_CANDIDATE_LIMIT).map((c: any) => ({
            exercise_id: c.exercise_id,
            name: c.name_ptbr,
          })),
        }))

        const aiPrompt = `You are an expert personal trainer composing day ${dayNumber} of a ${moldeDaysCount}-day training plan personalized to this user.

USER PROFILE:
${profileLines}
(safety is already enforced upstream — every candidate below is pre-validated safe for this user; you never need to filter for conditions)

DAY STRUCTURE (fixed — sets/reps/slot layout already defined, you only choose which exercise fills each slot):
${JSON.stringify(slotsForPrompt, null, 2)}

Rules:
1. For each slot, pick exactly one exercise_id from THAT SLOT'S OWN "candidates" list only. Never invent ids, never use a candidate offered to a different slot.
2. Personalize using ALL profile signals together — level and goals are the primary drivers; age and activity level (when provided) are secondary PREFERENCE signals for choosing AMONG the candidates already offered for each slot. They are never a reason to exclude a candidate or invent one outside the list — every candidate in a slot's list is already safe and level-appropriate. Older and/or sedentary/lightly_active users: prefer the more accessible, lower-complexity candidate in the slot's list. Younger and/or active/very_active users: you may prefer the more challenging candidate that maximizes stimulus for the target muscles. If age/activity level are absent, personalize using level and goals alone.
3. Avoid repeating the same exercise across different slots WITHIN THIS DAY when a slot's candidate list offers a good alternative. Repetition is fine and expected when a slot's candidate list is shallow (few or one viable option) — do not sacrifice match quality just to avoid repetition.
4. You must return one selection per slot listed above.

Return ONLY valid JSON: { "selections": { "<slot_key>": "exercise_id", ... } }`

        try {
          const aiResult = await callGroq(aiPrompt, groqKey)
          const daySelections = (aiResult.data?.selections ?? {}) as Record<string, string>
          aiSelections = { ...aiSelections, ...daySelections }
          if (aiResult.reasoning) aiReasoningByDay.push(`Dia ${dayNumber}: ${aiResult.reasoning}`)
        } catch (err: any) {
          console.error(`[ybytu-generate-training-plan] Groq call failed for day ${dayNumber}, falling back to deterministicPick for this day only:`, err)
        }
      }
    }
    const aiReasoning: string | null = aiReasoningByDay.length > 0 ? aiReasoningByDay.join('\n\n') : null

    // ── RE-VALIDAÇÃO (a cerca): confina a IA aos candidatos do slot certo ────
    // Aceita o pick da IA só se ele está na lista de candidatos DAQUELE slot
    // específico. Qualquer alucinação, invenção, ou pick de outro slot cai no
    // determinístico — o mesmo que a Etapa 1 já escolheria sozinha.
    const filledSlots = slotsWithCandidates.map(slot => {
      const key        = `${slot.day_number}_${slot.order_within_day}`
      const aiPick     = aiSelections[key]
      const validPick  = aiPick ? slot.candidates.find((c: any) => c.exercise_id === aiPick) : null

      if (validPick) {
        return { ...slot, chosen_exercise_id: validPick.exercise_id, skipped: false, filled_by: 'ai' as const }
      }

      const det = deterministicPick(slot.candidates)
      return { ...slot, chosen_exercise_id: det.exercise_id, skipped: det.skipped, filled_by: det.skipped ? 'skipped' as const : 'deterministic' as const }
    })

    // Piso movido pra cá (era declarado só depois da dedupe) -- a dedupe
    // 2026-09-07 precisa dele pra decidir "pular vale a pena" ANTES de saber
    // se algum dia ficou abaixo do mínimo; o corte de starvedDay mais abaixo
    // reusa esta mesma constante, não duplica o número.
    const MIN_SLOTS_PER_DAY = 3

    // ── DEDUPE (dentro do dia): dois slots do mesmo dia nunca podem acabar
    // com o mesmo exercício, mesmo quando o exercise_id é diferente -- achado
    // 2026-09-04 (Marina Santos: ex_194 e ex_216, ambos "Flexão de braço com
    // pegada fechada", exercise_id diferente porque o catálogo tem 19 pares
    // de nome duplicado, não corrigidos ainda). Roda DEPOIS que IA e
    // determinístico já convergiram em chosen_exercise_id (acima), então uma
    // checagem só protege os dois caminhos -- inclusive dias 100%
    // determinísticos (sem GROQ_API_KEY, ou falha da chamada daquele dia),
    // que não tinham proteção nenhuma antes disso. Comparação por NOME
    // normalizado (minúsculas, sem acento), não por exercise_id -- os pares
    // duplicados variam capitalização/acentuação entre si.
    // 2026-09-19: desde que o pool é colapsado por nome (collapseDuplicateNames,
    // acima), esta dedupe deixou de ser a defesa principal contra pares
    // duplicados do catálogo -- fica como rede de segurança (nomes que só
    // divergem em algo que a normalização não cobre). normalizeExerciseName
    // agora vem de ./exerciseNames.ts, a mesma função do colapso.

    const slotsByDayForDedupe = new Map<number, typeof filledSlots>()
    for (const s of filledSlots) {
      const list = slotsByDayForDedupe.get(s.day_number) ?? []
      list.push(s)
      slotsByDayForDedupe.set(s.day_number, list)
    }

    // ACHADO 2026-09-07 (teste ao vivo da degradação silenciosa, ex_152
    // "Prancha com toque de ombro" 3x no mesmo dia): a dedupe por nome já
    // detectava esse caso -- mesmo exercise_id normaliza pro mesmo nome, cai
    // na mesma branch de "duplicata por nome" na 2ª ocorrência. O que faltava
    // era distinguir o resultado: repetir o MESMO exercise_id (zero variação
    // de movimento) é pior do que repetir por NOME com exercise_id diferente
    // (pelo menos são cadastros distintos, mesmo que o catálogo tenha 19
    // pares de nome duplicado por corrigir). Antes, os dois casos caíam no
    // mesmo fallback silencioso. Agora: mesmo exercise_id sem alternativa
    // tenta pular o slot -- mas só se sobrar pelo menos MIN_SLOTS_PER_DAY
    // depois de pular (checado slot a slot, não de uma vez só, pra não
    // derrubar um dia que teria só 1 repetição de sobra pra cortar). Se
    // pular fizer o dia furar o piso, mantém o repetido só nesse caso e
    // registra um aviso em skipped_slots -- reaproveita a mesma coluna e o
    // mesmo badge âmbar de UserPlan.jsx, sem migração nova. Nome diferente
    // com exercise_id diferente continua exatamente como antes (mantém
    // silenciosamente): esse é o caso que a dedupe foi desenhada pra tolerar,
    // não o que motivou esta mudança.
    const dedupedFilledSlots: any[] = filledSlots.map(s => ({ ...s }))
    const repeatedKeptEntries: Array<{ day_number: number; target_muscle_groups: string[] }> = []

    for (const daySlots of slotsByDayForDedupe.values()) {
      const usedNames = new Set<string>()
      const usedExerciseIds = new Set<string>()
      const sortedDaySlots = [...daySlots].sort((a, b) => a.order_within_day - b.order_within_day)
      let keptCountForDay = daySlots.filter(s => !s.skipped).length

      for (const slot of sortedDaySlots) {
        if (slot.skipped || !slot.chosen_exercise_id) continue

        const chosenCandidate = slot.candidates.find((c: any) => c.exercise_id === slot.chosen_exercise_id)
        const chosenName = chosenCandidate ? normalizeExerciseName(chosenCandidate.name_ptbr) : null
        if (!chosenName) continue

        if (!usedNames.has(chosenName)) {
          usedNames.add(chosenName)
          usedExerciseIds.add(slot.chosen_exercise_id)
          continue
        }

        // duplicata por nome -- procura no PRÓPRIO candidate pool do slot
        // (mesma ordem de ranking que deterministicPick já assume: overlap
        // de músculo desc, depois exercise_id) o próximo que não repita
        // nenhum nome já usado no dia.
        const alternative = slot.candidates.find((c: any) =>
          c.exercise_id !== slot.chosen_exercise_id && !usedNames.has(normalizeExerciseName(c.name_ptbr))
        )

        if (alternative) {
          const target = dedupedFilledSlots.find(d => d.day_number === slot.day_number && d.order_within_day === slot.order_within_day)
          if (target) target.chosen_exercise_id = alternative.exercise_id
          usedNames.add(normalizeExerciseName(alternative.name_ptbr))
          usedExerciseIds.add(alternative.exercise_id)
          continue
        }

        const sameExerciseIdAsEarlierSlot = usedExerciseIds.has(slot.chosen_exercise_id)
        if (sameExerciseIdAsEarlierSlot && keptCountForDay - 1 >= MIN_SLOTS_PER_DAY) {
          // mesmo exercise_id, sem alternativa, e o dia aguenta perder este
          // slot sem furar o piso -- pula em vez de repetir.
          const target = dedupedFilledSlots.find(d => d.day_number === slot.day_number && d.order_within_day === slot.order_within_day)
          if (target) { target.skipped = true; target.skip_reason = 'duplicate_exercise_no_alternative' }
          keptCountForDay -= 1
        } else if (sameExerciseIdAsEarlierSlot) {
          // pularia furar o piso -- mantém o repetido, mas com aviso visível
          // (diferente do fallback silencioso de antes).
          repeatedKeptEntries.push({ day_number: slot.day_number, target_muscle_groups: slot.target_muscle_groups })
          usedNames.add(chosenName)
        } else {
          // pool raso, sem alternativa, mas é nome duplicado com exercise_id
          // DIFERENTE (o caso original que a dedupe foi criada pra tolerar) --
          // mantém o repetido de propósito, sem aviso (regra já registrada
          // acima: repetir um bom exercício é melhor que forçar um ruim só
          // por variedade).
          usedNames.add(chosenName)
        }
      }
    }

    const filledSlotsKept = dedupedFilledSlots.filter(s => !s.skipped)
    const skippedSlots    = dedupedFilledSlots.filter(s => s.skipped)

    // ── PISO: dia com menos de 3 exercícios reais não é mais um treino ───────
    // Mesmo piso que targetSlotsPerDay() já usa pra cortar por duração
    // (Math.max(3, ...)) — nenhum dia de nenhum plano, molde ou gerado, já
    // teve menos de 3 (conferido 2026-09-04). Abaixo disso, trata como
    // no_safe_exercises: recusa a geração inteira em vez de entregar um dia
    // que não é mais um treino de verdade — cai na mesma fila de
    // ybytu-admin-failed-plans / retry que a recusa por pool vazio já usa,
    // não inventa um terceiro estado ("plano parcialmente ruim"). Constante
    // declarada mais acima (antes da dedupe), reusada aqui.
    const realCountByDay = new Map<number, number>()
    for (const s of filledSlotsKept) realCountByDay.set(s.day_number, (realCountByDay.get(s.day_number) ?? 0) + 1)
    const starvedDay = [...new Set(filledSlots.map(s => s.day_number))]
      .find(d => (realCountByDay.get(d) ?? 0) < MIN_SLOTS_PER_DAY)

    if (starvedDay !== undefined) {
      const failMessage = `day_below_minimum_after_skip: dia ${starvedDay} ficaria com ${realCountByDay.get(starvedDay) ?? 0} exercício(s) (mínimo ${MIN_SLOTS_PER_DAY}) depois de pular slot(s) sem candidato seguro — level=${levelSlug} environment=${environmentSlug} condition_slugs=${userConditionSlugs.join(',') || '-'}`
      await markPlanGenerationStatus(supabase, userId, 'failed', failMessage)
      return new Response(JSON.stringify({
        success: false,
        status: 'day_below_minimum_after_skip',
        message: 'Not enough safe exercises to fill at least one day of the plan (environment/level/equipment/conditions too restrictive).',
        profile_context: { level: levelSlug, environment: environmentSlug, condition_slugs: userConditionSlugs, day: starvedDay },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Nomes de grupo muscular pros avisos de slot pulado/repetido (só busca
    // se tiver algo pra avisar — caminho comum não paga essa query).
    const skippedMuscleGroupNameBySlug = new Map<string, string>()
    if (skippedSlots.length > 0 || repeatedKeptEntries.length > 0) {
      const slugsNeeded = [...new Set([
        ...skippedSlots.flatMap(s => s.target_muscle_groups ?? []),
        ...repeatedKeptEntries.flatMap(e => e.target_muscle_groups ?? []),
      ])]
      const { data: mgRows } = await supabase.from('muscle_groups').select('muscle_group_id, name_ptbr').in('muscle_group_id', slugsNeeded)
      for (const row of (mgRows ?? [])) skippedMuscleGroupNameBySlug.set(row.muscle_group_id, row.name_ptbr)
    }

    // skipped_slots: um registro por slot pulado OU repetido-sem-alternativa,
    // com as DUAS mensagens já prontas (staff e aluno) -- evita reconstruir
    // texto em buildPlanPayload.ts toda vez que o plano é lido, e evita
    // divergência de redação entre as duas telas. Mesma coluna/schema pros
    // dois casos (skip_reason distingue o motivo); repeatedKeptEntries nunca
    // marca skipped=true no slot -- o exercício continua no plano, só ganha
    // o aviso.
    const skippedSlotsPayload = [
      ...skippedSlots.map(s => {
        const namesPtbr = (s.target_muscle_groups ?? []).map((g: string) => skippedMuscleGroupNameBySlug.get(g) ?? g)
        const namesJoined = namesPtbr.length > 0 ? namesPtbr.join(', ') : 'um grupo muscular'
        if (s.skip_reason === 'duplicate_exercise_no_alternative') {
          return {
            day_number: s.day_number,
            target_muscle_groups: s.target_muscle_groups ?? [],
            condition_slugs: userConditionSlugs,
            mensagem_staff: `Um slot de ${namesJoined} foi removido neste dia porque o único exercício seguro disponível pra esse grupo (nível/ambiente/condições atuais) já preenchia outro slot -- repetir o mesmo exercício de novo não agregaria treino real. Você pode adicionar um exercício manualmente no construtor se julgar seguro.`,
            mensagem_aluno: `Este dia tem menos exercícios do que o normal porque a opção segura disponível pra um dos grupos musculares já tinha sido usada em outro exercício do dia.`,
          }
        }
        return {
          day_number: s.day_number,
          target_muscle_groups: s.target_muscle_groups ?? [],
          condition_slugs: userConditionSlugs,
          mensagem_staff: `Nenhum exercício seguro de ${namesJoined} disponível dadas as condições físicas declaradas. Você pode adicionar um exercício manualmente no construtor se julgar seguro — a decisão é clínica.`,
          mensagem_aluno: `Este dia tem menos exercícios do que o normal porque as limitações físicas que você declarou restringiram as opções seguras de ${namesJoined}.`,
        }
      }),
      ...repeatedKeptEntries.map(e => {
        const namesPtbr = (e.target_muscle_groups ?? []).map((g: string) => skippedMuscleGroupNameBySlug.get(g) ?? g)
        const namesJoined = namesPtbr.length > 0 ? namesPtbr.join(', ') : 'um grupo muscular'
        return {
          day_number: e.day_number,
          target_muscle_groups: e.target_muscle_groups ?? [],
          condition_slugs: userConditionSlugs,
          mensagem_staff: `Este dia repete o mesmo exercício de ${namesJoined} porque o catálogo não tem alternativa distinta pra esse grupo muscular nesse nível/ambiente, e remover o slot deixaria o dia abaixo do mínimo de exercícios. Considere adicionar uma variação manualmente se houver uma segura.`,
          mensagem_aluno: `Você vai notar o mesmo exercício mais de uma vez neste dia -- isso acontece porque as opções seguras disponíveis pra esse grupo muscular são limitadas no momento, não é engano.`,
        }
      }),
    ]

    const chosenExerciseIds = [...new Set(filledSlotsKept.map(s => s.chosen_exercise_id))]

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

    // Observabilidade (2026-08-27) -- antes só ia na resposta HTTP, nunca
    // persistia. Sem isso, degradação de qualidade (cota estourada, IA fora
    // do ar) ficava invisível: só se descobria investigando manualmente
    // (foi exatamente o que aconteceu com o Gemini nesta mesma sessão).
    const aiFilledCount            = filledSlots.filter(s => s.filled_by === 'ai').length
    const deterministicFilledCount = filledSlots.filter(s => s.filled_by === 'deterministic').length

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
        skipped_slots: skippedSlotsPayload,
        ai_filled_slots:              aiFilledCount,
        deterministic_fallback_slots: deterministicFilledCount,
        ai_reasoning:                 aiReasoning,
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
    const tpeRows = filledSlotsKept.map(s => ({
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
      sets_detail: buildSetsDetail(s.sets, s.reps, s.rest_seconds),
    }))

    const { error: tpeErr } = await supabase.from('training_plan_exercises').insert(tpeRows)
    if (tpeErr) throw new Error('Failed to insert training_plan_exercises: ' + tpeErr.message)

    const [insertRes, updateRes] = await Promise.all([
      supabase.from('user_training_plans').insert({ user_id: userId, training_plan_id: newPlan.id }),
      supabase.from('profiles').update({ current_training_plan_id: newPlan.id }).eq('id', userId),
    ])
    if (insertRes.error) throw new Error('Failed to save plan link: ' + insertRes.error.message)
    if (updateRes.error) throw new Error('Failed to update profile: ' + updateRes.error.message)

    await markPlanGenerationStatus(supabase, userId, 'ok')

    return new Response(JSON.stringify({
      success: true,
      ai_layer: !!groqKey, // tentou IA; ver ai_filled_slots pra saber quanto dela realmente colou
      training_plan: {
        id: newPlan.id,
        training_plan_id: aiPlanSlug,
        name: planName,
        days_per_week: moldeDaysCount,
        duration_minutes: trainingDuration,
      },
      composition: filledSlotsKept.map(s => ({
        day_number: s.day_number,
        order_within_day: s.order_within_day,
        exercise_id: s.chosen_exercise_id,
        sets: s.sets,
        reps: s.reps,
        rest_seconds: s.rest_seconds,
        filled_by: s.filled_by,
      })),
      caution_warnings: cautionWarnings,
      skipped_slots: skippedSlotsPayload,
      ai_filled_slots: aiFilledCount,
      deterministic_fallback_slots: deterministicFilledCount,
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
    if (authedUserId) await markPlanGenerationStatus(supabase, authedUserId, 'failed', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
