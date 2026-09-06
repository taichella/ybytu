-- ============================================================================
-- 2 exercicios cujo arquivo no Drive nao existe mais -- confirmado abrindo os
-- dois links (HTTP 404 puro, sem corpo de pagina, assinatura de arquivo
-- deletado/ID invalido, nao de permissao revogada -- pagina de "solicitar
-- acesso" do Drive normalmente vem como HTTP 200, nao 404).
--
-- Achado durante a varredura de nomes originais pra migracao R2 (2026-09-06),
-- nao durante busca deliberada por link quebrado -- mas o efeito e o mesmo
-- caso dos 7 exercicios com video errado (ver
-- scripts/video_url_null_ate_gravacao_nova_20260906.sql): botao de video que
-- nao abre e pior que nenhum botao. Mesma decisao, mesmo motivo.
--
-- ex_062 (Abdução em pé com miniband) e ex_068 (Sumô Deadlift com halteres) --
-- nenhum outro exercise_id compartilha esses IDs de arquivo, confirmado
-- contra o CSV exportado -- nulificar aqui nao afeta nenhum outro exercicio.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS exercises_video_url_backup_20260906_404 AS
SELECT exercise_id, video_url, now() AS backed_up_at
FROM exercises
WHERE exercise_id IN ('ex_062', 'ex_068');

UPDATE exercises
SET video_url = NULL
WHERE exercise_id IN ('ex_062', 'ex_068');

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM exercises
  WHERE exercise_id IN ('ex_062','ex_068') AND video_url IS NULL;
  IF n <> 2 THEN
    RAISE EXCEPTION 'Esperado 2 linhas com video_url NULL depois do UPDATE, achou %', n;
  END IF;
END $$;

COMMIT;

-- TODO (nao esquecer, junto com os 7 outros): quando existir video novo pra
-- estes 2, preencher video_url de novo.
