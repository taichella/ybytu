import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'

const corsHeaders = {
  // DÉBITO pré-lançamento: restringir à(s) origem(ns) do frontend antes do
  // go-live — mesmo débito já registrado em ybytu-generate-training-plan.
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

    const result = await resolveStaffFromRequest(req, supabase)

    if (!result.ok) {
      if (result.reason === 'missing_token' || result.reason === 'invalid_token') {
        return new Response(
          JSON.stringify({ error: result.reason }),
          { status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      // not_staff / no_active_roles / lookup falhou -- não é erro do caller,
      // é o estado normal de "usuário logado que não é staff" (a maioria de
      // quem tem sessão válida no app não é). 200 + isStaff:false, o caller
      // (Login.jsx / DashboardLayout) decide o que fazer.
      return new Response(
        JSON.stringify({ isStaff: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        isStaff: true,
        fullName: result.staff.fullName,
        roles: result.staff.roles,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
