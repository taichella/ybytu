import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const WRITABLE_FIELDS = [
  'exercise_equipment_id', 'name_ptbr', 'name_en', 'name_fr'
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

    if (!requireRole(auth.staff, 'admin')) {
      return json({ error: 'role_required_admin' }, 403, corsHeaders)
    }

    const body = await req.json().catch(() => null)
    const action = body?.action

    if (action === 'list' || !action) {
      const { data: equipments, error: eqError } = await supabase.from('exercise_equipments').select('*').order('name_ptbr', { ascending: true })
      if (eqError) throw eqError

      // Conta exercícios para cada equipamento usando a tabela exercises (contains muscle_groups_ids)
      // Como não podemos fazer um count agregado em jsonb facilmente com supabase sdk, fazemos local
      const { data: exercises, error: exError } = await supabase.from('exercises').select('exercise_equipments_ids')
      if (exError) throw exError

      const counts: Record<string, number> = {}
      if (exercises) {
          for (const ex of exercises) {
              if (ex.exercise_equipments_ids) {
                  for (const eqId of ex.exercise_equipments_ids) {
                      counts[eqId] = (counts[eqId] || 0) + 1
                  }
              }
          }
      }

      // exercises.exercise_equipments_ids guarda o slug (exercise_equipment_id,
      // ex: 'dumbbells'), não o uuid -- contar por eq.id sempre dava 0.
      const result = equipments.map(eq => ({
          ...eq,
          count: counts[eq.exercise_equipment_id] || 0
      }))

      return json({ equipments: result }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizeWrite(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      if (!payload.exercise_equipment_id) return json({ error: 'missing_id' }, 400, corsHeaders)

      const { data, error } = await supabase.from('exercise_equipments').insert([payload]).select().single()
      if (error) throw error
      return json({ equipment: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = sanitizeWrite(body?.data ?? {})

      const { data, error } = await supabase.from('exercise_equipments').update(payload).eq('id', id).select().single()
      if (error) throw error
      return json({ equipment: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-equipments error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
