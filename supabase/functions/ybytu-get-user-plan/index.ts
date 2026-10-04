import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildPlanPayload } from '../_shared/buildPlanPayload.ts'
import { corsHeadersFor } from '../_shared/cors.ts'
import { getPlanApproval } from '../_shared/planApproval.ts'

// ============================================================================
// EDGE FUNCTION: ybytu-get-user-plan
// Porta do usuário (user) autenticado: recebe o Bearer token do usuário logado,
// reaproveita diretamente o motor buildPlanPayload.ts sem modificá-lo,
// e anexa o status de atividades de hoje (completed_workouts e completed_meals).
// ============================================================================

function getCorsHeaders(req: Request): Record<string, string> {
  const headers = corsHeadersFor(req)
  // Localhost estritamente condicionado a variável de ambiente, NUNCA ativo em produção
  const origin = req.headers.get('origin')
  const env = Deno.env.get('ENVIRONMENT')
  if (env === 'development' && origin && origin.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// Calcula o timestamp ISO de início do dia (00:00:00 local) para o fuso do usuário.
// Fonte única: query parameter ?timezone=...
// Se vier indefinido, vazio ou com nome IANA inválido, o fallback é estritamente 'America/Sao_Paulo'.
function getStartOfDayInTimezone(timeZone = 'America/Sao_Paulo'): string {
  let tz = timeZone?.trim() || 'America/Sao_Paulo'
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
  } catch {
    tz = 'America/Sao_Paulo'
  }

  const now = new Date()
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const ymd = dtf.format(now) // YYYY-MM-DD no fuso do aluno

  const tzOffsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  })
  const offsetPart = tzOffsetFormatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value
  let offsetIso = '+00:00'
  if (offsetPart && offsetPart.startsWith('GMT')) {
    const raw = offsetPart.replace('GMT', '').trim()
    if (raw) {
      offsetIso = raw.includes(':') ? raw : (raw.length === 3 ? `${raw}:00` : raw)
    }
  }

  return new Date(`${ymd}T00:00:00${offsetIso}`).toISOString()
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Extração e validação do token JWT do usuário logado
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return new Response(JSON.stringify({
        error: 'missing_token',
        message: 'Acesso não autorizado. Faça login para acessar seu plano.',
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'invalid_token',
        message: 'Sua sessão expirou. Faça login novamente.',
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // 1b. Plano só é liberado depois do parecer de todos os profissionais exigidos
    // (regra em _shared/planApproval.ts). Sem aprovação, NADA do plano sai daqui --
    // 200 com awaiting_review pra o app mostrar a tela "Plano em Preparação".
    const approval = await getPlanApproval(supabase, userId)
    if (!approval.approved) {
      return new Response(JSON.stringify({
        awaiting_review: true,
        pending_roles: approval.pendingRoles,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Monta o payload completo reaproveitando buildPlanPayload.ts intacto
    const payload = await buildPlanPayload(supabase, userId, 'student')

    if (!payload || (!payload.training && !payload.nutrition)) {
      return new Response(JSON.stringify({
        error: 'plan_not_found',
        message: 'Nenhum plano ativo foi encontrado para o seu perfil.',
      }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Busca o status de check-in de hoje (sessões e refeições concluídas)
    // Fonte única de fuso: query parameter (?timezone=...)
    // Se vier nulo, vazio ou inválido, getStartOfDayInTimezone() faz fallback para 'America/Sao_Paulo'.
    const url = new URL(req.url)
    const rawTimezone = url.searchParams.get('timezone')?.trim() || undefined
    const todayStartIso = getStartOfDayInTimezone(rawTimezone)

    // Último treino concluído NESTE plano (qualquer data) -- o app abre no dia
    // seguinte a ele. Filtrado pelo plano ativo pra um plano novo recomeçar no Dia 1.
    const trainingPlanUuid = (payload.training as { id?: string } | null)?.id ?? null

    const [workoutsRes, mealsRes, lastWorkoutRes] = await Promise.all([
      supabase
        .from('completed_workouts')
        .select('id, day_number, session_name, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', todayStartIso)
        .order('completed_at', { ascending: false }),
      supabase
        .from('completed_meals')
        .select('id, day_order, meal_order, meal_name, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', todayStartIso)
        .order('completed_at', { ascending: false }),
      trainingPlanUuid
        ? supabase
          .from('completed_workouts')
          .select('day_number, completed_at')
          .eq('user_id', userId)
          .eq('training_plan_id', trainingPlanUuid)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    // 4. Retorna o plano do usuário integrado com seu progresso de hoje
    const responsePayload = {
      ...payload,
      activity_today: {
        completed_workouts: workoutsRes.data ?? [],
        completed_meals: mealsRes.data ?? [],
      },
      last_completed_workout: lastWorkoutRes.data ?? null,
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('ybytu-get-user-plan error:', err?.message || 'unknown')
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'Não foi possível carregar seu plano no momento. Tente novamente em instantes.',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
