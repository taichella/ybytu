-- ============================================================================
-- MIGRATION: 20261015130000_cron_http_timeout_30s.sql
-- Rollback:  reaplicar as definições anteriores (mesmo comando sem
--            timeout_milliseconds, ou seja, o padrão de 5000 ms do pg_net).
--
-- Medido em 2026-10-15, logo depois da troca do segredo interno: o lembrete de
-- parecer e a saúde do e-mail levam mais de 5 s (várias consultas + envio pelo
-- Resend), e o pg_net desiste no padrão de 5000 ms -- a resposta fica sem
-- status (timed_out). O lembrete rodou (e-mails às 19:00:05), mas sem resposta
-- registrada não dá para saber se terminou. Mesmos 3 jobs, mesmo horário, mesmo
-- segredo; só o prazo sobe para 30 s. cron.schedule com o mesmo nome atualiza o
-- job existente.
-- ============================================================================

BEGIN;

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
        WHERE name = 'ybytu_internal_function_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'ybytu-onboarding-retry-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jwjfmvkfzelbdvyqetyb.supabase.co/functions/v1/ybytu-onboarding-retry-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'ybytu_internal_function_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

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
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

COMMIT;
