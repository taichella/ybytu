import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// CRUD de `training_plans` + `training_plan_exercises` (dashboard pro).
// Papel exigido: personal ou admin.
//
// ATENCAO -- os 7 moldes ativos (tr_201-207) sao a fonte de onde
// ybytu-generate-training-plan extrai os SPLIT_PATTERNS, via query LIVE em
// training_plan_exercises (sem cache/snapshot). Editar um slot de molde
// muda o formato de plano de todo usuario novo dali pra frente, pra ate 4
// objetivos ao mesmo tempo (conditioning/health_routine emprestam a
// estrutura do weight_loss). Decisao 2026-08-06: nao bloquear a edicao
// (personal/admin precisam poder corrigir), mas:
//   1. Grava snapshot em training_plan_exercises_history ANTES de qualquer
//      UPDATE nos slots de um molde -- da rollback sem travar quem edita.
//   2. Bloqueia desativar (is_active:false) a `training_plans` row de um
//      molde -- o MOLDE_BY_GOAL do gerador tem esses 7 IDs hardcoded,
//      desativar quebra a geracao silenciosamente.
//
// `training_plans.goals_ids` / `exercise_environments_ids` /
// `exercise_equipment_ids` sao TEXT (nao array de verdade), mas o valor
// gravado É a sintaxe de array do Postgres serializada, ex: `{"gym"}`,
// `{"dumbbells","machines"}` -- confirmado lendo linhas reais de tr_201-207.
// Os helpers pgArrayToList/listToPgArray abaixo fazem essa conversão --
// qualquer escrita nesses 3 campos PRECISA passar por listToPgArray, senão
// grava texto num formato que a query `training_plan_id IN (...)` do
// gerador não espera.
const MOLDE_IDS = new Set(['tr_201', 'tr_202', 'tr_203', 'tr_204', 'tr_205', 'tr_206', 'tr_207'])

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function pgArrayToList(raw: string | null): string[] {
  if (!raw) return []
  const inner = raw.replace(/^\{|\}$/g, '')
  if (!inner) return []
  return inner.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
}

function listToPgArray(list: unknown): string {
  if (!Array.isArray(list)) return '{}'
  return '{' + list.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',') + '}'
}

const PLAN_WRITABLE_FIELDS = [
  'training_plan_id', 'name_ptbr', 'name_en', 'name_fr',
  'goals_ids', 'exercise_environments_ids', 'exercise_equipment_ids', 'exercise_level_id',
  'days_per_week', 'duration_minutes', 'instruction_ptbr', 'instruction_en', 'instruction_fr',
  'is_active', 'caution_warnings',
]

// Recebe listas JS pros 3 campos pseudo-array e converte pro formato Postgres
// antes de gravar; os demais campos passam direto.
function sanitizePlan(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of PLAN_WRITABLE_FIELDS) {
    if (!(key in data)) continue
    if (key === 'goals_ids' || key === 'exercise_environments_ids' || key === 'exercise_equipment_ids') {
      out[key] = listToPgArray(data[key])
    } else {
      out[key] = data[key]
    }
  }
  return out
}

