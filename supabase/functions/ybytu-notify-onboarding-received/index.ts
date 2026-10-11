import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import { sendWhatsAppTemplate, WHATSAPP_ENABLED } from '../_shared/whatsapp.ts'
import { escapeHtml, sendEmail, staffRecipientsForRole } from '../_shared/email.ts'

// Desde 2026-10-11 (WhatsApp fora, ver _shared/whatsapp.ts):
// - aviso de novo aluno vai por E-MAIL para as contas com papel admin;
// - o "recebemos seu perfil" do aluno já é coberto pelo e-mail de onboarding
//   (ybytu-send-onboarding-email), então o WhatsApp dele só roda ligado.
// Sem template do Antigravity para este aviso interno: HTML simples aqui.
function adminNewOnboardingHtml(studentName: string, unclassifiedWarning: boolean, userLink: string): string {
  const warning = unclassifiedWarning
    ? `<p style="margin: 0 0 16px; padding: 12px 14px; background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 10px; color: #9A3412; font-size: 14px;"><strong>⚠️ Limitação física não listada:</strong> o aluno marcou "Outra limitação". Nenhum filtro de cautela roda para essa opção; entre em contato antes do parecer.</p>`
    : ''
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 14px;">
      <h2 style="color: #1A202C; margin: 0 0 12px;">Novo aluno completou o onboarding</h2>
      <p style="color: #4A5568; font-size: 15px; margin: 0 0 16px;"><strong>${escapeHtml(studentName)}</strong> concluiu o onboarding. O plano está sendo gerado e depois segue para o parecer dos profissionais.</p>
      ${warning}
      <p style="margin: 0;"><a href="${userLink}" style="display: inline-block; padding: 12px 22px; background: #F55F16; color: #FFFFFF; border-radius: 10px; text-decoration: none; font-weight: 700;">Abrir o aluno no painel</a></p>
    </div>
  `
}

// Dispara os 2 avisos de "onboarding concluido", chamado pelo proprio
// OnboardingPreLaunch.html logo apos o profile ser salvo, ANTES dos
// geradores de treino/nutricao (fire-and-forget -- nao atrasa o loading do
// usuario, e o gap humano de validacao do plano ja garante a ordem de
// chegada na pratica). Independente do resultado da geracao.
// 1. Usuario: "recebemos seu perfil, estamos montando" (sem link).
// 2. Sales: "novo aluno completou onboarding" + botao URL dinamica pro
//    dashboard (pro.ybytu.app/users/<userId>).
// So o proprio usuario pode chamar pra SI MESMO (JWT normal dele) -- mesmo
// padrao de ybytu-notify-plan-ready / ybytu-create-plan-share-token.
// Idempotente via onboarding_notified_at, evita duplo-envio em retry.
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
      .select('id, full_name, whatsapp_phone, onboarding_notified_at, physical_conditions_ids')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(`Lookup de profile falhou: ${profileError.message}`)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (profile.onboarding_notified_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_notified' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userTemplateId = Deno.env.get('WHATSAPP_TEMPLATE_USER_ONBOARDING_RECEIVED') ?? ''
    const salesTemplateId = Deno.env.get('WHATSAPP_TEMPLATE_STAFF_NEW_ONBOARDING') ?? ''
    const salesPhone = Deno.env.get('PHONE_ADMIN_SALE') ?? ''
    const fullName = profile.full_name ?? 'aluno(a)'

    // "Outra limitação" não tem slug em physical_condition_exercise_slugs --
    // nenhum filtro de avoid/caution roda pra quem marcou só essa opção (ver
    // docs/DEBITO_ALERTA_STAFF_VIA_PARAMETRO_NOME_20260904.md). CONTORNO
    // CONSCIENTE, não padrão a replicar: sem template Meta próprio pra esse
    // alerta (aprovação leva dias), reaproveita o parâmetro fullName -- que
    // o template ybytu_staff_new_onboarding já manda -- pra carregar nome +
    // aviso. Se alguém reformular esse template na Meta sem saber disso, o
    // aviso some silenciosamente. Trocar por template dedicado quando houver
    // folga pra passar pela aprovação.
    const { data: physicalConditionRows } = await supabase
      .from('onboarding_physical_conditions')
      .select('id, physical_condition_id')
      .in('id', profile.physical_conditions_ids ?? [])
    const hasUnclassifiedCondition = (physicalConditionRows ?? []).some((r: any) => r.physical_condition_id === 'other')
    const salesFullName = hasUnclassifiedCondition ? `${fullName} — ⚠️ limitação física não listada, contatar` : fullName

    const results: Record<string, unknown> = {}

    const admins = await staffRecipientsForRole(supabase, 'admin')
    if (admins.length === 0) console.error('Nenhum admin ativo: aviso de novo aluno não enviado')
    const adminResults: string[] = []
    for (const admin of admins) {
      const result = await sendEmail(supabase, {
        userId,
        kind: 'admin_new_onboarding',
        to: admin.email,
        subject: `Novo aluno completou o onboarding: ${fullName}`,
        html: adminNewOnboardingHtml(fullName, hasUnclassifiedCondition, `https://pro.ybytu.app/users/${userId}`),
      })
      adminResults.push(result.ok ? 'sent' : `failed: ${result.error}`)
    }
    results.admin_email = adminResults

    if (!WHATSAPP_ENABLED) {
      results.user = 'skipped: whatsapp_disabled'
      results.sales = 'skipped: whatsapp_disabled'
    } else {
      if (profile.whatsapp_phone) {
        const result = await sendWhatsAppTemplate(supabase, userId, profile.whatsapp_phone, userTemplateId, [fullName])
        results.user = result.ok ? 'sent' : `failed: ${result.error}`
        if (!result.ok) console.error('Falha ao notificar usuario (onboarding_received):', result.error)
      } else {
        results.user = 'skipped: missing_whatsapp_phone'
      }

      if (salesPhone) {
        const result = await sendWhatsAppTemplate(supabase, userId, salesPhone, salesTemplateId, [salesFullName], userId)
        results.sales = result.ok ? 'sent' : `failed: ${result.error}`
        if (!result.ok) console.error('Falha ao notificar sales (new_onboarding):', result.error)
      } else {
        results.sales = 'skipped: missing_phone_admin_sale'
        console.error('Telefone nao configurado pro sales (PHONE_ADMIN_SALE)')
      }
    }

    await supabase.from('profiles').update({ onboarding_notified_at: new Date().toISOString() }).eq('id', userId)

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ybytu-notify-onboarding-received error:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
