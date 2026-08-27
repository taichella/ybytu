// Núcleo de montagem do payload do plano (treino + nutrição + review +
// calendário), extraído de ybytu-get-plan-payload em 2026-07-30 pra ser
// reusado por ybytu-get-plan-for-staff SEM duplicar as ~650 linhas de regra
// de negócio. Decisão explícita: as PORTAS de entrada (quem pode chamar,
// como autentica) ficam separadas em cada function — token público de um
// lado, sessão de staff do outro — só o "dado um userId já validado, monta
// o JSON" mora aqui. Ver [[project_staff_role_system_design]].
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── MET por papel do slot (fórmula de gasto calórico, PENDENTE de aprovação) ─
// kcal_slot = MET × peso_kg × (7min / 60). O "7min/slot" não é inventado aqui:
// é a mesma constante de pacing que ybytu-generate-training-plan usa pra
// decidir quantos slots cabem na duração pedida (targetSlotsPerDay), reusada
// pra manter estimated_kcal e estimated_minutes consistentes entre si.
const MINUTES_PER_SLOT = 7
const MET_BY_ROLE: Record<string, number> = {
  composto_principal: 6.0,
  composto_secundario: 5.0,
  isolamento: 3.5,
  core: 4.0,
  cardio: 7.0,
  leve_mobilidade: 2.5,
}

// ─── Categoria macro por grupo muscular (só pro card "Distribuição de Exercícios") ─
// muscle_groups no banco é taxonomia anatômica granular (60+ músculos), sem
// coluna de categoria. Este mapa é taxonomia de EXIBIÇÃO (decisão feita sem
// instrução explícita — sinalizar se destoar da expectativa do produto).
const MUSCLE_CATEGORY_MAP: Record<string, 'superior' | 'inferior' | 'core' | 'cardio'> = {
  chest: 'superior', pectoralis_major: 'superior', pectoralis_minor: 'superior',
  shoulders: 'superior', deltoids: 'superior', rotator_cuff: 'superior',
  back: 'superior', latissimus_dorsi: 'superior', trapezius: 'superior', rhomboids: 'superior',
  arms: 'superior', biceps_brachii: 'superior', triceps_brachii: 'superior', forearms: 'superior',
  serratus_anterior: 'superior',
  legs: 'inferior', quadriceps: 'inferior', hamstrings: 'inferior',
  glutes: 'inferior', gluteus_maximus: 'inferior', gluteus_medius: 'inferior',
  calves: 'inferior', gastrocnemius: 'inferior',
  core: 'core', rectus_abdominis: 'core', obliques: 'core',
  transverse_abdominis: 'core', erector_spinae: 'core', stabilizers: 'core',
  full_body: 'core', // TODO: full_body não tem categoria clara, pendente revisão
}

// ─── Metas do ciclo: texto de expectativa por objetivo, NUNCA número de resultado ─
// Decisão do produto: sem percentuais inventados (ex: "-3% gordura"). Editável
// pelo profissional fica fora de escopo aqui — extensão futura de plan_reviews.
// Textos aprovados na sessão de 2026-07-28 — cada frase de origem tem 2 orações
// (sinal precoce + consolidação), quebradas em 2 entradas cada, exceto
// conditioning que tem 1 oração só. Copiados verbatim, não reescrever.
const CYCLE_EXPECTATIONS_BY_GOAL: Record<string, Array<{ expectation_ptbr: string; window_ptbr: string }>> = {
  hypertrophy: [
    { expectation_ptbr: 'Ganhos de força tendem a aparecer já nas primeiras 2 a 3 semanas.', window_ptbr: '2–3 semanas' },
    { expectation_ptbr: 'Mudanças visíveis de massa muscular costumam se consolidar a partir de 8 a 12 semanas de adesão consistente.', window_ptbr: '8–12 semanas' },
  ],
  weight_loss: [
    { expectation_ptbr: 'Ajustes no peso corporal costumam começar a ser percebidos já nas primeiras 3 a 4 semanas de adesão consistente.', window_ptbr: '3–4 semanas' },
    { expectation_ptbr: 'Resultados mais consolidados costumam aparecer a partir de 8 a 12 semanas.', window_ptbr: '8–12 semanas' },
  ],
  conditioning: [
    { expectation_ptbr: 'Melhoras de disposição e resistência costumam ser percebidas já nas primeiras 2 a 4 semanas de adesão consistente.', window_ptbr: '2–4 semanas' },
  ],
  health_routine: [
    { expectation_ptbr: 'Benefícios de uma rotina consistente — energia, sono, bem-estar — costumam aparecer já nas primeiras semanas.', window_ptbr: 'primeiras semanas' },
    { expectation_ptbr: 'Consolidação costuma ocorrer ao longo de 8 a 12 semanas.', window_ptbr: '8–12 semanas' },
  ],
}

