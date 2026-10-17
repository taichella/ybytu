import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'
import { TOKEN_LABEL_PTBR } from '../_shared/allergenLabels.ts'
import { SAFETY_FLOOR_KCAL_DEFAULT, safetyFloorForPlan, menuTotalsByDay, daysBelowFloor, belowFloorReason } from '../_shared/safetyFloor.ts'

// CRUD de `meal_plans` + `meal_plan_meals` (dashboard pro). Papel exigido:
// nutricionista ou admin.
//
// `meal_plan_meals.meal_plan_id` e `.meal_id` são TEXT mas guardam o uuid
// (`meal_plans.id` / `meals.id`) como string -- não o meal_plan_id/meal_id
// (código de negócio). Confirmado lendo buildPlanPayload.ts, que é quem lê
// isso pro payload do usuário: `.eq('meal_plan_id', profile.current_meal_plan_id)`
// (uuid) e `.in('id', mealUuids)` a partir de `mpmRows.meal_id`. Escrever
// aqui com o código de negócio em vez do uuid quebra o payload do usuário
// silenciosamente (planos "vazios").
//
// `meal_plans.goals_ids` é jsonb aqui -- diferente de training_plans.goals_ids
// que é text. Não confundir os dois ao portar lógica entre os dois domínios.
function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const PLAN_WRITABLE_FIELDS = [
  'meal_plan_id', 'name_ptbr', 'name_en', 'name_fr', 'goals_ids', 'calories',
  'meals_per_day', 'instruction_ptbr', 'instruction_en', 'instruction_fr',
  'days_per_week', 'is_active', 'dietary_preference', 'restriction_tags', 'created_by_ai',
]

function sanitizePlan(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of PLAN_WRITABLE_FIELDS) {
    if (key in data) out[key] = data[key]
  }
  return out
}

// Substitui todos os slots (meal_plan_meals) do plano -- delete + insert,
// mais simples que diffing e o volume por plano é pequeno (dias x refeições/dia).
async function replaceSlots(supabase: any, planId: string, slots: unknown) {
  if (!Array.isArray(slots)) return
  const { error: delErr } = await supabase.from('meal_plan_meals').delete().eq('meal_plan_id', planId)
  if (delErr) throw new Error(`Falha ao limpar meal_plan_meals: ${delErr.message}`)
  if (slots.length === 0) return
  const rows = slots.map((s: any) => ({
    meal_plan_id: planId,
    day_order: s.day_order,
    meal_order: s.meal_order,
    meal_type_id: s.meal_type_id,
    meal_id: s.meal_id,
  }))
  const { error: insErr } = await supabase.from('meal_plan_meals').insert(rows)
  if (insErr) throw new Error(`Falha ao gravar meal_plan_meals: ${insErr.message}`)
}

// Piso de segurança no construtor (2026-10-17, decisão da Taina): BLOQUEIA
// salvar, sem campo de justificativa ("justificativa vira campo que alguém
// preenche com qualquer coisa para passar"). Vale para plano que o aluno pode
// receber: ativo (pool do catálogo) ou atual de algum aluno. Rascunho sem
// aluno pode ser salvo incompleto -- senão não dá para montar um plano aos
// poucos; o bloqueio pega na hora de ativar. Piso do plano = o maior entre os
// alunos que o têm como atual (_shared/safetyFloor.ts).
async function checkSafetyFloor(
  supabase: any,
  planUuid: string | null,
  slots: Array<{ day_order: number; meal_id: string }> | null,
  willBeActive: boolean,
): Promise<{ ok: true } | { ok: false; message: string; floor: number; days: unknown }> {
  const { floor, students } = planUuid
    ? await safetyFloorForPlan(supabase, planUuid)
    : { floor: SAFETY_FLOOR_KCAL_DEFAULT, students: 0 }
  if (!willBeActive && students === 0) return { ok: true }

  let rows: Array<{ day_order: number; meal_id: string }> = slots ?? []
  if (!slots) {
    const { data, error } = await supabase.from('meal_plan_meals').select('day_order, meal_id').eq('meal_plan_id', planUuid)
    if (error) throw new Error(`Falha ao ler meal_plan_meals: ${error.message}`)
    rows = data ?? []
  }
  const mealIds = [...new Set(rows.map((r) => r.meal_id).filter(Boolean))]
  const kcalById = new Map<string, number>()
  if (mealIds.length > 0) {
    const { data: meals, error } = await supabase.from('meals').select('id, calories').in('id', mealIds)
    if (error) throw new Error(`Falha ao ler kcal das refeições: ${error.message}`)
    for (const m of meals ?? []) kcalById.set(m.id, Number(m.calories) || 0)
  }
  const below = daysBelowFloor(menuTotalsByDay(rows.map((r) => ({ day: r.day_order, kcal: kcalById.get(r.meal_id) }))), floor)
  if (below.length === 0) return { ok: true }
  return { ok: false, message: belowFloorReason(below, floor) + ' Ajuste o cardápio antes de salvar.', floor, days: below }
}

