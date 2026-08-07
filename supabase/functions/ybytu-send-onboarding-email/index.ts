import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

// Email de confirmação + recapitulativo, disparado pelo próprio
// OnboardingPreLaunch.html logo após o profile ser salvo (mesmo ponto de
// ybytu-notify-onboarding-received), fire-and-forget. Só o próprio usuário
// pode chamar pra SI MESMO (JWT normal dele) -- mesmo padrão das outras
// notify functions. Idempotente via onboarding_email_sent_at.
serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, first_name, goals_ids, training_days_per_week, meals_per_day, dietary_preference_id, onboarding_email_sent_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (profile.onboarding_email_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const email = user.email
    if (!email) {
      return new Response(JSON.stringify({ error: 'missing_email' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [goalsRes, preferenceRes] = await Promise.all([
      profile.goals_ids?.length
        ? supabase.from('goals').select('name_ptbr').in('id', profile.goals_ids)
        : Promise.resolve({ data: [] as { name_ptbr: string }[] }),
      profile.dietary_preference_id
        ? supabase.from('dietary_preferences').select('name_ptbr').eq('id', profile.dietary_preference_id).maybeSingle()
        : Promise.resolve({ data: null as { name_ptbr: string } | null }),
    ])

    const goalsLabel = (goalsRes.data ?? []).map((g) => g.name_ptbr).join(', ') || '—'
    const preferenceLabel = preferenceRes.data?.name_ptbr?.trim() || '—'
    const firstName = profile.first_name || profile.full_name || 'aluno(a)'

    const html = `
      <p>Oi ${firstName},</p>
      <p>Seu cadastro na Ybytu foi concluído com sucesso. Aqui está o resumo do que você nos contou:</p>
      <ul>
        <li><strong>Objetivo:</strong> ${goalsLabel}</li>
        <li><strong>Dias por semana dedicados:</strong> ${profile.training_days_per_week ?? '—'}</li>
        <li><strong>Refeições por dia:</strong> ${profile.meals_per_day ?? '—'}</li>
        <li><strong>Preferência alimentar:</strong> ${preferenceLabel}</li>
      </ul>
      <p>Nosso personal trainer e nutricionista vão revisar e validar seu plano personalizado agora.
      Você recebe o link do plano pelo WhatsApp, no número que você cadastrou, em até 48 horas úteis.</p>
      <p>Qualquer dúvida, é só responder este e-mail.</p>
    `

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurado')
      return new Response(JSON.stringify({ error: 'missing_resend_api_key' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ybytu <onboarding@ybytu.app>',
        to: [email],
        subject: `Recebemos seu perfil, ${firstName}! 🎉`,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const errBody = await resendResponse.text().catch(() => '')
      console.error('Erro retornado pelo Resend:', resendResponse.status, errBody)
      return new Response(JSON.stringify({ error: `resend_error_${resendResponse.status}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('profiles').update({ onboarding_email_sent_at: new Date().toISOString() }).eq('id', userId)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-send-onboarding-email error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
