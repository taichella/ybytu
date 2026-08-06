import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildPlanPayload } from '../_shared/buildPlanPayload.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// PORTA PÚBLICA — resolve um token de /plano/<token>, sem sessão nenhuma.
// A lógica de montagem do payload em si mora em _shared/buildPlanPayload.ts,
// compartilhada com ybytu-get-plan-for-staff (porta de staff autenticado).
// Decisão explícita: as duas portas ficam em functions separadas, cada uma
// só sabe resolver SEU jeito de autorização — nunca os dois num branch só
// (dado de saúde, não vale o risco de um caminho vazar pro outro). Ver
// [[project_staff_role_system_design]].

// ─── Validação do token ────────────────────────────────────────────────────────
async function resolveToken(
  supabase: ReturnType<typeof createClient>,
  token: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; reason: string }> {
  const { data, error } = await supabase
    .from('plan_share_tokens')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (error) return { ok: false, status: 500, reason: 'token_lookup_failed' }
  if (!data) return { ok: false, status: 404, reason: 'token_not_found' }
  if (data.revoked_at) return { ok: false, status: 410, reason: 'token_revoked' }
  if (new Date(data.expires_at) < new Date()) return { ok: false, status: 410, reason: 'token_expired' }

  // Best-effort: não bloqueia a resposta se o update de last_accessed_at falhar.
  await supabase
    .from('plan_share_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', data.id)

  return { ok: true, userId: data.user_id as string }
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const tokenResult = await resolveToken(supabase, token)
    if (!tokenResult.ok) {
      return new Response(JSON.stringify({ error: tokenResult.reason }), {
        status: tokenResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await buildPlanPayload(supabase, tokenResult.userId)

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-get-plan-payload error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
