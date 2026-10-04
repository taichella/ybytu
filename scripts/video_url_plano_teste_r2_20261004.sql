-- ============================================================================
-- NAO EXECUTADO -- preparado 2026-10-04, aguardando a Taina escolher as
-- versoes de ex_001 e ex_002 (assistir os links do R2 antes).
--
-- Troca o video_url dos 5 exercicios do plano de teste que ainda apontavam
-- pro Google Drive (no PWA o <video> nao toca link de Drive). Todos estao no
-- grupo "ambiguo" de docs/R2_REVISAO_MANUAL_20260908.md; os arquivos abaixo
-- existem no bucket (HEAD 200 video/mp4 em 2026-10-04).
--
-- ex_093 / ex_107: candidato unico, nome identico.
-- ex_095: a revisao de 09-08 agrupou com ex_093 (mesmo link de Drive), mas o
--         R2 tem arquivo proprio com o nome exato do exercicio.
-- ex_001 / ex_002: mais de uma versao no R2 -- descomentar UMA linha de cada.
--
-- So video_url: miniaturas (_2.jpg) desses arquivos ainda nao existem no R2
-- (HEAD 404), image_url fica como esta. Grava a CHAVE do objeto, nao a URL
-- (resolveR2Media monta a URL). Backup na mesma tabela da migracao de 09-08.
-- ============================================================================

BEGIN;

INSERT INTO exercises_video_url_backup_20260908_r2 (exercise_id, video_url, backed_up_at)
SELECT exercise_id, video_url, now() FROM exercises
WHERE exercise_id IN ('ex_001', 'ex_002', 'ex_093', 'ex_095', 'ex_107')
  AND NOT EXISTS (
    SELECT 1 FROM exercises_video_url_backup_20260908_r2 b WHERE b.exercise_id = exercises.exercise_id
  );

UPDATE exercises e SET video_url = v.r2_key
FROM (VALUES
  -- ex_001 Agachamento livre -- escolher UMA:
  -- ('ex_001', 'AGACHAMENTOLIVRE 2_2.mp4'),
  -- ('ex_001', 'AGACHAMENTOLIVRE 2(1)_2.mp4'),
  -- ('ex_001', 'AGACHAMENTOLIVRE_1_2.mp4'),
  -- ex_002 Avanço (afundo) com peso corporal -- escolher UMA:
  -- ('ex_002', 'AVANCOCOMPESOCORPORAL_1_2.mp4'),
  -- ('ex_002', 'AVANCOCOMPESOCORPORAL_3.mp4'),
  ('ex_093', 'ELEVACAO DE PANTURRILHA NO CHAO_2.mp4'),
  ('ex_095', 'ELEVACAO DE PANTURRILHA COM HALTERES_2.mp4'),
  ('ex_107', 'PRANCHA FRONTAL_2.mp4')
) AS v(exercise_id, r2_key)
WHERE e.exercise_id = v.exercise_id
  AND e.video_url ILIKE '%drive.google%';

-- Conferencia: 5 linhas, nenhuma com drive.google
SELECT exercise_id, name_ptbr, video_url FROM exercises
WHERE exercise_id IN ('ex_001', 'ex_002', 'ex_093', 'ex_095', 'ex_107')
ORDER BY exercise_id;

COMMIT;
