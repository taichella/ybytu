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

const WRITABLE_FIELDS_TAGS = [
  'tag_id', 'name_ptbr', 'name_en', 'name_fr'
]
const WRITABLE_FIELDS_FUNCTIONAL = [
  'functional_tag_id', 'name_ptbr', 'name_en', 'name_fr'
]
const WRITABLE_FIELDS_DIET = [
  'diet_tag_id', 'name_ptbr', 'name_en', 'name_fr', 'category', 'description_ptbr', 'sort_order'
]

function sanitizeWrite(data: Record<string, unknown>, fields: string[]) {
  const out: Record<string, unknown> = {}
  for (const key of fields) {
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
    const type = body?.type || 'gerais' // gerais | funcionais | dieta

    if (action === 'list' || !action) {
      if (type === 'gerais') {
         const { data, error } = await supabase.from('tags').select('*').order('name_ptbr', { ascending: true })
         if (error) throw error
         return json({ tags: data }, 200, corsHeaders)
      } else if (type === 'funcionais') {
         const { data, error } = await supabase.from('functional_tags').select('*').order('name_ptbr', { ascending: true })
         if (error) throw error
         return json({ tags: data }, 200, corsHeaders)
      } else if (type === 'dieta') {
         const { data, error } = await supabase.from('diet_tags').select('*').order('sort_order', { ascending: true })
         if (error) throw error
         return json({ tags: data }, 200, corsHeaders)
      }
      return json({ error: 'invalid_type' }, 400, corsHeaders)
    }

    if (action === 'create') {
      const payload = body?.data ?? {}
      if (!payload.name_ptbr) return json({ error: 'missing_name_ptbr' }, 400, corsHeaders)

      if (type === 'gerais') {
          if (!payload.tag_id) return json({ error: 'missing_id' }, 400, corsHeaders)
          const dataToInsert = sanitizeWrite(payload, WRITABLE_FIELDS_TAGS)
          const { data, error } = await supabase.from('tags').insert([dataToInsert]).select().single()
          if (error) throw error
          return json({ tag: data }, 201, corsHeaders)
      } else if (type === 'funcionais') {
          if (!payload.functional_tag_id) return json({ error: 'missing_id' }, 400, corsHeaders)
          const dataToInsert = sanitizeWrite(payload, WRITABLE_FIELDS_FUNCTIONAL)
          const { data, error } = await supabase.from('functional_tags').insert([dataToInsert]).select().single()
          if (error) throw error
          return json({ tag: data }, 201, corsHeaders)
      } else if (type === 'dieta') {
          if (!payload.diet_tag_id) return json({ error: 'missing_id' }, 400, corsHeaders)
          const dataToInsert = sanitizeWrite(payload, WRITABLE_FIELDS_DIET)
          const { data, error } = await supabase.from('diet_tags').insert([dataToInsert]).select().single()
          if (error) throw error
          return json({ tag: data }, 201, corsHeaders)
      }
      return json({ error: 'invalid_type' }, 400, corsHeaders)
    }

    if (action === 'update') {
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) return json({ error: 'missing_id' }, 400, corsHeaders)
      const payload = body?.data ?? {}

      if (type === 'gerais') {
          const dataToUpdate = sanitizeWrite(payload, WRITABLE_FIELDS_TAGS)
          const { data, error } = await supabase.from('tags').update(dataToUpdate).eq('id', id).select().single()
          if (error) throw error
          return json({ tag: data }, 200, corsHeaders)
      } else if (type === 'funcionais') {
          const dataToUpdate = sanitizeWrite(payload, WRITABLE_FIELDS_FUNCTIONAL)
          const { data, error } = await supabase.from('functional_tags').update(dataToUpdate).eq('id', id).select().single()
          if (error) throw error
          return json({ tag: data }, 200, corsHeaders)
      } else if (type === 'dieta') {
          const dataToUpdate = sanitizeWrite(payload, WRITABLE_FIELDS_DIET)
          const { data, error } = await supabase.from('diet_tags').update(dataToUpdate).eq('id', id).select().single()
          if (error) throw error
          return json({ tag: data }, 200, corsHeaders)
      }
      return json({ error: 'invalid_type' }, 400, corsHeaders)
    }

    return json({ error: 'unknown_action' }, 400, corsHeaders)
  } catch (err) {
    console.error('ybytu-admin-tags error:', err)
    return json({ error: 'internal_error' }, 500, corsHeadersFor(req))
  }
})
