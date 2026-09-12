-- ============================================================================
-- EXECUTADO 2026-09-12 -- confirmado visualmente pela Taina (preparado
-- 2026-09-08, esperando confirmacao visual).
--
-- Os 3 exercicios abaixo foram zerados em 2026-09-06 como "arquivo Drive
-- inexistente" (HTTP 404 puro, ver scripts/video_url_null_404_drive_20260906.sql).
-- Cruzando o name_ptbr (nao o arquivo original, que ja estava vazio nesses 3
-- quando o CSV foi exportado) contra a listagem do bucket R2, apareceram
-- candidatos quase identicos -- ver docs/R2_REVISAO_MANUAL_20260908.md,
-- secao "ACHADO CRITICO". Pode significar que os videos nao estavam
-- perdidos de verdade -- so nao dava mais pra ver pelo link do Drive.
--
-- ex_179: candidato unico, nome identico (distancia zero) -- linha abaixo
-- ja fixa, nao precisa escolher nada, so confirmar visualmente.
--
-- ex_062: candidato unico, falta "MINI" no nome do arquivo (miniband -> band)
-- -- linha abaixo ja fixa, so confirmar visualmente.
--
-- ex_068: DOIS candidatos (mesmo typo "DEADELIFT" nos dois) -- escolher qual
-- das duas linhas comentadas abaixo usar DEPOIS de abrir os dois arquivos.
-- Sao possivelmente 2 takes do mesmo exercicio ou 2 coisas diferentes.
-- ============================================================================

BEGIN;

INSERT INTO exercises_video_url_backup_20260908_r2 (exercise_id, video_url, backed_up_at)
SELECT exercise_id, video_url, now() FROM exercises
WHERE exercise_id IN ('ex_062', 'ex_068', 'ex_179')
  AND NOT EXISTS (
    SELECT 1 FROM exercises_video_url_backup_20260908_r2 b WHERE b.exercise_id = exercises.exercise_id
  );

UPDATE exercises SET video_url = 'CRUCIFIXO COM HALTERES DEITADO_2.mp4' WHERE exercise_id = 'ex_179';
UPDATE exercises SET video_url = 'ABDUCAO EM PE COM BAND_2.mp4'         WHERE exercise_id = 'ex_062';

-- ex_068 -- Taina escolheu a variante sem "(1)" (2026-09-12):
UPDATE exercises SET video_url = 'SUMO DEADELIFT COM HALTERES_2.mp4'       WHERE exercise_id = 'ex_068';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM exercises
  WHERE exercise_id IN ('ex_062','ex_068','ex_179') AND video_url IS NOT NULL;
  IF n <> 3 THEN
    RAISE EXCEPTION 'Esperado 3 linhas com video_url preenchido depois do UPDATE (confirme que descomentou uma linha do ex_068), achou %', n;
  END IF;
END $$;

COMMIT;
