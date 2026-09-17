import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'

// Fonte de verdade do design: emails/03-plano-em-preparacao.html (raiz do
// repo, ao lado dos outros 9 templates do Antigravity). Embutido como string
// aqui (não lido do disco em runtime) -- Deno.readTextFile de um arquivo
// bundlado deu 500 em produção (achado 2026-09-17: o bundler do deploy do
// Supabase não inclui .html como asset legível em runtime, só o código).
// scripts/check-email-templates.sh compara emails/03-plano-em-preparacao.html
// contra o conteúdo entre os marcadores TEMPLATE_HTML_START/END abaixo --
// se o design mudar, gere de novo com:
//   node -e "console.log(require('fs').readFileSync('emails/03-plano-em-preparacao.html','utf8'))"
// e cole entre os marcadores (ou peça pro Claude regenerar).
// TEMPLATE_HTML_START
const TEMPLATE_HTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Seu plano está sendo montado pelos profissionais</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Inter', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    a { color: #B4400A; text-decoration: none; }
    .btn-brand:hover { background-color: #E04E07 !important; border-color: #E04E07 !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .email-body { padding: 28px 20px !important; }
      .email-header { padding: 24px 20px 20px !important; }
      .email-footer { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F8F9FA" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px 60px;">
        <!-- Container 600px -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td height="6" style="background-color: #F55F16; background: linear-gradient(135deg, #F55F16, #FF7A3D); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="email-header" style="padding: 32px 40px 24px; border-bottom: 1px solid #F1F5F9;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          <div style="width: 38px; height: 38px; border-radius: 11px; background-color: #F55F16; background: linear-gradient(135deg, #F55F16, #FF7A3D); display: inline-block; text-align: center; line-height: 38px; color: #FFFFFF; font-weight: 900; font-size: 20px;">Y</div>
                        </td>
                        <td>
                          <span style="font-size: 20px; font-weight: 900; letter-spacing: 0.12em; color: #1A202C;">YBYTU</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 36px 40px;">
              <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1A202C; line-height: 1.25;">Seu plano está sendo preparado</h1>
              
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4A5568;">Olá, <strong>{{ name }}</strong>!</p>
              
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4A5568;">Suas respostas foram recebidas e seu plano será revisado por profissionais antes de chegar até você.</p>

              <!-- Próximos passos -- SEM estado, SEM percentual: mesma lista
                   (mesmo texto) da tela de confirmação do widget de onboarding. -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #F8F9FA; border-radius: 14px; border: 1px solid #E2E8F0;">
                <tr>
                  <td style="padding: 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="26" valign="top" style="padding-bottom: 14px;">
                          <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #F55F16; color: #FFFFFF; font-size: 11px; font-weight: 800; text-align: center; line-height: 22px;">1</div>
                        </td>
                        <td style="font-size: 13px; color: #1A202C; padding-bottom: 14px;">Recebemos suas respostas</td>
                      </tr>
                      <tr>
                        <td width="26" valign="top" style="padding-bottom: 14px;">
                          <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #F55F16; color: #FFFFFF; font-size: 11px; font-weight: 800; text-align: center; line-height: 22px;">2</div>
                        </td>
                        <td style="font-size: 13px; color: #1A202C; padding-bottom: 14px;">Seu plano é gerado e revisado por um personal trainer e um nutricionista</td>
                      </tr>
                      <tr>
                        <td width="26" valign="top">
                          <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #F55F16; color: #FFFFFF; font-size: 11px; font-weight: 800; text-align: center; line-height: 22px;">3</div>
                        </td>
                        <td style="font-size: 13px; color: #1A202C;">Você recebe o link pelo WhatsApp em até 48 horas</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 28px 40px; background-color: #F8F9FA; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #1A202C;">Ybytu Saúde e Performance</p>
              <p style="margin: 0 0 14px; font-size: 12px; line-height: 1.5; color: #718096;">Treino e nutrição personalizados orientados por IA e validados por especialistas humanos.</p>
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">Dúvidas? Fale conosco em <a href="mailto:contato@ybytu.app" style="color: #B4400A; font-weight: 600;">contato@ybytu.app</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
// TEMPLATE_HTML_END

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

    const html = renderTemplate(TEMPLATE_HTML, { name })

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
