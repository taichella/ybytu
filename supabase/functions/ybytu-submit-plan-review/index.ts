import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveStaffFromRequest, requireRole } from '../_shared/staffAuth.ts'
import { corsHeadersFor } from '../_shared/cors.ts'

// Grava o parecer profissional (personal ou nutricionista) sobre o plano de
// um usuário -- um por (user_id, role), UPDATE se já existir (ver migration
// 20260728145400). reviewer_name SEMPRE vem do registro de staff resolvido
// pelo servidor, nunca do body (evita alguém assinar parecer com outro
// nome). Quando o 2º parecer completa o par (personal + nutricionista),
// dispara ybytu-send-user-whatsapp internamente (service_role) -- é isso
// que avisa o usuário que o plano está pronto.
//
// PASSO 5 (2026-08-09, decisão da Taina) -- load_updates opcional no body:
// edita sets_detail[].load_kg no PLANO DO ALUNO (training_plan_exercises),
// nunca no molde. Só o personal pode mandar isso (carga é domínio de
// treino). Checagem de posse obrigatória: training_plan_id do body tem que
// ser o plano ATIVO daquele user_id (via profiles.current_training_plan_id)
// -- sem isso, um personal poderia editar carga do plano de outro aluno
// só adivinhando o training_plan_exercise_id. Merge é por set_number,
// só load_kg muda -- reps/rest_seconds/set_type vêm sempre do banco, nunca
// do body, pra este endpoint não virar uma porta lateral pra reescrever a
// estrutura do treino (isso é função do construtor de molde, nunca daqui).
// Série variável (nº de sets diferente por exercício editável no plano do
// aluno) fica pendente pra v2 -- ver [[project_plan_creators_schema_debt]].
const VALID_ROLES = new Set(['personal', 'nutricionista'])

