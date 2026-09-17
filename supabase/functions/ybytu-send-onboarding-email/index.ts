import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

// Fonte de verdade do design: emails/03-plano-em-preparacao.html (raiz do
// repo, ao lado dos outros 9 templates do Antigravity). Essa cópia local
// existe só porque o deploy do Supabase empacota apenas a pasta da própria
// function + _shared/ -- emails/ na raiz não viaja no bundle. Se o design
// mudar, copie de novo (não edite as duas cópias separadamente):
//   cp emails/03-plano-em-preparacao.html supabase/functions/ybytu-send-onboarding-email/template.html
const TEMPLATE_PATH = new URL('./template.html', import.meta.url)

// {{ tracking_link }} removido do template (2026-09-17) -- apontava pra uma
// área logada de acompanhamento que não existe no produto ainda. Única
// variável real que sobrou é {{ name }}.
function renderTemplate(template: string, vars: Record<string, string>): string {
  let html = template
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{ ${key} }}`, value)
  }
  return html
}

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
      .select('first_name, full_name, onboarding_email_sent_at')
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

    // Regra explícita: variável sem valor NUNCA sai como "{{ name }}" literal
    // pro aluno -- loga e recusa o envio.
    const name = (profile.first_name || profile.full_name || '').trim()
    if (!name) {
      console.error(`ybytu-send-onboarding-email: variável 'name' vazia pro usuário ${userId} -- e-mail NÃO enviado`)
      return new Response(JSON.stringify({ error: 'missing_template_variable', variable: 'name' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const template = await Deno.readTextFile(TEMPLATE_PATH)
    const html = renderTemplate(template, { name })

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
        from: 'Ybytu <onboarding@send.ybytu.app>',
        reply_to: 'onboarding@send.ybytu.app',
        to: [email],
        subject: 'Seu plano está sendo montado pelos profissionais',
        html,
      }),
    })

    const resendBody = await resendResponse.json().catch(() => null)

    if (!resendResponse.ok) {
      console.error('Erro retornado pelo Resend:', resendResponse.status, JSON.stringify(resendBody))
      return new Response(JSON.stringify({ error: `resend_error_${resendResponse.status}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Id da mensagem no Resend -- logado pra dar rastreabilidade que faltava
    // (achado 2026-09-17: não havia como confirmar um envio específico sem
    // acesso direto ao painel do Resend).
    console.log(`ybytu-send-onboarding-email: enviado pro usuário ${userId}, resend_id=${resendBody?.id ?? 'desconhecido'}`)

    await supabase.from('profiles').update({ onboarding_email_sent_at: new Date().toISOString() }).eq('id', userId)

    return new Response(JSON.stringify({ ok: true, resend_id: resendBody?.id ?? null }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-send-onboarding-email error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