// ─── Helpers de lookup (tabelas de tradução id→label) ──────────────────────────
// A maioria das lookup tables usa name_ptbr, exceto activity_levels que usa
// label_ptbr — por isso o nome da coluna de label é parametrizado.
async function labelMapByUuid(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  labelColumn: string,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids)].filter(Boolean)
  if (uniqueIds.length === 0) return new Map()
  const { data, error } = await supabase.from(table).select(`id, ${labelColumn}`).in('id', uniqueIds)
  if (error) throw new Error(`Lookup falhou (${table}): ${error.message}`)
  return new Map((data ?? []).map((row: any) => [row.id, row[labelColumn]]))
}

async function singleLabelByUuid(
  supabase: SupabaseClient,
  table: string,
  id: string | null,
  labelColumn: string,
): Promise<string | null> {
  if (!id) return null
  const map = await labelMapByUuid(supabase, table, [id], labelColumn)
  return map.get(id) ?? null
}

// exercises.muscle_groups_ids guarda o SLUG text (muscle_group_id, ex 'chest'),
// não o uuid — precisa de um lookup separado do labelMapByUuid acima.
async function labelMapBySlug(
  supabase: SupabaseClient,
  table: string,
  slugColumn: string,
  slugs: string[],
  labelColumn: string,
): Promise<Map<string, string>> {
  const uniqueSlugs = [...new Set(slugs)].filter(Boolean)
  if (uniqueSlugs.length === 0) return new Map()
  const { data, error } = await supabase.from(table).select(`${slugColumn}, ${labelColumn}`).in(slugColumn, uniqueSlugs)
  if (error) throw new Error(`Lookup falhou (${table}): ${error.message}`)
  return new Map((data ?? []).map((row: any) => [row[slugColumn], row[labelColumn]]))
}

// ─── IMC ────────────────────────────────────────────────────────────────────
// Faixas OMS padrão. Não havia instrução explícita sobre os cortes — decisão
// tomada aqui, sinalizar se o produto quiser outra referência.
function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}
function bmiClassPtbr(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso'
  if (bmi < 25) return 'Faixa saudável'
  if (bmi < 30) return 'Sobrepeso'
  return 'Obesidade'
}

// ─── Papel do slot (kcal / distribuição de grupos musculares) ─────────────────
// DUPLICAÇÃO CONHECIDA: esta é a mesma regra de classificação de papel usada em
// ybytu-generate-training-plan (roleForMoldeSlot) — override por nome de
// exercício, senão pelo nº de séries persistido na linha (1→isolamento,
// 2→composto_secundario, senão→composto_principal). Não dá pra importar entre
// Edge Functions sem um módulo compartilhado (fora de escopo aqui), então a
// regra foi replicada. Se um dia o role virar coluna persistida em
// training_plan_exercises, trocar isso por leitura direta da coluna.
// LIMITAÇÃO: papel "leve_mobilidade" (dia de mobilidade leve dos splits de
// 7 dias) não tem como ser detectado só por sets/nome — não há marcador
// persistido pra ele. Slots desse tipo caem em composto_principal/secundario/
// isolamento por sets, o que SUBESTIMA o kcal real (MET de leve_mobilidade é
// bem menor). Pendente até existir uma coluna de papel persistida.
const CORE_EXERCISE_NAMES_PTBR = new Set(['Abdominal tradicional'])
const CARDIO_EXERCISE_NAMES_PTBR = new Set(['Corrida em inclinação (esteira inclinada)'])

function roleForSlot(exerciseNamePtbr: string, sets: number): keyof typeof MET_BY_ROLE {
  if (CORE_EXERCISE_NAMES_PTBR.has(exerciseNamePtbr)) return 'core'
  if (CARDIO_EXERCISE_NAMES_PTBR.has(exerciseNamePtbr)) return 'cardio'
  if (sets === 1) return 'isolamento'
  if (sets === 2) return 'composto_secundario'
  return 'composto_principal'
}

function cadencePtbr(row: {
  cadence_eccentric: number | null
  cadence_isometric_bottom: number | null
  cadence_concentric: number | null
  cadence_isometric_top: number | null
}): string {
  const parts = [row.cadence_eccentric, row.cadence_isometric_bottom, row.cadence_concentric, row.cadence_isometric_top]
  if (parts.some(p => p === null || p === undefined)) return '—'
  return parts.join('-')
}

// ─── Calendário de 15 dias ──────────────────────────────────────────────────
// DECISÃO sem instrução explícita: distribui os dias de treino nos primeiros
// N dias de cada bloco de 7 (N = training_days_per_week), o resto vira "livre".
// training_day_ref cicla pelos dias do split (1..trainingDayCount); meal_day_ref
// cicla independentemente pelos menus disponíveis (podem ter contagens
// diferentes se training_days_per_week != nutrition_days_per_week/menus).
const WEEKDAYS_PTBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const CYCLE_DAYS = 15 // DECISÃO: não há campo de duração de desafio no schema — fixo em 15, igual ao mockup.

// ─── Rótulo de região macro por dia (formato do título aprovado pela Taina) ───
// "Misto" quando não há maioria clara (empate entre 2+ categorias) — decisão
// sem instrução explícita, mas é o caso mais honesto (dia de full body, por
// exemplo, não deveria se apresentar como "Superior" nem "Inferior").
function regionLabelPtbr(counts: Record<string, number>): string {
  const labels: Record<string, string> = { superior: 'Superior', inferior: 'Inferior', core: 'Core', cardio: 'Cardio' }
  const entries = Object.entries(counts).filter(([, n]) => n > 0)
  if (entries.length === 0) return 'Treino'
  const max = Math.max(...entries.map(([, n]) => n))
  const winners = entries.filter(([, n]) => n === max)
  if (winners.length > 1) return 'Misto'
  return labels[winners[0][0]] ?? 'Treino'
}

