-- ============================================================================
-- MIGRATION: 20261011120000_email_notifications.sql
-- Rollback:  scripts/rollback_20261011120000_email_notifications.sql
--
-- WhatsApp fora do caminho crítico (decisão da Taina, 2026-10-11): a conta da
-- Meta ficou dias sem entregar (token 401, depois 131042 pagamento pendente) e
-- ninguém soube. O e-mail (Resend) passa a ser o canal de:
--   - link do plano para o aluno quando o plano é aprovado;
--   - aviso e lembrete de parecer pendente para personal/nutricionista;
--   - aviso de novo aluno para o admin.
--
-- 1. email_notifications: um registro por envio (sucesso ou falha), como
--    whatsapp_notifications. Sem isto uma falha do Resend ficava só no log da
--    function -- é a base do alerta de falha de envio (monitoramento).
-- 2. profiles.user_plan_email_sent_at: idempotência do e-mail "plano pronto",
--    separada de user_notified_ready_at (que é do WhatsApp) -- assim religar o
--    WhatsApp depois não depende do e-mail nem o contrário.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- aluno a que o envio se refere (pode ser null)
  kind text NOT NULL,             -- user_plan_ready | staff_review_pending | staff_review_reminder | admin_new_onboarding
  to_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')), -- 'sent' = Resend aceitou
  provider_id text,               -- id do e-mail no Resend
  error text
);

CREATE INDEX IF NOT EXISTS email_notifications_created_at_idx ON public.email_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS email_notifications_user_id_idx ON public.email_notifications (user_id);

-- Só service_role (functions) lê e grava; sem policy = nega tudo para
-- anon/authenticated, mesmo padrão de exercises.
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_plan_email_sent_at timestamptz;

COMMIT;
