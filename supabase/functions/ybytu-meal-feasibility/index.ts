import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { resolveNutritionProfile, checkMealCounts } from '../_shared/mealFeasibility.ts'

// Viabilidade do número de refeições para o onboarding (2026-10-17, versão
// curta aprovada pela Taina). PÚBLICA (verify_jwt = false em config.toml): a
// conta só é criada no fim do onboarding, depois desta consulta.
//
// Recebe as respostas de corpo e alimentação (sem nome, e-mail, telefone), não
// grava nada e devolve SÓ quais números de refeições cabem no piso de
// segurança -- nenhum número de kcal sai daqui. A regra é a mesma do gerador
// (_shared/mealFeasibility.ts).
//
// Sem rate limit, como os outros endpoints públicos de leitura (débito em
// docs/POS_PILOTO.md, "Rate limit nos endpoints públicos"): cada chamada faz
// 5 leituras de tabela pequenas e 4 consultas ao catálogo.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const uuidOrNull = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : null)
const uuidList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && UUID.test(x)).slice(0, 30) : [])
const num = (v: unknown, min: number, max: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return json({ error: 'invalid_body' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const profile = await resolveNutritionProfile(supabase, {
      gender_id:                uuidOrNull(body.gender_id),
      activity_level_id:        uuidOrNull(body.activity_level_id),
      dietary_preference_id:    uuidOrNull(body.dietary_preference_id),
      dietary_restrictions_ids: uuidList(body.dietary_restrictions_ids),
      goals_ids:                uuidList(body.goals_ids),
      age:                      num(body.age, 10, 120),
      weight_kg:                num(body.weight_kg, 20, 400),
      height_cm:                num(body.height_cm, 80, 260),
    })
    const { checks } = await checkMealCounts(supabase, profile)

    // 'missing_type' conta como possível: o gerador tem o caminho do plano de
    // catálogo, com o próprio teste de piso -- não dá para afirmar que não cabe.
    const viable = checks.filter((c) => c.result !== 'below_floor').map((c) => c.meals_per_day)
    return json({ viable })
  } catch (err) {
    console.error('ybytu-meal-feasibility error:', err)
    return json({ error: 'internal_error' }, 500)
  }
})
