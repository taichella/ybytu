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
  'food_id', 'name_ptbr', 'name_en', 'name_fr', 'food_group_id', 'food_source_id',
  'food_type_id', 'brand', 'food_preparation_method_id', 'quantity', 'food_measurement_unit_id',
  'correction_factor', 'cooking_factor', 'calories_per_unit', 'protein_g', 'carbs_g', 'fat_g',
  'fiber_g', 'sugar_g', 'fat_sat_g', 'fat_trans_g', 'cholesterol_mg', 'sodium_mg', 'calcium_mg',
  'iron_mg', 'potassium_mg', 'magnesium_mg', 'vitamins_ids', 'minerals_ids', 'dietary_restrictions_ids',
  'diet_tags_ids', 'functional_tags_ids', 'tags_ids', 'food_facts_source_id', 'url_image', 'dietary_preference'
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

    if (!requireRole(auth.staff, 'nutricionista') && !requireRole(auth.staff, 'admin')) {
      return json({ error: 'role_required_nutricionista_or_admin' }, 403, corsHeaders)
    }

    const body = await req.json().catch(() => null)
    const action = body?.action

    if (action === 'lookups') {
      const [groups, sources, types, prepMethods, units, dietTags, functionalTags, generalTags] = await Promise.all([
        supabase.from('food_groups').select('id, food_group_id, name_ptbr, name_en, name_fr'),
        supabase.from('food_sources').select('id, food_source_id, name_ptbr, name_en, name_fr'),
        supabase.from('food_types').select('id, food_type_id, name_ptbr, name_en, name_fr'),
        supabase.from('food_preparation_methods').select('id, food_preparation_method_id, name_ptbr, name_en, name_fr'),
        supabase.from('food_measurement_units').select('id, food_measurement_unit_id, name_ptbr, name_en, name_fr'),
        supabase.from('diet_tags').select('id, diet_tag_id, name_ptbr, name_en, name_fr'),
        supabase.from('functional_tags').select('id, functional_tag_id, name_ptbr, name_en, name_fr'),
        supabase.from('tags').select('id, tag_id, name_ptbr, name_en, name_fr')
      ])
      return json({
        food_groups: groups.data,
        food_sources: sources.data,
        food_types: types.data,
        food_preparation_methods: prepMethods.data,
        food_measurement_units: units.data,
        diet_tags: dietTags.data,
        functional_tags: functionalTags.data,
        tags: generalTags.data
      }, 200, corsHeaders)
    }

    if (action === 'get') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!data) return json({ error: 'not_found' }, 404, corsHeaders)
      return json({ food: data }, 200, corsHeaders)
    }

    if (action === 'list' || !action) {
      let query = supabase.from('foods').select('*').order('name_ptbr', { ascending: true })

      const { data, error } = await query
      if (error) throw error
      return json({ foods: data }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizeWrite(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      if (!payload.food_id) return json({ error: 'missing_food_id' }, 400, corsHeaders)

      const { data, error } = await supabase.from('foods').insert([payload]).select().single()
      if (error) throw error
      return json({ food: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = sanitizeWrite(body?.data ?? {})

      const { data, error } = await supabase.from('foods').update(payload).eq('id', id).select().single()
      if (error) throw error
      return json({ food: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-foods error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
