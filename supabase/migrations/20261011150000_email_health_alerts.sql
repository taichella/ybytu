-- ============================================================================
-- MIGRATION: 20261011150000_email_health_alerts.sql
-- Rollback:  scripts/rollback_20261011150000_email_health_alerts.sql
--
-- Alerta de falha do caminho crítico por e-mail (2026-10-11, WhatsApp fora).
-- 1. system_alerts: um incidente por vez por kind (abre, atualiza, fecha) --
--    é o que impede o cron de mandar e-mail de alerta toda hora e guarda o
--    histórico de quando cada incidente começou e terminou.
-- 2. pg_cron de hora em hora (minuto 15, para não coincidir com o lembrete de
--    parecer no minuto 0) chamando ybytu-email-health-cron com o mesmo
--    segredo interno do vault usado pelos outros crons.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,                     -- 'email_delivery'
  opened_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  detail jsonb,                           -- resumo da última rodada (contagens)
  alert_email_sent_at timestamptz,        -- e-mail "falhou" aceito pelo Resend
  resolved_email_sent_at timestamptz      -- e-mail "voltou" aceito pelo Resend
);

-- No máximo um incidente aberto por kind.
CREATE UNIQUE INDEX IF NOT EXISTS system_alerts_one_open_per_kind
  ON public.system_alerts (kind) WHERE resolved_at IS NULL;

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY; -- só service_role

SELECT cron.schedule(
  'ybytu-email-health-hourly',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jwjfmvkfzelbdvyqetyb.supabase.co/functions/v1/ybytu-email-health-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'ybytu_internal_function_secret'
      )
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

COMMIT;
