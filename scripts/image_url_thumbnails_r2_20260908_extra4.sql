-- ============================================================================
-- EXECUTADO 2026-09-12 -- Taina confirmou que arrastou os 4 arquivos de
-- r2_thumbnails/ pro bucket videos no painel Cloudflare (preparado 2026-09-08,
-- mesma sessao do lote de 185, ver scripts/image_url_thumbnails_r2_20260908.sql).
--
-- Esses 4 exercicios (ex_272-275) ja tinham video_url apontando pro R2 antes
-- deste lote (nao fizeram parte da migracao de 185 -- ja estavam la), so
-- faltava a capa. Frame gerado localmente com ffmpeg a 40% da duracao do
-- video publico no R2, mesmo processo e mesma resolucao (2160x3840) dos 185
-- anteriores. Ver conversa 2026-09-08.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS exercises_image_url_backup_20260908_r2 (
  exercise_id text, image_url text, backed_up_at timestamptz
);

INSERT INTO exercises_image_url_backup_20260908_r2 (exercise_id, image_url, backed_up_at)
SELECT e.exercise_id, e.image_url, now()
FROM exercises e
WHERE e.exercise_id IN ('ex_272', 'ex_273', 'ex_274', 'ex_275')
  AND NOT EXISTS (
    SELECT 1 FROM exercises_image_url_backup_20260908_r2 b WHERE b.exercise_id = e.exercise_id
  );

UPDATE exercises e SET image_url = v.r2_key
FROM (VALUES
  ('ex_272', 'BATTLE ROPE_2.jpg'),
  ('ex_273', 'ASSAULT BIKE_2.jpg'),
  ('ex_274', 'HALF BURPEE_2.jpg'),
  ('ex_275', 'HALF BURPEE ADAPTADO_2.jpg')
) AS v(exercise_id, r2_key)
WHERE e.exercise_id = v.exercise_id;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM exercises WHERE exercise_id IN ('ex_272','ex_273','ex_274','ex_275') AND image_url IN ('BATTLE ROPE_2.jpg','ASSAULT BIKE_2.jpg','HALF BURPEE_2.jpg','HALF BURPEE ADAPTADO_2.jpg');
  IF n <> 4 THEN
    RAISE EXCEPTION 'Esperado 4 exercicios atualizados, achou %', n;
  END IF;
END $$;

COMMIT;