// "Peito, Costas, Ombros & Braços" — vírgula entre os itens, "&" só antes do
// último. Formato exato pedido pela Taina pro título do dia de treino.
function joinWithAmpersand(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
}

function buildCalendar(
  issuedAt: Date,
  trainingDaysPerWeek: number,
  trainingDayCount: number,
  mealMenuCount: number,
): Array<Record<string, unknown>> {
  const calendar: Array<Record<string, unknown>> = []
  let trainingCounter = 0
  let mealCounter = 0
  for (let day = 1; day <= CYCLE_DAYS; day++) {
    const date = new Date(issuedAt)
    date.setDate(date.getDate() + (day - 1))
    const weekdayPtbr = WEEKDAYS_PTBR[date.getDay()]
    const posInWeek = (day - 1) % 7
    const isTrainingDay = trainingDaysPerWeek > 0 && trainingDayCount > 0 && posInWeek < trainingDaysPerWeek
    if (isTrainingDay) {
      trainingCounter++
      const trainingRef = ((trainingCounter - 1) % trainingDayCount) + 1
      const mealRef = mealMenuCount > 0 ? (((mealCounter++) % mealMenuCount) + 1) : null
      calendar.push({ day, weekday_ptbr: weekdayPtbr, type: 'treino', training_day_ref: trainingRef, meal_day_ref: mealRef })
    } else {
      calendar.push({ day, weekday_ptbr: weekdayPtbr, type: 'livre' })
    }
  }
  return calendar
}

