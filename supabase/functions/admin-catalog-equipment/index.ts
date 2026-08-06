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
    const isAdmin = requireRole(staff, 'admin')

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden_role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      const { data: equipments, error: eqError } = await serviceRoleClient
        .from('exercise_equipments')
        .select('*')

      if (eqError) throw eqError

      // Compute the count of exercises that use each equipment
      // exercises.exercise_equipments_ids is of type text[]
      const { data: exercises, error: exError } = await serviceRoleClient
        .from('exercises')
        .select('exercise_equipments_ids')

      if (exError) throw exError

      const enrichedData = equipments.map((eq: any) => {
        let count = 0;
        // The equipment id in exercise_equipments is stored in 'exercise_equipment_id' column, not 'id'
        const targetEqId = eq.exercise_equipment_id;

        if (targetEqId) {
            exercises.forEach((ex: any) => {
                if (Array.isArray(ex.exercise_equipments_ids) && ex.exercise_equipments_ids.includes(targetEqId)) {
                    count++;
                }
            });
        }

        return { ...eq, count };
      })

      return new Response(JSON.stringify({ data: enrichedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await serviceRoleClient
        .from('exercise_equipments')
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
            .from('exercise_equipments')
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
        // exercise_equipments does not have is_active, destructive delete throws 405
        return new Response(JSON.stringify({ error: 'destructive_delete_not_allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
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
