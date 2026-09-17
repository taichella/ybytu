import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Lista perfis com problema de geração pra alimentar a tela "Ver planos que
// falharam" (Campaign.jsx). Visível pra qualquer staff ativo, mesmo critério
// de ybytu-campaign-stats — não é fila de trabalho pessoal, é visão
// operacional. Ação de retry fica numa function separada
// (ybytu-admin-retry-plan-generation), admin-only.
//
// Achado 2026-09-17 (revisão Antigravity): só listava status='failed' --
// um onboarding que nunca chegou a chamar o gerador (fechou a aba, ou a
// chamada travou) fica 'pending' ou 'generating' pra sempre, e isso nunca
// aparecia aqui. Agora também lista pending/generating antigos (mesmo corte
// de 10min do cron de retomada, ver _shared/onboardingOrchestration.ts) --
// esses só chegam aqui se o cron JÁ tentou e não resolveu (senão o cron
// resolve sozinho antes do staff precisar olhar).
const STUCK_AFTER_MINUTES = 10
const MAX_GENERATION_ATTEMPTS = 3
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

    const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000).toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, subscription_type_id, plan_generation_status, plan_generation_error, plan_generation_started_at, plan_generation_attempts, created_at, current_training_plan_id, current_meal_plan_id')
      .eq('onboarding_completed', true)
      .or(`plan_generation_status.eq.failed,and(plan_generation_status.eq.pending,created_at.lt.${cutoff}),and(plan_generation_status.eq.generating,plan_generation_started_at.lt.${cutoff})`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({
      failed: (data ?? []).map((p: any) => {
        // 'pending'/'generating' travados só chegam aqui depois do corte de
        // 10min -- o cron (ybytu-onboarding-retry-cron) já teve chance de
        // resolver sozinho antes disso. attempts >= 3 = o cron desistiu,
        // precisa de ação manual de verdade; abaixo disso, o cron ainda vai
        // tentar de novo na próxima rodada (mostrado só pra visibilidade).
        const stuckKind = p.plan_generation_status !== 'failed' ? p.plan_generation_status : null
        return {
          id: p.id,
          full_name: p.full_name,
          subscription_type_id: p.subscription_type_id,
          status: p.plan_generation_status,
          stuck_as: stuckKind, // 'pending' | 'generating' | null (null = já é 'failed' de verdade)
          error_message: p.plan_generation_error,
          attempts: p.plan_generation_attempts ?? 0,
          exhausted_retries: (p.plan_generation_attempts ?? 0) >= MAX_GENERATION_ATTEMPTS,
          created_at: p.created_at,
          has_training_plan: !!p.current_training_plan_id,
          has_meal_plan: !!p.current_meal_plan_id,
        }
      }),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('ybytu-admin-failed-plans error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
