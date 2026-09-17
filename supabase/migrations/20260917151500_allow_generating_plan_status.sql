-- Achado ao testar ao vivo (2026-09-17, conta descartável de teste): a
-- migration anterior (20260917150000) introduziu o status 'generating'
-- (claimGenerationJob, _shared/onboardingOrchestration.ts) mas a CHECK
-- constraint existente em profiles.plan_generation_status só permitia
-- 'pending'/'ok'/'failed' -- toda reivindicação atômica falhava com
-- "violates check constraint profiles_plan_generation_status_check".
-- Rollback: reverter pro CHECK antigo (sem 'generating') só depois de
-- reverter também claimGenerationJob, senão a reivindicação volta a falhar.
ALTER TABLE profiles DROP CONSTRAINT profiles_plan_generation_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_generation_status_check
  CHECK (plan_generation_status = ANY (ARRAY['pending'::text, 'generating'::text, 'ok'::text, 'failed'::text]));
