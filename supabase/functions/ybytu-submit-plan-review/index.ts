import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const auth = await resolveStaffFromRequest(req, supabase)
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: auth.reason }),
        { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.userId || !body.role) {
       return new Response(
        JSON.stringify({ error: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // validate role request
    if (body.role !== 'personal' && body.role !== 'nutricionista') {
       return new Response(
        JSON.stringify({ error: 'invalid_role_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!requireRole(auth.staff, body.role)) {
       return new Response(
        JSON.stringify({ error: 'unauthorized_role_action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: upsertError } = await supabase
      .from('plan_reviews')
      .upsert(
        {
          user_id: body.userId,
          role: body.role,
          reviewer_name: auth.staff.fullName,
          reviewer_credential: body.reviewer_credential || null,
          note_ptbr: body.note_ptbr || null,
          training_plan_id: body.training_plan_id || null,
          meal_plan_id: body.meal_plan_id || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id, role' }
      )

    if (upsertError) throw new Error(`Plan review upsert error: ${upsertError.message}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-submit-plan-review error:', err)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