// ─── Seção de treino ────────────────────────────────────────────────────────
async function buildTrainingSection(
  supabase: SupabaseClient,
  profile: any,
): Promise<{ section: Record<string, unknown> | null; dayCount: number; issuedAt: Date | null }> {
  if (!profile.current_training_plan_id) {
    return { section: null, dayCount: 0, issuedAt: null }
  }

  const { data: planRow, error: planErr } = await supabase
    .from('training_plans')
    .select('training_plan_id, name_ptbr, created_at, caution_warnings, is_active')
    .eq('id', profile.current_training_plan_id)
    .maybeSingle()
  if (planErr) throw new Error(`Lookup do training_plan falhou: ${planErr.message}`)
  if (!planRow) return { section: null, dayCount: 0, issuedAt: null }

  // ATENÇÃO — landmine de schema (mesma documentada em ybytu-generate-training-plan):
  // training_plan_exercises.training_plan_id é TEXT e guarda o SLUG (tr_204,
  // tr_ai_xxx), NÃO o uuid de training_plans.id. profiles.current_training_plan_id
  // guarda o uuid — por isso o lookup em 2 passos acima.
  const { data: tpeRows, error: tpeErr } = await supabase
    .from('training_plan_exercises')
    .select('id, exercise_id, day_number, order_within_day, sets, reps, rest_seconds, cadence_eccentric, cadence_isometric_bottom, cadence_concentric, cadence_isometric_top, sets_detail, method_id, superset_group')
    .eq('training_plan_id', planRow.training_plan_id)
    .order('day_number', { ascending: true })
    .order('order_within_day', { ascending: true })
  if (tpeErr) throw new Error(`Lookup de training_plan_exercises falhou: ${tpeErr.message}`)
  if (!tpeRows || tpeRows.length === 0) return { section: null, dayCount: 0, issuedAt: null }

  const exerciseIds = [...new Set(tpeRows.map(r => r.exercise_id))]
  const { data: exerciseRows, error: exErr } = await supabase
    .from('exercises')
    .select('exercise_id, name_ptbr, instruction_ptbr, video_url, muscle_groups_ids')
    .in('exercise_id', exerciseIds)
  if (exErr) throw new Error(`Lookup de exercises falhou: ${exErr.message}`)
  const exerciseById = new Map((exerciseRows ?? []).map((r: any) => [r.exercise_id, r]))

  // Avisos de cautela: jsonb [{condition, mensagem, exercise_ids}] → map
  // exercise_id → mensagens, pra anotar o dia que contém o exercício adaptado.
  const cautionByExerciseId = new Map<string, string[]>()
  for (const warning of (planRow.caution_warnings ?? []) as Array<{ mensagem: string; exercise_ids: string[] }>) {
    for (const exId of warning.exercise_ids ?? []) {
      if (!cautionByExerciseId.has(exId)) cautionByExerciseId.set(exId, [])
      cautionByExerciseId.get(exId)!.push(warning.mensagem)
    }
  }

  // Agrupa por day_number preservando a ordem já vinda do ORDER BY.
  const dayNumbers = [...new Set(tpeRows.map(r => r.day_number))].sort((a, b) => a - b)
  const weightKg = profile.weight_kg ?? 70 // fallback conservador se peso não estiver preenchido

  // Lookup de nomes de grupo muscular pro título formatado (Peito, Costas...) —
  // exercises.muscle_groups_ids guarda o SLUG (muscle_group_id), não uuid, por
  // isso usa labelMapBySlug e não o labelMapByUuid usado no resto do arquivo.
  const allMuscleGroupSlugs = [...new Set((exerciseRows ?? []).flatMap((e: any) => e.muscle_groups_ids ?? []))]
  const muscleGroupNameBySlug = await labelMapBySlug(supabase, 'muscle_groups', 'muscle_group_id', allMuscleGroupSlugs, 'name_ptbr')

  const muscleCategoryCounts: Record<string, number> = { superior: 0, inferior: 0, core: 0, cardio: 0 }
  let categorizedSlotCount = 0

  const days = dayNumbers.map(dayNumber => {
    const slots = tpeRows.filter(r => r.day_number === dayNumber)
    const dayCautionMessages = new Set<string>()
    // Ordem de PRIMEIRA aparição no dia (não frequência) — reflete a ordem real
    // dos exercícios no treino, mais previsível pro título que um rank por contagem.
    const dayMuscleGroupSlugsSeen: string[] = []
    const dayCategoryCounts: Record<string, number> = { superior: 0, inferior: 0, core: 0, cardio: 0 }

    const exercises = slots.map((slot, idx) => {
      const ex = exerciseById.get(slot.exercise_id)
      const role = roleForSlot(ex?.name_ptbr ?? '', slot.sets)

      // Distribuição de grupos musculares: atribui o slot INTEIRO à categoria
      // do PRIMEIRO grupo muscular do array que mapeia em MUSCLE_CATEGORY_MAP
      // (assume-se que muscle_groups_ids vem ordenado primário→secundário —
      // VERIFICADO nesta sessão contra dados reais: majoritariamente
      // primário-primeiro pra movimentos compostos simples, mas com
      // inconsistências confirmadas em pelo menos 3 exercícios com linhas
      // duplicadas de mesmo nome discordando entre si — ex: "Cadeira flexora"
      // aparece uma vez como [Glúteos] só, outra como [Isquiotibiais,
      // Glúteos]. Pra este agrupamento de 4 categorias (superior/inferior/
      // core/cardio) o impacto prático é baixo nos casos encontrados —
      // glúteos/isquiotibiais/quadríceps caem todos em 'inferior' de
      // qualquer forma — mas exercícios híbridos core+superior (ex: prancha
      // com puxada) PODEM cruzar categoria dependendo de qual entrada é
      // realmente primária. Dívida de qualidade de dado, não deste payload.
      // Slots sem nenhum grupo mapeável ficam de fora do denominador (não
      // incrementam categorizedSlotCount), conforme pedido.
      const primaryGroupId = (ex?.muscle_groups_ids ?? []).find((g: string) => MUSCLE_CATEGORY_MAP[g])
      if (primaryGroupId) {
        const category = MUSCLE_CATEGORY_MAP[primaryGroupId]
        muscleCategoryCounts[category]++
        dayCategoryCounts[category]++
        categorizedSlotCount++
      }
      // Título do dia usa só o grupo PRIMÁRIO de cada exercício (1 por slot),
      // não todo muscle_groups_ids (que inclui secundários/estabilizadores e
      // deixaria o título poluído — ex: um exercício de cardio na esteira
      // arrastando "Panturrilhas, Glúteos" pra dentro de um dia "Superior").
      // Bate com o exemplo da Taina (4 grupos pra ~6 exercícios, 1 cada).
      const primaryGroupSlug = (ex?.muscle_groups_ids ?? [])[0]
      if (primaryGroupSlug && !dayMuscleGroupSlugsSeen.includes(primaryGroupSlug)) {
        dayMuscleGroupSlugsSeen.push(primaryGroupSlug)
      }

      for (const msg of cautionByExerciseId.get(slot.exercise_id) ?? []) dayCautionMessages.add(msg)

      return {
        // id = training_plan_exercises.id (uuid) DESTE slot no plano do
        // ALUNO (não do molde) — passo 5: é o que o front manda de volta em
        // load_updates[].training_plan_exercise_id pra editar carga. Ver
        // [[project_plan_creators_schema_debt]].
        id: (slot as any).id ?? null,
        order: String.fromCharCode(65 + idx), // A, B, C...
        name_ptbr: ex?.name_ptbr ?? null,
        instruction_ptbr: ex?.instruction_ptbr ?? null,
        video_url: ex?.video_url ?? null,
        sets: slot.sets,
        reps_ptbr: String(slot.reps), // schema só tem 1 valor de reps, não faixa min-max
        cadence_ptbr: cadencePtbr(slot),
        rest_seconds: slot.rest_seconds,
        role, // exposto pro front, não estava no shape original mas é útil pra badge/agrupamento
        // ADITIVO (2026-08-08) — sets/reps_ptbr/cadence_ptbr/rest_seconds acima
        // continuam sendo o resumo (1ª série), intocados. sets_detail é null
        // pra qualquer plano ainda não migrado — só planos com o campo
        // populado trazem o array. Passo 5: UserPlan.jsx lê load_kg daqui
        // quando editable=true.
        sets_detail: (slot as any).sets_detail ?? null,
        method_id: (slot as any).method_id ?? null,
        superset_group: (slot as any).superset_group ?? null,
      }
    })

    const estimatedMinutes = exercises.length * MINUTES_PER_SLOT + 5 // mesma fórmula (invertida) de targetSlotsPerDay no gerador
    const estimatedKcal = Math.round(
      exercises.reduce((sum, e) => sum + MET_BY_ROLE[e.role as string] * weightKg * (MINUTES_PER_SLOT / 60), 0),
    )

    const regionLabel = regionLabelPtbr(dayCategoryCounts)
    const muscleGroupsPtbr = dayMuscleGroupSlugsSeen.map(g => muscleGroupNameBySlug.get(g) ?? g)

    return {
      day_number: dayNumber,
      region_label_ptbr: regionLabel,
      muscle_groups_ptbr: muscleGroupsPtbr,
      // weekday_ptbr e title_ptbr ficam provisórios aqui — preenchidos de
      // verdade em buildPlanPayload depois que o calendário existe (ver
      // comentário lá: título final precisa do dia da semana embutido, no
      // formato "1 - Superior — Peito, Costas, Ombros & Braços, Segunda-feira
      // ~45 min" aprovado pela Taina).
      weekday_ptbr: null,
      title_ptbr: null,
      estimated_minutes: estimatedMinutes,
      estimated_kcal: estimatedKcal,
      adapted_note_ptbr: dayCautionMessages.size ? [...dayCautionMessages].join(' ') : null,
      exercises,
    }
  })

  const muscleGroupDistribution = categorizedSlotCount > 0
    ? {
        superior_pct: Math.round((muscleCategoryCounts.superior / categorizedSlotCount) * 100),
        inferior_pct: Math.round((muscleCategoryCounts.inferior / categorizedSlotCount) * 100),
        core_pct: Math.round((muscleCategoryCounts.core / categorizedSlotCount) * 100),
        cardio_pct: Math.round((muscleCategoryCounts.cardio / categorizedSlotCount) * 100),
      }
    : { superior_pct: 0, inferior_pct: 0, core_pct: 0, cardio_pct: 0 }

  const avgEstimatedKcal = days.length
    ? Math.round(days.reduce((sum, d) => sum + (d.estimated_kcal as number), 0) / days.length)
    : 0

  // Preferências de treino vêm do PERFIL (o que o usuário declarou querer),
  // não do plano em si — coerente com o card "Preferências de Treino" do
  // mockup, que reflete a intenção do usuário, não a execução do gerador.
  //
  // BUG ENCONTRADO E CORRIGIDO nesta verificação: profile.exercise_equipments_ids
  // e profile.muscle_groups_ids guardam uuids de ONBOARDING_EXERCISE_EQUIPMENTS /
  // ONBOARDING_MUSCLE_GROUPS (o agrupamento grosso que o onboarding mostra pro
  // usuário, ex: "Halteres", "Corpo Inteiro"), NÃO de exercise_equipments /
  // muscle_groups (o catálogo fino usado na composição do treino). Confirmado
  // lendo ybytu-generate-training-plan (mesmo 2-hop já documentado lá pro
  // filtro de pool). A versão anterior deste arquivo buscava na tabela fina
  // por engano e teria devolvido arrays vazios pra qualquer perfil real.
  const [environmentPtbr, equipmentLabels, muscleGroupLabels] = await Promise.all([
    singleLabelByUuid(supabase, 'exercise_environment', profile.exercise_environment_id, 'name_ptbr'),
    labelMapByUuid(supabase, 'onboarding_exercise_equipments', profile.exercise_equipments_ids ?? [], 'name_ptbr'),
    labelMapByUuid(supabase, 'onboarding_muscle_groups', profile.muscle_groups_ids ?? [], 'name_ptbr'),
  ])

  return {
    dayCount: days.length,
    issuedAt: planRow.created_at ? new Date(planRow.created_at) : null,
    section: {
      // slug (tr_ai_xxx) do plano ATIVO deste aluno — passo 5: o front manda
      // de volta como training_plan_id em load_updates pra checagem de
      // posse no servidor (ver ybytu-submit-plan-review).
      training_plan_id: planRow.training_plan_id,
      // Nome real do plano (ex: "Hipertrofia 12 Semanas") -- adicionado pra
      // subseção Planos Atribuídos (UsuarioDetalhe.dc.html), que mostra o
      // nome do plano no card em vez de um rótulo genérico.
      name_ptbr: planRow.name_ptbr,
      // is_active aqui = "publicado" (rascunho vs publicado), controlado
      // pelo admin/personal via ybytu-admin-trainings — não confundir com
      // MOLDE_IDS (moldes tr_2xx nunca podem ser desativados, ver lá). Usado
      // pela lista de planos do UserDetail pra computar a tag de status.
      is_active: planRow.is_active,
      environment_ptbr: environmentPtbr,
      days_per_week: profile.training_days_per_week ?? days.length,
      session_duration_min: profile.training_duration_minutes ?? null,
      priority_muscle_groups_ptbr: [...muscleGroupLabels.values()],
      available_equipment_ptbr: [...equipmentLabels.values()],
      days,
      muscle_group_distribution: muscleGroupDistribution,
      avg_estimated_kcal_per_session: avgEstimatedKcal,
    },
  }
}

