-- Rollback de supabase/migrations/20261011170000_cron_auth_failures_rpc.sql
BEGIN;
DROP FUNCTION IF EXISTS public.cron_auth_failures(integer);
COMMIT;
