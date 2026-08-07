import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Lista quem está com plano gerado (plan_generation_status='ok') mas ainda
// falta parecer em plan_reviews -- é o que faz a validação humana (personal +
// nutricionista) não travar no vácuo. Escopo por papel de quem chama:
// - admin: vê todo mundo com QUALQUER papel pendente.
// - personal/nutricionista: só vê quem falta O PRÓPRIO papel dele.
// RLS em profiles/plan_reviews é deny-all -- não dá pra fazer isso no
// cliente, por isso function com staffAuth.
const REVIEW_ROLES = ['personal', 'nutricionista'] as const

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
      return new Response(JSON.stringify({ error: auth.reason }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isAdmin = auth.staff.roles.includes('admin')
    const relevantRoles = isAdmin
      ? [...REVIEW_ROLES]
      : REVIEW_ROLES.filter((r) => auth.staff.roles.includes(r))

    if (relevantRoles.length === 0) {
      return new Response(JSON.stringify({ pending: [], count: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp_phone, plan_ready_notified_at')
      .eq('plan_generation_status', 'ok')

    if (profilesError) throw new Error(`Lookup de profiles falhou: ${profilesError.message}`)
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ pending: [], count: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userIds = profiles.map((p) => p.id)
    const { data: reviews, error: reviewsError } = await supabase
      .from('plan_reviews')
      .select('user_id, role')
      .in('user_id', userIds)

    if (reviewsError) throw new Error(`Lookup de plan_reviews falhou: ${reviewsError.message}`)

    const reviewedByUser = new Map<string, Set<string>>()
    for (const r of reviews ?? []) {
      if (!reviewedByUser.has(r.user_id)) reviewedByUser.set(r.user_id, new Set())
      reviewedByUser.get(r.user_id)!.add(r.role)
    }

    const pending = profiles
      .map((p) => {
        const reviewedRoles = reviewedByUser.get(p.id) ?? new Set<string>()
        const missingRoles = relevantRoles.filter((r) => !reviewedRoles.has(r))
        return { ...p, missing_roles: missingRoles }
      })
      .filter((p) => p.missing_roles.length > 0)
      .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''))

    return new Response(JSON.stringify({ pending, count: pending.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-pending-plan-reviews error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