// ─── Seção de nutrição ──────────────────────────────────────────────────────
const MEAL_TIME_PTBR: Record<string, string> = {
  // DECISÃO sem instrução explícita: não há horário persistido por meal_type,
  // horários fixos de exibição só (não afetam nenhuma lógica de geração).
  breakfast: '07:00',
  lunch: '12:00',
  snack: '15:30',
  dinner: '19:00',
  dessert: '20:00',
}

async function buildNutritionSection(
  supabase: SupabaseClient,
  profile: any,
): Promise<{ section: Record<string, unknown> | null; menuDayCount: number; issuedAt: Date | null }> {
  if (!profile.current_meal_plan_id) {
    return { section: null, menuDayCount: 0, issuedAt: null }
  }

  const { data: planRow, error: planErr } = await supabase
    .from('meal_plans')
    .select('name_ptbr, calories, meals_per_day, days_per_week, created_at, is_active')
    .eq('id', profile.current_meal_plan_id)
    .maybeSingle()
  if (planErr) throw new Error(`Lookup do meal_plan falhou: ${planErr.message}`)
  if (!planRow) return { section: null, menuDayCount: 0, issuedAt: null }

  // ATENÇÃO — landmine de schema INVERSA à do lado treino (confirmada no
  // gerador ybytu-generate-meal-plan): meal_plan_meals.meal_plan_id e .meal_id
  // são colunas TEXT mas guardam UUIDs (de meal_plans.id / meals.id), NÃO os
  // slugs mp_NNN/meal_NNN. current_meal_plan_id já É o uuid, comparação direta.
  const { data: mpmRows, error: mpmErr } = await supabase
    .from('meal_plan_meals')
    .select('day_order, meal_order, meal_type_id, meal_id')
    .eq('meal_plan_id', profile.current_meal_plan_id)
    .order('day_order', { ascending: true })
    .order('meal_order', { ascending: true })
  if (mpmErr) throw new Error(`Lookup de meal_plan_meals falhou: ${mpmErr.message}`)
  if (!mpmRows || mpmRows.length === 0) return { section: null, menuDayCount: 0, issuedAt: null }

  const mealUuids = [...new Set(mpmRows.map(r => r.meal_id))]
  const { data: mealRows, error: mealErr } = await supabase
    .from('meals')
    .select('id, name_ptbr, calories, protein_g, carbs_g, fat_g, ingredients_json, instruction_ptbr')
    .in('id', mealUuids)
  if (mealErr) throw new Error(`Lookup de meals falhou: ${mealErr.message}`)
  const mealById = new Map((mealRows ?? []).map((r: any) => [r.id, r]))

  const mealTypeIds = [...new Set(mpmRows.map(r => r.meal_type_id))]
  const { data: mealTypeRows, error: mtErr } = await supabase
    .from('meal_types')
    .select('meal_type_id, name_ptbr')
    .in('meal_type_id', mealTypeIds)
  if (mtErr) throw new Error(`Lookup de meal_types falhou: ${mtErr.message}`)
  const mealTypeNameBySlug = new Map((mealTypeRows ?? []).map((r: any) => [r.meal_type_id, r.name_ptbr]))

  // Ingredientes: ingredients_json guarda [{id: food_XXX, qtd, unit}] — precisa
  // traduzir o food_id pro nome. Coleta todos os food_ids usados em todas as
  // meals do rodízio antes de buscar, pra fazer 1 query só.
  const allFoodIds = new Set<string>()
  for (const meal of mealRows ?? []) {
    for (const ing of (meal.ingredients_json ?? []) as Array<{ id: string }>) allFoodIds.add(ing.id)
  }
  const { data: foodRows, error: foodErr } = await supabase
    .from('foods')
    .select('food_id, name_ptbr')
    .in('food_id', [...allFoodIds])
  if (foodErr) throw new Error(`Lookup de foods falhou: ${foodErr.message}`)
  const foodNameBySlug = new Map((foodRows ?? []).map((r: any) => [r.food_id, r.name_ptbr]))

  const dayOrders = [...new Set(mpmRows.map(r => r.day_order))].sort((a, b) => a - b)
  const dailyTotals: Array<{ protein: number; carbs: number; fat: number }> = []

  const menus = dayOrders.map(dayOrder => {
    const rowsForDay = mpmRows.filter(r => r.day_order === dayOrder)
    let dayProtein = 0, dayCarbs = 0, dayFat = 0

    const meals = rowsForDay.map(row => {
      const meal = mealById.get(row.meal_id)
      dayProtein += Number(meal?.protein_g ?? 0)
      dayCarbs += Number(meal?.carbs_g ?? 0)
      dayFat += Number(meal?.fat_g ?? 0)

      const ingredients = ((meal?.ingredients_json ?? []) as Array<{ id: string; qtd: number; unit: string }>).map(ing => ({
        name_ptbr: foodNameBySlug.get(ing.id) ?? null,
        quantity_ptbr: `${ing.qtd}${ing.unit === 'g' || ing.unit === 'ml' ? ing.unit : ` ${ing.unit}`}`,
      }))

      return {
        name_ptbr: mealTypeNameBySlug.get(row.meal_type_id) ?? row.meal_type_id,
        time_ptbr: MEAL_TIME_PTBR[row.meal_type_id] ?? null,
        kcal: meal ? Math.round(Number(meal.calories)) : null,
        macros: meal ? { protein_g: Number(meal.protein_g), carb_g: Number(meal.carbs_g), fat_g: Number(meal.fat_g) } : null,
        ingredients,
        prep_ptbr: meal?.instruction_ptbr ?? null,
        meal_name_ptbr: meal?.name_ptbr ?? null, // extra: nome do prato em si, não estava no shape original mas é necessário pro card
      }
    })

    dailyTotals.push({ protein: dayProtein, carbs: dayCarbs, fat: dayFat })
    return { menu_day: dayOrder, meals }
  })

  // macro_distribution: shape pede 1 objeto só (não por dia) — usa a MÉDIA dos
  // totais diários reais do rodízio como "macro típico do dia". DECISÃO sem
  // instrução explícita — não existe meta de macro em gramas persistida em
  // lugar nenhum do schema (só meal_plans.calories, que é kcal, não macro).
  const avgMacro = dailyTotals.length
    ? {
        protein_g: Math.round(dailyTotals.reduce((s, d) => s + d.protein, 0) / dailyTotals.length),
        carb_g: Math.round(dailyTotals.reduce((s, d) => s + d.carbs, 0) / dailyTotals.length),
        fat_g: Math.round(dailyTotals.reduce((s, d) => s + d.fat, 0) / dailyTotals.length),
      }
    : { protein_g: 0, carb_g: 0, fat_g: 0 }

  const preferencePtbr = await singleLabelByUuid(supabase, 'dietary_preferences', profile.dietary_preference_id, 'name_ptbr')

  return {
    menuDayCount: menus.length,
    issuedAt: planRow.created_at ? new Date(planRow.created_at) : null,
    section: {
      preference_ptbr: preferencePtbr,
      // Nome real do plano alimentar -- mesmo motivo do lado treino acima.
      name_ptbr: planRow.name_ptbr,
      // is_active = "publicado" (rascunho vs publicado) — mesmo significado
      // do lado treino acima, usado pra tag de status na lista de planos.
      is_active: planRow.is_active,
      days_per_week: profile.nutrition_days_per_week ?? planRow.days_per_week,
      meals_per_day: profile.meals_per_day ?? planRow.meals_per_day,
      daily_kcal_target: planRow.calories,
      macro_distribution: avgMacro,
      menus,
    },
  }
}

