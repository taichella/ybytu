import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// CRUD de `meals` (dashboard pro). Papel exigido: nutricionista ou admin.
// `ingredients_json` guarda [{id: food_XXX, qtd, unit}] -- `id` aqui é
// `foods.food_id` (código text), não o uuid. Ver buildPlanPayload.ts, que é
// quem consome esse shape pra montar o payload do usuário -- CREATE/UPDATE
// aqui precisam gravar exatamente esse formato, senão o plano do usuário
// quebra silenciosamente (ingrediente sem nome).
function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const WRITABLE_FIELDS = [
  'meal_id', 'name_ptbr', 'name_en', 'name_fr', 'meal_type', 'prep_time_min',
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'diet_tags_raw',
  'ingredients_json', 'instruction_ptbr', 'instruction_en', 'instruction_fr',
  'dietary_preference', 'restriction_tags', 'diet_tags', 'is_active',
]

function sanitizeWrite(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of WRITABLE_FIELDS) {
    if (key in data) out[key] = data[key]
  }
  return out
}

// Valida que todo `id` referenciado em ingredients_json existe em foods.food_id.
// Retorna null se ok, ou a lista de ids inválidos.
async function validateIngredients(supabase: any, ingredientsJson: unknown): Promise<string[] | null> {
  if (!Array.isArray(ingredientsJson) || ingredientsJson.length === 0) return null
  const ids = [...new Set(ingredientsJson.map((ing: any) => ing?.id).filter((id: unknown) => typeof id === 'string'))]
  if (ids.length === 0) return null
  const { data, error } = await supabase.from('foods').select('food_id').in('food_id', ids)
  if (error) throw new Error(`Falha ao validar ingredients_json contra foods: ${error.message}`)
  const found = new Set((data ?? []).map((r: any) => r.food_id))
  const missing = ids.filter((id) => !found.has(id))
  return missing.length > 0 ? missing : null
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
      const [mealTypes, dietTags, dietaryRestrictions] = await Promise.all([
        supabase.from('meal_types').select('id, meal_type_id, name_ptbr, name_en, name_fr'),
        supabase.from('diet_tags').select('id, diet_tag_id, name_ptbr, name_en, name_fr, category'),
        supabase.from('dietary_restrictions').select('id, dietary_restriction_id, name_ptbr, name_en, name_fr').eq('is_active', true),
      ])
      if (mealTypes.error || dietTags.error || dietaryRestrictions.error) {
        throw new Error('Falha ao buscar lookups de meals')
      }
      return json({
        meal_types: mealTypes.data,
        diet_tags: dietTags.data,
        dietary_restrictions: dietaryRestrictions.data,
      }, 200, corsHeaders)
    }

    if (action === 'search_foods') {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      if (search.length < 2) return json({ foods: [] }, 200, corsHeaders)
      const { data, error } = await supabase
        .from('foods')
        .select('food_id, name_ptbr, calories_per_unit, protein_g, carbs_g, fat_g, food_measurement_unit_id')
        .ilike('name_ptbr', `%${search}%`)
        .limit(30)
      if (error) throw error
      return json({ foods: data }, 200, corsHeaders)
    }

    if (action === 'get') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data, error } = await supabase.from('meals').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!data) return json({ error: 'not_found' }, 404, corsHeaders)
      return json({ meal: data }, 200, corsHeaders)
    }

    if (action === 'list' || !action) {
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      const mealType = typeof body?.meal_type === 'string' ? body.meal_type : ''
      const includeInactive = body?.include_inactive === true

      let query = supabase.from('meals').select('*').order('name_ptbr', { ascending: true })
      if (search) query = query.ilike('name_ptbr', `%${search}%`)
      if (mealType) query = query.eq('meal_type', mealType)
      if (!includeInactive) query = query.eq('is_active', true)

      const { data, error } = await query
      if (error) throw error
      return json({ meals: data }, 200, corsHeaders)
    }

    if (action === 'create') {
      const payload = sanitizeWrite(body?.data ?? {})
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)
      const missing = await validateIngredients(supabase, payload.ingredients_json)
      if (missing) return json({ error: 'invalid_ingredient_food_ids', missing }, 400, corsHeaders)

      const { data, error } = await supabase.from('meals').insert([payload]).select().single()
      if (error) throw error
      return json({ meal: data }, 201, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = sanitizeWrite(body?.data ?? {})
      const missing = await validateIngredients(supabase, payload.ingredients_json)
      if (missing) return json({ error: 'invalid_ingredient_food_ids', missing }, 400, corsHeaders)

      const { data, error } = await supabase.from('meals').update(payload).eq('id', id).select().single()
      if (error) throw error
      return json({ meal: data }, 200, corsHeaders)
    }

    // Sem delete físico -- meals tem is_active, então "apagar" é sempre um
    // update de is_active:false por aqui (mesma trilha de auditoria/role).
    if (action === 'set_active') {
      const id = typeof body?.id === 'string' ? body.id : ''
      const isActive = body?.is_active === true
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const { data, error } = await supabase.from('meals').update({ is_active: isActive }).eq('id', id).select().single()
      if (error) throw error
      return json({ meal: data }, 200, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-meals error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
