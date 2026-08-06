import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildPlanPayload } from '../_shared/buildPlanPayload.ts'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// PORTA DE STAFF — recebe { userId } (não token), autoriza pela sessão do
// caller (precisa ser staff ativo, qualquer papel — a leitura do plano não
// distingue personal de nutricionista, só a ESCRITA do parecer distingue,
// isso é em ybytu-submit-plan-review). Irmã de ybytu-get-plan-payload
// (porta pública por token) — ver comentário lá pro motivo de serem
// functions separadas em vez de uma só com dois modos.
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
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
    const userId = typeof body?.userId === 'string' ? body.userId : ''
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'missing_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = await buildPlanPayload(supabase, userId)

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-get-plan-for-staff error:', err)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
