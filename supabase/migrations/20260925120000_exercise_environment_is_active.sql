-- exercise_environment.is_active: desativar uma opção de ambiente SEM apagá-la.
-- Pedido 2026-09-25: "Ar livre" (outdoors) sai do onboarding mas pode voltar.
-- Antes: 0 perfis e 0 training_plans usavam outdoors (conferido na hora).
--
-- Quem deixa de ver a linha inativa: anon/authenticated (os dois onboardings,
-- widget WordPress e ybytu-app, leem a tabela direto com a chave anon). O
-- gerador e as functions de admin usam service_role (ignora RLS): continuam
-- enxergando a linha, o que permite ao gerador recusar um perfil antigo com
-- erro claro ('environment_inactive') em vez de gerar outro ambiente.
--
-- As duas policies de leitura duplicadas ("Leitura publica" pra public e
-- "public_read" pra anon/authenticated, ambas USING true) viram UMA só.
--
-- Reativar: UPDATE exercise_environment SET is_active = true
--           WHERE exercise_environment_id = 'outdoors';
-- (o ramo 'outdoors' continua em _shared/exerciseEnvironment.ts, sem deploy.)
-- Rollback completo: recriar as 2 policies com USING (true), DROP POLICY
-- exercise_environment_read_active, ALTER TABLE ... DROP COLUMN is_active.

BEGIN;

ALTER TABLE exercise_environment ADD COLUMN is_active boolean NOT NULL DEFAULT true;

UPDATE exercise_environment SET is_active = false WHERE exercise_environment_id = 'outdoors';

DROP POLICY IF EXISTS "Leitura publica" ON exercise_environment;
DROP POLICY IF EXISTS "public_read" ON exercise_environment;

CREATE POLICY exercise_environment_read_active ON exercise_environment
  FOR SELECT TO anon, authenticated
  USING (is_active);

DO $$
BEGIN
  IF (SELECT count(*) FROM exercise_environment WHERE is_active = false) <> 1 THEN
    RAISE EXCEPTION 'esperado exatamente 1 ambiente inativo (outdoors)';
  END IF;
END $$;

COMMIT;
