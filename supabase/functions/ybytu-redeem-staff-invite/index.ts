import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

// ─── Validação do token de convite ─────────────────────────────────────────
async function resolveInvite(
  supabase: ReturnType<typeof createClient>,
  token: string,
): Promise<
  | { ok: true; invite: { id: string; email: string; role: string; created_by: string } }
  | { ok: false; status: number; reason: string }
> {
  const { data, error } = await supabase
    .from('staff_invites')
    .select('id, email, role, created_by, expires_at, used_at, revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (error) return { ok: false, status: 500, reason: 'invite_lookup_failed' }
  if (!data) return { ok: false, status: 404, reason: 'invite_not_found' }
  if (data.revoked_at) return { ok: false, status: 410, reason: 'invite_revoked' }
  if (data.used_at) return { ok: false, status: 410, reason: 'invite_already_used' }
  if (new Date(data.expires_at) < new Date()) return { ok: false, status: 410, reason: 'invite_expired' }

  return {
    ok: true,
    invite: { id: data.id, email: data.email, role: data.role, created_by: data.created_by },
  }
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token : ''
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'missing_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resolved = await resolveInvite(supabase, token)
    if (!resolved.ok) {
      return new Response(
        JSON.stringify({ error: resolved.reason }),
        { status: resolved.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const { invite } = resolved

    if (!fullName) {
      return new Response(
        JSON.stringify({ error: 'missing_full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'weak_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Cria a conta via Admin API -- e-mail vem SEMPRE do convite, nunca do
    // corpo da requisição (fecha qualquer tentativa de resgatar o convite de
    // outra pessoa com um e-mail diferente). Se o e-mail já tiver conta, a
    // Auth API rejeita e devolvemos um erro claro em vez de genérico.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      const msg = (createError.message || '').toLowerCase()
      const isDuplicate = msg.includes('already been registered') || msg.includes('already exists') || msg.includes('already registered')
      if (isDuplicate) {
        return new Response(
          JSON.stringify({
            error: 'account_exists',
            message: 'Essa conta já existe — peça a um admin para liberar o papel.',
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      console.error(createError)
      return new Response(
        JSON.stringify({ error: 'account_creation_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const userId = created.user.id

    const { error: staffError } = await supabase
      .from('staff')
      .insert({ user_id: userId, full_name: fullName, created_by: invite.created_by })

    if (staffError) {
      console.error(staffError)
      // Best-effort: não deixa um usuário Auth órfão (criado, sem staff row).
      await supabase.auth.admin.deleteUser(userId).catch(() => {})
      return new Response(
        JSON.stringify({ error: 'staff_insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { error: roleError } = await supabase
      .from('staff_roles')
      .insert({ user_id: userId, role: invite.role, granted_by: invite.created_by })

    if (roleError) {
      console.error(roleError)
      await supabase.auth.admin.deleteUser(userId).catch(() => {})
      return new Response(
        JSON.stringify({ error: 'role_insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    await supabase
      .from('staff_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id)

    return new Response(
      JSON.stringify({ ok: true }),
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
