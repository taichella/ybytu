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

    const [
      totalRes, okRes, failedRes, deliveredRes, okProfilesRes, mealsCompletedRes,
      activeSubsRes, foodsRes, profilesForGrowthRes, subscriptionTypesRes, profilesForDistributionRes,
    ] = await Promise.all([
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
      // Cards do design original (Dashboard.dc.html) restaurados 2026-08-16
      // com dado real -- growth chart e donut de distribuição usam
      // profiles.created_at / subscription_type_id, que sempre existiram e
      // nunca precisaram de WooCommerce (só MRR/ticket/churn precisam).
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('subscription_type_id', 'is', null),
      supabase.from('foods').select('food_id', { count: 'exact', head: true }),
      supabase.from('profiles').select('created_at'),
      supabase.from('subscription_types').select('id, name_ptbr'),
      supabase.from('profiles').select('subscription_type_id'),
    ])

    if (totalRes.error) throw new Error(`total: ${totalRes.error.message}`)
    if (okRes.error) throw new Error(`ok: ${okRes.error.message}`)
    if (failedRes.error) throw new Error(`failed: ${failedRes.error.message}`)
    if (deliveredRes.error) throw new Error(`delivered: ${deliveredRes.error.message}`)
    if (okProfilesRes.error) throw new Error(`ok_profiles: ${okProfilesRes.error.message}`)
    if (mealsCompletedRes.error) throw new Error(`meals_completed: ${mealsCompletedRes.error.message}`)
    if (activeSubsRes.error) throw new Error(`active_subs: ${activeSubsRes.error.message}`)
    if (foodsRes.error) throw new Error(`foods: ${foodsRes.error.message}`)
    if (profilesForGrowthRes.error) throw new Error(`growth: ${profilesForGrowthRes.error.message}`)
    if (subscriptionTypesRes.error) throw new Error(`subscription_types: ${subscriptionTypesRes.error.message}`)
    if (profilesForDistributionRes.error) throw new Error(`distribution: ${profilesForDistributionRes.error.message}`)

    // Growth chart -- últimos 6 meses (inclusive o atual), contagem de
    // profiles.created_at por mês.
    const now = new Date()
    const monthBuckets: { key: string; label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      monthBuckets.push({
        key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
        count: 0,
      })
    }
    const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]))
    for (const p of profilesForGrowthRes.data ?? []) {
      if (!p.created_at) continue
      const d = new Date(p.created_at)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      const bucket = bucketByKey.get(key)
      if (bucket) bucket.count += 1
    }

    // Distribuição de planos -- por subscription_type_id real do profile.
    const typeNameById = new Map((subscriptionTypesRes.data ?? []).map((t: any) => [t.id, t.name_ptbr]))
    const distributionCounts = new Map<string, number>()
    let noPlanCount = 0
    for (const p of profilesForDistributionRes.data ?? []) {
      if (!p.subscription_type_id) { noPlanCount += 1; continue }
      const name = typeNameById.get(p.subscription_type_id) ?? 'Outro'
      distributionCounts.set(name, (distributionCounts.get(name) ?? 0) + 1)
    }
    if (noPlanCount > 0) distributionCounts.set('Sem plano', noPlanCount)
    const planDistribution = [...distributionCounts.entries()].map(([name, count]) => ({ name, count }))

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
      total_users: totalRes.count ?? 0,
      active_subscriptions: activeSubsRes.count ?? 0,
      foods_count: foodsRes.count ?? 0,
      growth_series: monthBuckets,
      plan_distribution: planDistribution,
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
