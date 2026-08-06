import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// CRUD da base curada de exercícios (dashboard pro). Toda leitura e escrita
// passa por aqui -- o client nunca fala direto com a tabela `exercises`
// (RLS é deny-all lá, ver [[project_exercises_rls_deny_all_intentional]]).
// Papel exigido: personal ou admin (treino), pros dois lados -- não só na
// escrita -- porque o catálogo completo com condições de saúde não é algo
// que qualquer staff deveria listar.
//
// Sem delete: `exercises` não tem `is_active` (ver docs/SCHEMA.md), então
// não existe soft-delete possível aqui. DELETE físico quebraria
// training_plan_exercises que referenciam o exercise_id em planos já
// gerados -- fica bloqueado até existir uma coluna is_active de verdade.
const VALID_LEVELS_TABLE = 'exercise_levels'

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Campos que o client pode escrever -- nunca aceita `id` do body (gerado
// pelo banco) nem qualquer coluna fora desta lista.
const WRITABLE_FIELDS = [
  'exercise_id', 'name_ptbr', 'name_en', 'name_fr',
  'instruction_ptbr', 'instruction_en', 'instruction_fr',
  'muscle_groups_ids', 'exercise_equipments_ids', 'exercise_level_id',
  'avoid_health_conditions_ids', 'caution_health_condition_ids',
  'calories', 'image_url', 'video_url',
]

function sanitizeWrite(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of WRITABLE_FIELDS) {
    if (key in data) out[key] = data[key]
  }
  return out
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
      const [muscleGroups, equipments, levels, healthConditions] = await Promise.all([
        supabase.from('muscle_groups').select('id, muscle_group_id, name_ptbr, name_en, name_fr'),
        supabase.from('exercise_equipments').select('id, exercise_equipment_id, name_ptbr, name_en, name_fr'),
        supabase.from(VALID_LEVELS_TABLE).select('id, exercise_level_id, name_ptbr, name_en, name_fr'),
        supabase.from('health_conditions').select('id, health_condition_id, name_ptbr, name_en, name_fr'),
      ])
      if (muscleGroups.error || equipments.error || levels.error || healthConditions.error) {
        throw new Error('Falha ao buscar lookups de exercises')
      }
      return json({
        muscle_groups: muscleGroups.data,
        exercise_equipments: equipments.data,
        exercise_levels: levels.data,
        health_conditions: healthConditions.data,
      }, 200, corsHeaders)
    }

    if (action === 'get') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data, error } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!data) return json({ error: 'not_found' }, 404, corsHeaders)
      return json({ exercise: data }, 200, corsHeaders)
    }

    if (action === 'list' || !action) {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      const levelId = typeof body?.exercise_level_id === 'string' ? body.exercise_level_id : ''
      const muscleGroupId = typeof body?.muscle_group_id === 'string' ? body.muscle_group_id : ''
      const equipmentId = typeof body?.exercise_equipment_id === 'string' ? body.exercise_equipment_id : ''

      let query = supabase.from('exercises').select('*').order('name_ptbr', { ascending: true })
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      if (levelId) query = query.eq('exercise_level_id', levelId)
      if (muscleGroupId) query = query.contains('muscle_groups_ids', [muscleGroupId])
      if (equipmentId) query = query.contains('exercise_equipments_ids', [equipmentId])

      const { data, error } = await query
      if (error) throw error
      return json({ exercises: data }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizeWrite(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      const { data, error } = await supabase.from('exercises').insert([payload]).select().single()
      if (error) throw error
      return json({ exercise: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = sanitizeWrite(body?.data ?? {})
      const { data, error } = await supabase.from('exercises').update(payload).eq('id', id).select().single()
      if (error) throw error
      return json({ exercise: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-exercises error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
