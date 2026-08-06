import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authCheck = await resolveStaffFromRequest(req, supabaseClient)
    if (!authCheck.ok) {
      return new Response(JSON.stringify({ error: authCheck.reason }), {
        status: authCheck.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { staff } = authCheck
    const isNutricionista = requireRole(staff, 'nutricionista')
    const isAdmin = requireRole(staff, 'admin')

    if (!isNutricionista && !isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden_role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      const { data, error } = await serviceRoleClient
        .from('foods')
        .select('*')

      if (error) throw error

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      // Basic insert
      const { data, error } = await serviceRoleClient
        .from('foods')
        .insert([body])
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    if (req.method === 'PUT') {
        const body = await req.json()
        const { id, ...updates } = body
        if (!id) throw new Error('Missing id')

        const { data, error } = await serviceRoleClient
            .from('foods')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    if (req.method === 'DELETE') {
        // foods does not have is_active, so delete throws error as requested in the instructions
        return new Response(JSON.stringify({ error: 'destructive_delete_not_allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405, // Method Not Allowed for destructive operations without soft delete
        })
    }

    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
