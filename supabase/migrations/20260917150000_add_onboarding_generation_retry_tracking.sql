-- Rastreamento de tentativas de geração de plano pós-onboarding.
-- Contexto: revisão de arquitetura do onboarding (2026-09-17) e caso real
-- "Rayan Road" -- onboarding completo pode ficar plan_generation_status=
-- 'pending' pra sempre sem NENHUMA rede de segurança detectar isso.
-- Rollback documentado em docs/ROLLBACK_PILOTO.md.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_generation_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.plan_generation_started_at IS
  'Timestamp de quando claimGenerationJob (_shared/onboardingOrchestration.ts) marcou status=generating nesta tentativa. Usado pra (a) detectar travamento (generating há mais de 10min = retomável) e (b) conferir se uma linha em user_training_plans/user_meal_plans pertence a ESTA execução (created_at >= este valor), não a uma tentativa anterior.';

COMMENT ON COLUMN profiles.plan_generation_attempts IS
  'Incrementado a cada reivindicação atômica (claimGenerationJob). Acima de 3, ybytu-onboarding-retry-cron para de tentar automaticamente -- perfil aparece em FailedPlans como "falhou 3x, precisa de ação manual". O botão de retry manual (ybytu-admin-retry-plan-generation) zera este contador antes de tentar de novo.';

-- Cron a cada 15min: retoma onboardings travados/falhos/pendentes há mais de
-- 10 min chamando ybytu-onboarding-retry-cron, que por sua vez chama
-- ybytu-onboarding-complete pra cada perfil elegível. Mesmo padrão de
-- autenticação do lembrete de parecer (20260805123000_fix_cron_internal_auth_secret.sql).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'ybytu_internal_function_secret'
  ) THEN
    RAISE EXCEPTION 'vault secret "ybytu_internal_function_secret" nao existe -- crie com select vault.create_secret(...) antes de aplicar esta migration';
  END IF;
END $$;

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
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
