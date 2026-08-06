-- Suporte ao fluxo de notificacao WhatsApp (aviso aos profissionais + aviso
-- ao usuario quando os 2 pareceres entram) e ao lembrete de 12h se ninguem
-- validar. plan_reviews ja existia (migration 20260728145400) -- isso so
-- adiciona o estado de "quem ja foi avisado" em profiles, pra idempotencia
-- (nao reenviar WhatsApp em retry/reedicao de parecer) e pro cron saber o
-- que ainda esta pendente.
ALTER TABLE profiles
  ADD COLUMN plan_ready_notified_at timestamptz,
  ADD COLUMN plan_review_reminder_sent_at timestamptz,
  ADD COLUMN user_notified_ready_at timestamptz;

-- pg_cron/pg_net: mecanismo padrao do Supabase pra rodar job agendado que
-- chama uma edge function via HTTP. Nenhum dos dois estava habilitado neste
-- projeto ainda (confirmado antes desta migration).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- A service_role key NUNCA fica em texto no codigo/migration (isso vai pro
-- git). Fica no Vault, carregada uma vez via `select vault.create_secret(...)`
-- fora desta migration -- o job so referencia o NOME do secret aqui.
SELECT cron.schedule(
  'ybytu-plan-review-reminder-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jwjfmvkfzelbdvyqetyb.supabase.co/functions/v1/ybytu-plan-review-reminder-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'ybytu_service_role_key'
      )
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