function normalizeLoadKg(value: unknown): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error('invalid_load_kg')
  }
  return value
}

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

    const body = await req.json().catch(() => null)
    const userId = typeof body?.user_id === 'string' ? body.user_id : ''
    const role = body?.role
    const reviewerCredential = typeof body?.reviewer_credential === 'string' ? body.reviewer_credential : null
    const notePtbr = typeof body?.note_ptbr === 'string' ? body.note_ptbr : null
    const trainingPlanId = typeof body?.training_plan_id === 'string' ? body.training_plan_id : null
    const mealPlanId = typeof body?.meal_plan_id === 'string' ? body.meal_plan_id : null

    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!VALID_ROLES.has(role)) {
      return new Response(JSON.stringify({ error: 'invalid_role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Só pode assinar parecer com um papel que o próprio staff realmente tem.
    if (!requireRole(auth.staff, role)) {
      return new Response(JSON.stringify({ error: 'role_not_held_by_caller' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawLoadUpdates = Array.isArray(body?.load_updates) ? body.load_updates : null
    if (rawLoadUpdates) {
      // Carga é domínio de treino -- só quem tem o papel personal pode editar,
      // independente de qual `role` este submit está assinando (ex: um
      // nutricionista nunca deveria conseguir mandar load_updates junto do
      // parecer dele).
      if (!requireRole(auth.staff, 'personal')) {
        return new Response(JSON.stringify({ error: 'load_updates_requires_personal_role' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!trainingPlanId) {
        return new Response(JSON.stringify({ error: 'missing_training_plan_id_for_load_updates' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const parsedUpdates: Array<{ tpeId: string; loads: Map<number, unknown> }> = []
      for (const raw of rawLoadUpdates) {
        const tpeId = typeof raw?.training_plan_exercise_id === 'string' ? raw.training_plan_exercise_id : null
        const loads = Array.isArray(raw?.loads) ? raw.loads : null
        if (!tpeId || !loads) {
          return new Response(JSON.stringify({ error: 'invalid_load_update' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const loadsBySetNumber = new Map<number, unknown>()
        for (const l of loads) {
          if (typeof l?.set_number !== 'number') {
            return new Response(JSON.stringify({ error: 'invalid_load_update' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          loadsBySetNumber.set(l.set_number, l.load_kg)
        }
        parsedUpdates.push({ tpeId, loads: loadsBySetNumber })
      }

      // Checagem de posse: training_plan_id do body precisa ser o plano
      // ATIVO deste user_id (via profiles.current_training_plan_id), não
      // qualquer plano que já existiu. Essencial, não opcional (decisão da
      // Taina) -- sem isso um personal com o id certo em mãos editaria
      // carga do plano de outro aluno.
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('current_training_plan_id')
        .eq('id', userId)
        .maybeSingle()
      if (profileErr) throw new Error(`Lookup de profile falhou: ${profileErr.message}`)
      if (!profileRow?.current_training_plan_id) {
        return new Response(JSON.stringify({ error: 'user_has_no_active_training_plan' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: planRow, error: planErr } = await supabase
        .from('training_plans')
        .select('id, training_plan_id')
        .eq('training_plan_id', trainingPlanId)
        .maybeSingle()
      if (planErr) throw new Error(`Lookup de training_plan falhou: ${planErr.message}`)
      if (!planRow || planRow.id !== profileRow.current_training_plan_id) {
        return new Response(JSON.stringify({ error: 'training_plan_not_active_for_user' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const tpeIds = parsedUpdates.map((u) => u.tpeId)
      const { data: tpeRows, error: tpeErr } = await supabase
        .from('training_plan_exercises')
        .select('id, training_plan_id, sets_detail')
        .in('id', tpeIds)
      if (tpeErr) throw new Error(`Lookup de training_plan_exercises falhou: ${tpeErr.message}`)
      const tpeById = new Map((tpeRows ?? []).map((r) => [r.id as string, r]))

      // Todo slot referenciado precisa mesmo pertencer a ESTE training_plan_id
      // (mesma checagem de posse, agora no nível do exercício individual).
      for (const { tpeId } of parsedUpdates) {
        const row = tpeById.get(tpeId)
        if (!row || row.training_plan_id !== planRow.training_plan_id) {
          return new Response(JSON.stringify({ error: 'training_plan_exercise_not_in_plan' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      try {
        for (const { tpeId, loads } of parsedUpdates) {
          const row = tpeById.get(tpeId)!
          const currentDetail = Array.isArray(row.sets_detail) ? row.sets_detail : []
          const mergedDetail = currentDetail.map((s: any) =>
            loads.has(s.set_number) ? { ...s, load_kg: normalizeLoadKg(loads.get(s.set_number)) } : s
          )
          const { error: updateErr } = await supabase
            .from('training_plan_exercises')
            .update({ sets_detail: mergedDetail })
            .eq('id', tpeId)
          if (updateErr) throw new Error(`Update de sets_detail falhou (${tpeId}): ${updateErr.message}`)
        }
      } catch (loadErr) {
        if (loadErr instanceof Error && loadErr.message === 'invalid_load_kg') {
          return new Response(JSON.stringify({ error: 'invalid_load_kg' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        throw loadErr
      }
    }

    const { error: upsertError } = await supabase
      .from('plan_reviews')
      .upsert(
        {
          user_id: userId,
          role,
          reviewer_name: auth.staff.fullName,
          reviewer_credential: reviewerCredential,
          note_ptbr: notePtbr,
          training_plan_id: trainingPlanId,
          meal_plan_id: mealPlanId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,role' },
      )

    if (upsertError) throw new Error(`Upsert de plan_reviews falhou: ${upsertError.message}`)

    const { data: reviews, error: reviewsError } = await supabase
      .from('plan_reviews')
      .select('role')
      .eq('user_id', userId)

    if (reviewsError) throw new Error(`Lookup de plan_reviews falhou: ${reviewsError.message}`)

    const reviewedRoles = new Set((reviews ?? []).map((r) => r.role as string))
    const bothReviewed = reviewedRoles.has('personal') && reviewedRoles.has('nutricionista')

    if (bothReviewed) {
      const notifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ybytu-send-user-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('INTERNAL_FUNCTION_SECRET')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!notifyResponse.ok) {
        console.error('Falha ao notificar usuário via ybytu-send-user-whatsapp:', await notifyResponse.text())
      }
    }

    return new Response(JSON.stringify({ ok: true, both_reviewed: bothReviewed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-submit-plan-review error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
