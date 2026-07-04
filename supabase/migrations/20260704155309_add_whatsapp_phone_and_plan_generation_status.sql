-- Primeira migration versionada deste projeto. O schema atual (pre-existente)
-- ja tem 26 mudancas registradas no controle interno do Supabase, sem arquivo
-- correspondente no git ainda (ver baseline pendente via `supabase db pull`).
--
-- Estas 2 colunas suportam a fiacao do onboarding pre-lancamento (HTML/Elementor):
-- whatsapp_phone: contato do lead, coletado no form, sem coluna ate agora.
-- plan_generation_status: flag de fail-soft — se signup/profile ok mas os
-- geradores (ybytu-generate-training-plan / ybytu-generate-meal-plan) falharem,
-- o onboarding ainda redireciona pro WhatsApp (nao perde o lead) e marca esta
-- coluna pra suporte identificar quem ficou sem plano gerado.

ALTER TABLE profiles
  ADD COLUMN whatsapp_phone text,
  ADD COLUMN plan_generation_status text
    DEFAULT 'pending'
    CHECK (plan_generation_status IN ('pending', 'ok', 'failed'));