async function replaceSlots(supabase: any, planBusinessId: string, slots: unknown, changedBy: string) {
  if (!Array.isArray(slots)) return

  if (MOLDE_IDS.has(planBusinessId)) {
    const { data: existingRows, error: existingErr } = await supabase
      .from('training_plan_exercises')
      .select('*')
      .eq('training_plan_id', planBusinessId)
    if (existingErr) throw new Error(`Falha ao ler slots atuais do molde pra snapshot: ${existingErr.message}`)
    if (existingRows && existingRows.length > 0) {
      const historyRows = existingRows.map((row: any) => ({
        training_plan_id: planBusinessId,
        exercise_row_id: row.id,
        snapshot: row,
        changed_by: changedBy,
      }))
      const { error: histErr } = await supabase.from('training_plan_exercises_history').insert(historyRows)
      if (histErr) throw new Error(`Falha ao gravar snapshot de auditoria do molde: ${histErr.message}`)
    }
  }

  const { error: delErr } = await supabase.from('training_plan_exercises').delete().eq('training_plan_id', planBusinessId)
  if (delErr) throw new Error(`Falha ao limpar training_plan_exercises: ${delErr.message}`)
  if (slots.length === 0) return

  const rows = slots.map((s: any) => ({
    training_plan_id: planBusinessId,
    exercise_id: s.exercise_id,
    exercise_order: s.exercise_order,
    sets: s.sets,
    reps: s.reps,
    rep_type_id: s.rep_type_id ?? null,
    rest_seconds: s.rest_seconds ?? null,
    cadence_eccentric: s.cadence_eccentric ?? null,
    cadence_isometric_bottom: s.cadence_isometric_bottom ?? null,
    cadence_concentric: s.cadence_concentric ?? null,
    cadence_isometric_top: s.cadence_isometric_top ?? null,
    day_number: s.day_number ?? null,
    order_within_day: s.order_within_day ?? null,
  }))
  const { error: insErr } = await supabase.from('training_plan_exercises').insert(rows)
  if (insErr) throw new Error(`Falha ao gravar training_plan_exercises: ${insErr.message}`)
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

    if (!requireRole(auth.staff, 'personal') && !requireRole(auth.staff, 'admin')) {
      return json({ error: 'role_required_personal_or_admin' }, 403, corsHeaders)
    }

    const body = await req.json().catch(() => null)
    const action = body?.action

    if (action === 'lookups') {
      const [goals, environments, equipments, levels] = await Promise.all([
        supabase.from('goals').select('id, goal_id, applicable_to, name_ptbr'),
        supabase.from('exercise_environment').select('id, exercise_environment_id, name_ptbr'),
        supabase.from('exercise_equipments').select('id, exercise_equipment_id, name_ptbr'),
        supabase.from('exercise_levels').select('id, exercise_level_id, name_ptbr'),
      ])
      if (goals.error || environments.error || equipments.error || levels.error) {
        throw new Error('Falha ao buscar lookups de trainings')
      }
      return json({
        goals: (goals.data ?? []).filter((g: any) => g.applicable_to !== 'nutrition'),
        exercise_environments: environments.data,
        exercise_equipments: equipments.data,
        exercise_levels: levels.data,
      }, 200, corsHeaders)
    }

    if (action === 'search_exercises') {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      let query = supabase.from('exercises').select('id, exercise_id, name_ptbr, exercise_level_id').limit(30)
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return json({ exercises: data }, 200, corsHeaders)
    }

    if (action === 'get') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data: plan, error } = await supabase.from('training_plans').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!plan) return json({ error: 'not_found' }, 404, corsHeaders)

      const { data: slots, error: slotsErr } = await supabase
        .from('training_plan_exercises')
        .select('*')
        .eq('training_plan_id', plan.training_plan_id)
        .order('day_number', { ascending: true })
        .order('order_within_day', { ascending: true })
      if (slotsErr) throw slotsErr

      const exerciseIds = [...new Set((slots ?? []).map((s: any) => s.exercise_id))]
      const { data: exercises, error: exErr } = exerciseIds.length
        ? await supabase.from('exercises').select('id, exercise_id, name_ptbr').in('exercise_id', exerciseIds)
        : { data: [], error: null }
      if (exErr) throw exErr
      const exerciseByCode = new Map((exercises ?? []).map((e: any) => [e.exercise_id, e]))

      return json({
        training_plan: {
          ...plan,
          goals_ids: pgArrayToList(plan.goals_ids),
          exercise_environments_ids: pgArrayToList(plan.exercise_environments_ids),
          exercise_equipment_ids: pgArrayToList(plan.exercise_equipment_ids),
        },
        is_molde: MOLDE_IDS.has(plan.training_plan_id),
        slots: (slots ?? []).map((s: any) => ({ ...s, exercise: exerciseByCode.get(s.exercise_id) ?? null })),
      }, 200, corsHeaders)
    }

    if (action === 'list' || !action) {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      const includeInactive = body?.include_inactive === true

      let query = supabase.from('training_plans').select('*').order('name_ptbr', { ascending: true })
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      if (!includeInactive) query = query.eq('is_active', true)

      const { data, error } = await query
      if (error) throw error
      return json({
        training_plans: (data ?? []).map((p: any) => ({
          ...p,
          goals_ids: pgArrayToList(p.goals_ids),
          exercise_environments_ids: pgArrayToList(p.exercise_environments_ids),
          exercise_equipment_ids: pgArrayToList(p.exercise_equipment_ids),
          is_molde: MOLDE_IDS.has(p.training_plan_id),
        })),
      }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizePlan(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      if (!payload.training_plan_id) return json({ error: 'missing_training_plan_id' }, 400, corsHeaders)
      // Ninguem cria um NOVO molde por aqui -- os 7 codigos sao fixos no
      // gerador. Se alguem tentar reusar um desses codigos, bloqueia.
      if (MOLDE_IDS.has(payload.training_plan_id as string)) {
        return json({ error: 'training_plan_id_reserved_for_molde' }, 400, corsHeaders)
      }

      const { data, error } = await supabase.from('training_plans').insert([payload]).select().single()
      if (error) throw error
      if (Array.isArray(body?.slots)) await replaceSlots(supabase, data.training_plan_id, body.slots, auth.staff.userId)
      return json({ training_plan: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)

      const { data: existing, error: existingErr } = await supabase.from('training_plans').select('training_plan_id').eq('id', id).maybeSingle()
      if (existingErr) throw existingErr
      if (!existing) return json({ error: 'not_found' }, 404, corsHeaders)

      const payload = sanitizePlan(body?.data ?? {})
      if (MOLDE_IDS.has(existing.training_plan_id) && payload.is_active === false) {
        return json({ error: 'molde_deactivation_blocked' }, 403, corsHeaders)
      }
      delete payload.training_plan_id // código de negócio dos moldes nunca muda por update

      const { data, error } = await supabase.from('training_plans').update(payload).eq('id', id).select().single()
      if (error) throw error
      if (Array.isArray(body?.slots)) await replaceSlots(supabase, existing.training_plan_id, body.slots, auth.staff.userId)
      return json({ training_plan: data }, 200, corsHeaders)
    }

    if (action === 'set_active') {
      const id = typeof body?.id === 'string' ? body.id : ''
      const isActive = body?.is_active === true
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)

      const { data: existing, error: existingErr } = await supabase.from('training_plans').select('training_plan_id').eq('id', id).maybeSingle()
      if (existingErr) throw existingErr
      if (!existing) return json({ error: 'not_found' }, 404, corsHeaders)
      if (MOLDE_IDS.has(existing.training_plan_id) && !isActive) {
        return json({ error: 'molde_deactivation_blocked' }, 403, corsHeaders)
      }

      const { data, error } = await supabase.from('training_plans').update({ is_active: isActive }).eq('id', id).select().single()
      if (error) throw error
      return json({ training_plan: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-trainings error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
