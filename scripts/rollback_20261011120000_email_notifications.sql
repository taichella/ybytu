-- Rollback de supabase/migrations/20261011120000_email_notifications.sql
-- Apaga o registro de envios por e-mail (perde o histórico) e a coluna de
-- idempotência do e-mail "plano pronto".
BEGIN;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_plan_email_sent_at;
DROP TABLE IF EXISTS public.email_notifications;
COMMIT;