// ─── Seção de parecer profissional ─────────────────────────────────────────
async function buildReviewSection(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('plan_reviews')
    .select('role, reviewer_name, reviewer_credential, note_ptbr, status, updated_at')
    .eq('user_id', userId)
  if (error) throw new Error(`Lookup de plan_reviews falhou: ${error.message}`)

  const byRole = new Map((data ?? []).map((r: any) => [r.role, r]))
  const shape = (row: any | undefined) =>
    row ? { reviewer_name: row.reviewer_name, reviewer_credential: row.reviewer_credential, note_ptbr: row.note_ptbr, status: row.status ?? null, updated_at: row.updated_at } : null

  return {
    personal: shape(byRole.get('personal')),
    nutricionista: shape(byRole.get('nutricionista')),
  }
}

// ─── Montagem do payload ────────────────────────────────────────────────────
// Recebe o user_id já validado (pelo token OU pela sessão de staff — quem
// chamou já decidiu isso antes de chegar aqui) e devolve o JSON completo pro
// UserPlan.jsx: meta, profile, training, nutrition, review e cycle_goals.
export async function buildPlanPayload(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (profileErr) throw new Error(`Lookup de profile falhou: ${profileErr.message}`)
  if (!profile) throw new Error(`Profile não encontrado para user_id ${userId}`)

  const [
    genderPtbr,
    activityLevelPtbr,
    exerciseLevelPtbr,
    goalRows,
    healthLimitations,
    physicalLimitations,
    trainingResult,
    nutritionResult,
    review,
  ] = await Promise.all([
    singleLabelByUuid(supabase, 'genders', profile.gender_id, 'name_ptbr'),
    singleLabelByUuid(supabase, 'activity_levels', profile.activity_level_id, 'label_ptbr'),
    singleLabelByUuid(supabase, 'exercise_levels', profile.exercise_level_id, 'name_ptbr'),
    // goals precisa do goal_id (slug) além do label, pra bater com
    // CYCLE_EXPECTATIONS_BY_GOAL — por isso não usa o helper labelMapByUuid.
    (async () => {
      const ids = [...new Set(profile.goals_ids ?? [])]
      if (ids.length === 0) return []
      const { data, error } = await supabase.from('goals').select('id, goal_id, name_ptbr').in('id', ids)
      if (error) throw new Error(`Lookup de goals falhou: ${error.message}`)
      return data ?? []
    })(),
    labelMapByUuid(supabase, 'health_conditions', profile.health_conditions_ids ?? [], 'name_ptbr'),
    // BUG ENCONTRADO E CORRIGIDO: profile.physical_conditions_ids guarda uuids de
    // ONBOARDING_PHYSICAL_CONDITIONS (agrupamento grosso, ex: "Joelho"), não de
    // physical_conditions diretamente — mesmo padrão de onboarding_* acima.
    // health_conditions_ids É direto (confirmado no gerador de treino, sem hop),
    // por isso só este aqui precisou trocar de tabela.
    labelMapByUuid(supabase, 'onboarding_physical_conditions', profile.physical_conditions_ids ?? [], 'name_ptbr'),
    buildTrainingSection(supabase, profile),
    buildNutritionSection(supabase, profile),
    buildReviewSection(supabase, userId),
  ])

  const bmi = profile.weight_kg && profile.height_cm ? calcBmi(profile.weight_kg, profile.height_cm) : null

  const issuedAt = trainingResult.issuedAt ?? nutritionResult.issuedAt ?? new Date()
  const calendar = buildCalendar(
    issuedAt,
    profile.training_days_per_week ?? 0,
    trainingResult.dayCount,
    nutritionResult.menuDayCount,
  )

  // ─── Finaliza weekday_ptbr + title_ptbr dos dias de treino usando o calendário ─
  // VERIFICADO nesta sessão contra o próprio buildCalendar: a 1ª ocorrência de
  // cada training_day_ref no calendário SEMPRE cai no mesmo dia da semana em
  // TODA repetição do ciclo — mas SÓ quando training_days_per_week (o que o
  // usuário pediu) é IGUAL ao nº de dias do split realmente gerado
  // (trainingResult.dayCount). Isso é o caso comum (o split é escolhido a
  // partir do mesmo training_days_per_week), mas se um dia divergirem — ex.
  // perfil pede 5 dias/semana mas o split ativo tem 4 dias — o mapeamento
  // dia-do-split→dia-da-semana DERIVA a cada semana (dia 1 do split pode cair
  // numa segunda na semana 1 e numa quinta na semana 3). Isso NÃO é escondido:
  // se não houver ocorrência nenhuma no calendário pro training_day_ref (caso
  // extremo, ex. dayCount=0), weekday_ptbr fica null.
  const weekdayByTrainingDayRef = new Map<number, string>()
  for (const entry of calendar) {
    if (entry.type === 'treino' && typeof entry.training_day_ref === 'number' && !weekdayByTrainingDayRef.has(entry.training_day_ref)) {
      weekdayByTrainingDayRef.set(entry.training_day_ref, entry.weekday_ptbr as string)
    }
  }
  if (trainingResult.section) {
    const days = (trainingResult.section as any).days as Array<Record<string, unknown>>
    for (const day of days) {
      const dayNumber = day.day_number as number
      const weekdayPtbr = weekdayByTrainingDayRef.get(dayNumber) ?? null
      day.weekday_ptbr = weekdayPtbr
      const muscleGroupsPtbr = day.muscle_groups_ptbr as string[]
      // Formato aprovado: "1 - Superior — Peito, Costas, Ombros & Braços,
      // Segunda-feira ~45 min". Se weekdayPtbr for null (caso extremo acima)
      // ou não houver grupos mapeados, o título degrada graciosamente sem a
      // parte ausente em vez de imprimir "null" ou vírgula solta.
      const tail = [muscleGroupsPtbr.length ? joinWithAmpersand(muscleGroupsPtbr) : null, weekdayPtbr].filter(Boolean).join(', ')
      day.title_ptbr = `${dayNumber} - ${day.region_label_ptbr} — ${tail} ~${day.estimated_minutes} min`
    }
  }

  const cycleGoals = goalRows.flatMap((g: any) =>
    (CYCLE_EXPECTATIONS_BY_GOAL[g.goal_id] ?? []).map(exp => ({ goal: g.goal_id, ...exp })),
  )

  return {
    meta: {
      // DECISÃO: não existe código de plano persistido em lugar nenhum do
      // schema — gerado deterministicamente a partir do user_id só pra exibição.
      plan_code: `PL-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      issued_at: issuedAt.toISOString().slice(0, 10),
      cycle_days: CYCLE_DAYS,
      calendar,
    },
    profile: {
      name: profile.full_name ?? ([profile.first_name, profile.last_name].filter(Boolean).join(' ') || null),
      gender_ptbr: genderPtbr,
      age: profile.age,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      bmi,
      bmi_class_ptbr: bmi !== null ? bmiClassPtbr(bmi) : null,
      activity_level_ptbr: activityLevelPtbr,
      training_level_ptbr: exerciseLevelPtbr,
      goals_ptbr: goalRows.map((g: any) => g.name_ptbr),
      physical_limitations_ptbr: [...physicalLimitations.values()],
      health_limitations_ptbr: [...healthLimitations.values()],
    },
    training: trainingResult.section,
    nutrition: nutritionResult.section,
    review,
    cycle_goals: cycleGoals,
  }
}
