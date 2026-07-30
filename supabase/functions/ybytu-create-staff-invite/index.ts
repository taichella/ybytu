import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'

const corsHeaders = {
  // DÉBITO pré-lançamento: restringir à(s) origem(ns) do frontend antes do
  // go-live — mesmo débito já registrado em ybytu-generate-training-plan.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = new Set(['admin', 'personal', 'nutricionista'])

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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
    // Admin convida qualquer papel, inclusive outro admin (decisão explícita).
    if (!requireRole(auth.staff, 'admin')) {
      return new Response(
        JSON.stringify({ error: 'admin_only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const role = body?.role

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'invalid_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!VALID_ROLES.has(role)) {
      return new Response(
        JSON.stringify({ error: 'invalid_role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const token = generateToken()

    const { data, error } = await supabase
      .from('staff_invites')
      .insert({ email, role, token, created_by: auth.staff.userId })
      .select('token, email, role, expires_at')
      .single()

    if (error || !data) {
      console.error(error)
      return new Response(
        JSON.stringify({ error: 'insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        token: data.token,
        email: data.email,
        role: data.role,
        expires_at: data.expires_at,
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
