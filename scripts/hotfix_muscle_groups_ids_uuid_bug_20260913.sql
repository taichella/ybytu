-- ============================================================================
-- HOTFIX -- corrige bug introduzido pela propria execucao da Secao B
-- (scripts/aplicacao_sessao1_secao_b_personal_20260913.sql) minutos atras,
-- 2026-09-13.
--
-- O UPDATE de B1 (copiado verbatim do script original
-- aplicacao_sessao1_20260904.sql, nunca reauditado) fazia:
--   SET muscle_groups_ids = (SELECT array_agg(mg.id) FROM muscle_groups mg ...)
-- `mg.id` e o uuid (PK) de muscle_groups -- mas exercises.muscle_groups_ids
-- guarda SLUG texto (muscle_group_id), nao uuid, confirmado contra
-- supabase/functions/_shared/buildPlanPayload.ts (labelMapBySlug) e contra o
-- valor real de ex_013/ex_285 ANTES do update de hoje (["quadriceps"],
-- ["full_body"], texto puro). Os 9 exercise_id da B1 ficaram com array de
-- uuid na coluna errada -- quebra o filtro de pool do gerador pra esses 9
-- ate este hotfix rodar.
--
-- Backup ja existe (exercises_muscle_groups_backup_20260904, criado
-- 2026-09-13 08:26:19 UTC pela propria Secao B) -- mas tem o valor ANTIGO
-- (incompleto/errado), nao o valor CORRIGIDO que o personal pediu. Este
-- hotfix nao restaura do backup -- aplica a MESMA decisao do personal
-- (identica a decisao_muscle_groups da Secao B), so que como array de slug
-- texto, formato certo.
-- ============================================================================

BEGIN;

UPDATE exercises SET muscle_groups_ids = ARRAY['hamstrings','glutes']                                      WHERE exercise_id = 'ex_050';
UPDATE exercises SET muscle_groups_ids = ARRAY['hamstrings','glutes','core','stabilizers']                 WHERE exercise_id = 'ex_078';
UPDATE exercises SET muscle_groups_ids = ARRAY['glutes','hamstrings']                                       WHERE exercise_id = 'ex_079';
UPDATE exercises SET muscle_groups_ids = ARRAY['hamstrings','glutes','quadriceps','core']                   WHERE exercise_id = 'ex_054';
UPDATE exercises SET muscle_groups_ids = ARRAY['glutes','posterior_chain']                                  WHERE exercise_id = 'ex_083';
UPDATE exercises SET muscle_groups_ids = ARRAY['triceps_brachii','chest','deltoids','core','biceps_brachii'] WHERE exercise_id = 'ex_194';
UPDATE exercises SET muscle_groups_ids = ARRAY['triceps_brachii','chest','deltoids','core','biceps_brachii'] WHERE exercise_id = 'ex_216';
UPDATE exercises SET muscle_groups_ids = ARRAY['full_body']                                                  WHERE exercise_id = 'ex_013';
UPDATE exercises SET muscle_groups_ids = ARRAY['full_body']                                                  WHERE exercise_id = 'ex_285';

DO $$
DECLARE n int; invalidos text;
BEGIN
  SELECT count(*) INTO n FROM exercises
  WHERE exercise_id IN ('ex_050','ex_078','ex_079','ex_054','ex_083','ex_194','ex_216','ex_013','ex_285');
  IF n <> 9 THEN
    RAISE EXCEPTION 'Esperado 9 exercicios, achou %', n;
  END IF;

  -- garante que NENHUM dos 9 tem uuid (formato de string com hifen tipico de
  -- uuid) sobrando dentro do array -- pega qualquer residuo do bug.
  SELECT string_agg(exercise_id, ', ') INTO invalidos
  FROM exercises, unnest(muscle_groups_ids) AS slug
  WHERE exercise_id IN ('ex_050','ex_078','ex_079','ex_054','ex_083','ex_194','ex_216','ex_013','ex_285')
    AND slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  IF invalidos IS NOT NULL THEN
    RAISE EXCEPTION 'Ainda ha uuid dentro de muscle_groups_ids pra: %', invalidos;
  END IF;
END $$;

COMMIT;
