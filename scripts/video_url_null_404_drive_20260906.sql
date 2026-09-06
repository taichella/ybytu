-- ============================================================================
-- 3 exercicios cujo arquivo no Drive nao existe mais -- confirmado abrindo os
-- tres links (HTTP 404 puro, sem corpo de pagina, assinatura de arquivo
-- deletado/ID invalido, nao de permissao revogada -- pagina de "solicitar
-- acesso" do Drive normalmente vem como HTTP 200, nao 404).
--
-- Achado durante a varredura de nomes originais pra migracao R2 (2026-09-06),
-- nao durante busca deliberada por link quebrado -- mas o efeito e o mesmo
-- caso dos 7 exercicios com video errado (ver
-- scripts/video_url_null_ate_gravacao_nova_20260906.sql): botao de video que
-- nao abre e pior que nenhum botao. Mesma decisao, mesmo motivo.
--
-- ex_062 (Abdução em pé com miniband), ex_068 (Sumô Deadlift com halteres) e
-- ex_179 (Crucifixo com halteres deitado, achado no restante da varredura) --
-- nenhum outro exercise_id compartilha esses 3 IDs de arquivo, confirmado
-- contra o CSV exportado -- nulificar aqui nao afeta nenhum outro exercicio.
--
-- Varredura completa dos 293 concluida sem sinal de bloqueio (sem CAPTCHA,
-- sem sequencia de 404): total 3 de 293, isolados -- nao ha indicio de que
-- alguem tenha mexido na pasta inteira do Drive.
-- ============================================================================

BEGIN;

-- Tabela ja existe da 1a rodada (ex_062/ex_068) -- CREATE TABLE IF NOT EXISTS
-- AS SELECT nao faz nada se a tabela ja existe (nem roda o SELECT), entao o
-- backup do novo (ex_179) precisa de um INSERT explicito, guardado por
-- NOT EXISTS pra nao duplicar se este script rodar de novo.
CREATE TABLE IF NOT EXISTS exercises_video_url_backup_20260906_404 (
  exercise_id text, video_url text, backed_up_at timestamptz
);

INSERT INTO exercises_video_url_backup_20260906_404 (exercise_id, video_url, backed_up_at)
SELECT e.exercise_id, e.video_url, now()
FROM exercises e
WHERE e.exercise_id IN ('ex_062', 'ex_068', 'ex_179')
  AND NOT EXISTS (
    SELECT 1 FROM exercises_video_url_backup_20260906_404 b WHERE b.exercise_id = e.exercise_id
  );

UPDATE exercises
SET video_url = NULL
WHERE exercise_id IN ('ex_062', 'ex_068', 'ex_179');

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM exercises
  WHERE exercise_id IN ('ex_062','ex_068','ex_179') AND video_url IS NULL;
  IF n <> 3 THEN
    RAISE EXCEPTION 'Esperado 3 linhas com video_url NULL depois do UPDATE, achou %', n;
  END IF;
END $$;

COMMIT;

-- TODO (nao esquecer, junto com os 7 outros): quando existir video novo pra
-- estes 3, preencher video_url de novo.
