-- Corrige o job de lembrete: SUPABASE_SERVICE_ROLE_KEY nao e comparavel
-- diretamente (o runtime das edge functions e o valor obtido via
-- `projects api-keys` divergiram apos a migracao do projeto pro novo
-- esquema de API keys, em 2026-08-05 -- descoberto ao testar o cron
-- manualmente e receber 403). Troca por um segredo dedicado
-- (INTERNAL_FUNCTION_SECRET / vault "ybytu_internal_function_secret"),
-- mais estavel e com blast radius menor que o service_role key.
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
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Segredo antigo nao serve mais pra nada aqui, remove.
DELETE FROM vault.secrets WHERE name = 'ybytu_service_role_key';
