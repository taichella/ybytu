import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Big numbers da campanha em curso (Pré-lançamento / Desafio 15 dias) pro
// Dashboard. Uma function só, visível pra qualquer staff ativo (não é
// role-scoped como ybytu-pending-plan-reviews -- é visão geral, não fila de
// trabalho pessoal). "Aguardando validação" aqui é a contagem GLOBAL (falta
// qualquer um dos 2 pareceres), diferente da lista pessoal da outra function.
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

    const [totalRes, okRes, failedRes, deliveredRes, okProfilesRes, mealsCompletedRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_generation_status', 'ok'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_generation_status', 'failed'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('user_notified_ready_at', 'is', null),
      supabase.from('profiles').select('id').eq('plan_generation_status', 'ok'),
      // Refeições marcadas como feitas pelo app do aluno (ProfileScreen.js já
      // lê essa tabela pro streak do usuário). Card "Refeições Realizadas" do
      // Dashboard -- pedido da Taina 2026-08-11 pra trocar o antigo "Base de
      // Alimentos" (mock). Vazio agora não é bug: nada popula ainda além do
      // próprio marcar-como-feito no app, é dado real de adesão, não de
      // catálogo.
      supabase.from('completed_meals').select('id', { count: 'exact', head: true }),
    ])

    if (totalRes.error) throw new Error(`total: ${totalRes.error.message}`)
    if (okRes.error) throw new Error(`ok: ${okRes.error.message}`)
    if (failedRes.error) throw new Error(`failed: ${failedRes.error.message}`)
    if (deliveredRes.error) throw new Error(`delivered: ${deliveredRes.error.message}`)
    if (okProfilesRes.error) throw new Error(`ok_profiles: ${okProfilesRes.error.message}`)
    if (mealsCompletedRes.error) throw new Error(`meals_completed: ${mealsCompletedRes.error.message}`)

    const okIds = (okProfilesRes.data ?? []).map((p) => p.id)
    let pendingCount = 0
    if (okIds.length > 0) {
      const { data: reviews, error: reviewsError } = await supabase
        .from('plan_reviews')
        .select('user_id, role')
        .in('user_id', okIds)
      if (reviewsError) throw new Error(`reviews: ${reviewsError.message}`)

      const reviewedByUser = new Map<string, Set<string>>()
      for (const r of reviews ?? []) {
        if (!reviewedByUser.has(r.user_id)) reviewedByUser.set(r.user_id, new Set())
        reviewedByUser.get(r.user_id)!.add(r.role)
      }
      pendingCount = okIds.filter((id) => {
        const reviewed = reviewedByUser.get(id) ?? new Set<string>()
        return REVIEW_ROLES.some((r) => !reviewed.has(r))
      }).length
    }

    return new Response(JSON.stringify({
      onboardings_completed: totalRes.count ?? 0,
      plans_generated_ok: okRes.count ?? 0,
      plans_generated_failed: failedRes.count ?? 0,
      pending_validation: pendingCount,
      plans_delivered: deliveredRes.count ?? 0,
      meals_completed: mealsCompletedRes.count ?? 0,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-campaign-stats error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