// Restrições do aluno no construtor (2026-10-17, decisão da Taina): recusa
// salvar prato que o aluno não pode receber. Mesmo critério do gerador -- a
// regra mora em ybytu_meals_incompatible / ybytu_forbidden_tokens (migração
// 20261017210000), que ybytu_match_meals também usa. Vale para todo aluno que
// tem este plano como atual (plano de catálogo pode servir a vários).
const PREFERENCE_LABEL_PTBR: Record<string, string> = {
  vegan: 'vegana', vegetarian: 'vegetariana', pescetarian: 'pescetariana',
}
async function checkStudentRestrictions(
  supabase: any,
  planUuid: string,
  slots: Array<{ meal_id: string }> | null,
): Promise<{ ok: true } | { ok: false; message: string; conflicts: unknown[] }> {
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, dietary_preference_id, dietary_restrictions_ids')
    .eq('current_meal_plan_id', planUuid)
  if (error) throw new Error(`Lookup de alunos do plano falhou: ${error.message}`)
  if (!students || students.length === 0) return { ok: true }

  let mealIds: string[]
  if (slots) {
    mealIds = [...new Set(slots.map((s) => s.meal_id).filter(Boolean))]
  } else {
    const { data, error: mErr } = await supabase.from('meal_plan_meals').select('meal_id').eq('meal_plan_id', planUuid)
    if (mErr) throw new Error(`Falha ao ler meal_plan_meals: ${mErr.message}`)
    mealIds = [...new Set<string>(((data ?? []) as any[]).map((r) => String(r.meal_id)))]
  }
  if (mealIds.length === 0) return { ok: true }

  const conflicts: Array<{ student_id: string; meal: string; tokens: string[]; preference: boolean }> = []
  const messages: string[] = []
  for (const st of students) {
    let pref = 'omnivore'
    if (st.dietary_preference_id) {
      const { data } = await supabase.from('dietary_preferences').select('dietary_preference_id').eq('id', st.dietary_preference_id).maybeSingle()
      pref = data?.dietary_preference_id ?? 'omnivore'
    }
    let restrictions: string[] = []
    const rIds = Array.isArray(st.dietary_restrictions_ids) ? st.dietary_restrictions_ids : []
    if (rIds.length > 0) {
      const { data } = await supabase.from('dietary_restrictions').select('dietary_restriction_id').in('id', rIds)
      restrictions = (data ?? []).map((r: any) => r.dietary_restriction_id)
    }
    const { data: bad, error: rpcErr } = await supabase.rpc('ybytu_meals_incompatible', {
      p_dietary_preference: pref, p_restriction_ids: restrictions, p_meal_uuids: mealIds,
    })
    if (rpcErr) throw new Error(`ybytu_meals_incompatible: ${rpcErr.message}`)
    for (const b of bad ?? []) {
      const tokens = (b.forbidden_tokens ?? []) as string[]
      conflicts.push({ student_id: st.id, meal: b.meal_name, tokens, preference: b.preference_conflict })
      const why = [
        ...(tokens.length ? [`contém ${[...new Set(tokens.map((t) => TOKEN_LABEL_PTBR[t] ?? t))].join(', ')}`] : []),
        ...(b.preference_conflict ? [`não serve para dieta ${PREFERENCE_LABEL_PTBR[pref] ?? pref}`] : []),
      ].join(' e ')
      messages.push(`"${b.meal_name}" (${why})`)
    }
  }
  if (conflicts.length === 0) return { ok: true }
  return {
    ok: false,
    message: `Prato incompatível com as restrições do aluno: ${[...new Set(messages)].join('; ')}. Troque o prato antes de salvar.`,
    conflicts,
  }
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) return json({ error: auth.reason }, auth.status, corsHeaders)

    if (!requireRole(auth.staff, 'nutricionista') && !requireRole(auth.staff, 'admin')) {
      return json({ error: 'role_required_nutricionista_or_admin' }, 403, corsHeaders)
    }

    const body = await req.json().catch(() => null)
    const action = body?.action

    if (action === 'lookups') {
      const [goals, mealTypes, dietaryPreferences, dietaryRestrictions] = await Promise.all([
        supabase.from('goals').select('id, goal_id, applicable_to, name_ptbr'),
        supabase.from('meal_types').select('id, meal_type_id, name_ptbr'),
        supabase.from('dietary_preferences').select('id, dietary_preference_id, name_ptbr'),
        supabase.from('dietary_restrictions').select('id, dietary_restriction_id, name_ptbr').eq('is_active', true),
      ])
      if (goals.error || mealTypes.error || dietaryPreferences.error || dietaryRestrictions.error) {
        throw new Error('Falha ao buscar lookups de meal_plans')
      }
      return json({
        goals: (goals.data ?? []).filter((g: any) => g.applicable_to !== 'training'),
        meal_types: mealTypes.data,
        dietary_preferences: dietaryPreferences.data,
        dietary_restrictions: dietaryRestrictions.data,
      }, 200, corsHeaders)
    }

    if (action === 'search_meals') {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      let query = supabase.from('meals').select('id, name_ptbr, meal_type, calories, protein_g, carbs_g, fat_g').eq('is_active', true).limit(30)
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return json({ meals: data }, 200, corsHeaders)
    }

    if (action === 'get') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data: plan, error } = await supabase.from('meal_plans').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!plan) return json({ error: 'not_found' }, 404, corsHeaders)

      const { data: slots, error: slotsErr } = await supabase
        .from('meal_plan_meals')
        .select('id, day_order, meal_order, meal_type_id, meal_id')
        .eq('meal_plan_id', id)
        .order('day_order', { ascending: true })
        .order('meal_order', { ascending: true })
      if (slotsErr) throw slotsErr

      const mealIds = [...new Set((slots ?? []).map((s: any) => s.meal_id))]
      const { data: meals, error: mealsErr } = mealIds.length
        ? await supabase.from('meals').select('id, name_ptbr, meal_type, calories, protein_g, carbs_g, fat_g').in('id', mealIds)
        : { data: [], error: null }
      if (mealsErr) throw mealsErr
      const mealById = new Map((meals ?? []).map((m: any) => [m.id, m]))

      return json({
        meal_plan: plan,
        slots: (slots ?? []).map((s: any) => ({ ...s, meal: mealById.get(s.meal_id) ?? null })),
      }, 200, corsHeaders)
    }

    if (action === 'list' || !action) {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      const includeInactive = body?.include_inactive === true

      let query = supabase.from('meal_plans').select('*').order('name_ptbr', { ascending: true })
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      if (!includeInactive) query = query.eq('is_active', true)

      const { data, error } = await query
      if (error) throw error
      return json({ meal_plans: data }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizePlan(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      if (Array.isArray(body?.slots) || payload.is_active === true) {
        const floorCheck = await checkSafetyFloor(supabase, null, Array.isArray(body?.slots) ? body.slots : [], payload.is_active === true)
        if (!floorCheck.ok) return json({ error: 'below_safety_floor', message: floorCheck.message, floor: floorCheck.floor, days: floorCheck.days }, 409, corsHeaders)
      }
      const { data, error } = await supabase.from('meal_plans').insert([payload]).select().single()
      if (error) throw error
      if (Array.isArray(body?.slots)) await replaceSlots(supabase, data.id, body.slots)
      return json({ meal_plan: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = sanitizePlan(body?.data ?? {})
      {
        const { data: current, error: curErr } = await supabase.from('meal_plans').select('is_active').eq('id', id).single()
        if (curErr) throw curErr
        const willBeActive = 'is_active' in payload ? payload.is_active === true : current.is_active === true
        const restrictionCheck = await checkStudentRestrictions(supabase, id, Array.isArray(body?.slots) ? body.slots : null)
        if (!restrictionCheck.ok) return json({ error: 'incompatible_with_student', message: restrictionCheck.message, conflicts: restrictionCheck.conflicts }, 409, corsHeaders)
        const floorCheck = await checkSafetyFloor(supabase, id, Array.isArray(body?.slots) ? body.slots : null, willBeActive)
        if (!floorCheck.ok) return json({ error: 'below_safety_floor', message: floorCheck.message, floor: floorCheck.floor, days: floorCheck.days }, 409, corsHeaders)
      }
      const { data, error } = await supabase.from('meal_plans').update(payload).eq('id', id).select().single()
      if (error) throw error
      if (Array.isArray(body?.slots)) await replaceSlots(supabase, id, body.slots)
      return json({ meal_plan: data }, 200, corsHeaders)
    }

    // Sem delete físico -- meal_plans tem is_active.
    if (action === 'set_active') {
      const id = typeof body?.id === 'string' ? body.id : ''
      const isActive = body?.is_active === true
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      if (isActive) {
        const floorCheck = await checkSafetyFloor(supabase, id, null, true)
        if (!floorCheck.ok) return json({ error: 'below_safety_floor', message: floorCheck.message, floor: floorCheck.floor, days: floorCheck.days }, 409, corsHeaders)
      }
      const { data, error } = await supabase.from('meal_plans').update({ is_active: isActive }).eq('id', id).select().single()
      if (error) throw error
      return json({ meal_plan: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-meal-plans error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
