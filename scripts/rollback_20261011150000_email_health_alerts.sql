-- Rollback de supabase/migrations/20261011150000_email_health_alerts.sql
-- Para o cron e apaga o histórico de incidentes.
BEGIN;
SELECT cron.unschedule('ybytu-email-health-hourly');
DROP TABLE IF EXISTS public.system_alerts;
COMMIT;
