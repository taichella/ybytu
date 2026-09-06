-- ============================================================================
-- NAO EXECUTADO -- preparado 2026-09-06, esperando confirmacao da Taina.
--
-- 7 exercicios com video_url apontando pro video ERRADO (confirmado abrindo
-- cada link do Drive e lendo o nome ORIGINAL do arquivo -- ver
-- docs/VIDEOS_ERRADOS_PARA_PERSONAL_20260906.csv). O video certo pra cada um
-- desses 7 ainda nao existe (precisa gravacao nova, nao e conserto de dado).
--
-- Decisao (Taina, 2026-09-06): ate a gravacao nova existir, video_url=NULL e
-- nenhum botao e melhor que o botao mostrar o exercicio errado -- aluno vendo
-- Bird dog no lugar do Superman acha que o exercicio e aquele.
--
-- IMPORTANTE: isso NAO conserta o catalogo, so remove o dado errado. Cada um
-- destes 7 precisa entrar numa lista de "vídeo pendente" pra alguem lembrar
-- de voltar aqui quando a gravacao nova existir -- ver TODO ao final.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS exercises_video_url_backup_20260906 AS
SELECT exercise_id, video_url, now() AS backed_up_at
FROM exercises
WHERE exercise_id IN ('ex_236', 'ex_285', 'ex_170', 'ex_251', 'ex_215', 'ex_271', 'ex_099');

UPDATE exercises
SET video_url = NULL
WHERE exercise_id IN (
  'ex_236', -- Bird dog (video era do Superman, ex_235)
  'ex_285', -- Wall Ball (video era do Box Jump, ex_283)
  'ex_170', -- Elevação frontal com anilha (video era do Face pull no cross, ex_169)
  'ex_251', -- Remada com elástico, pegada fechada (video era do Y-W-T Raise, ex_250)
  'ex_215', -- Rosca na polia com barra reta, pegada supinada (video era da Rosca spider com halteres, ex_214)
  'ex_271', -- Treino intervalado na escada (video era do Elíptico, ex_270)
  'ex_099'  -- Corrida no lugar em ponta dos pés (video era do High knees, ex_287)
);

-- conferencia: devem ser exatamente 7 linhas afetadas
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM exercises
  WHERE exercise_id IN ('ex_236','ex_285','ex_170','ex_251','ex_215','ex_271','ex_099')
    AND video_url IS NULL;
  IF n <> 7 THEN
    RAISE EXCEPTION 'Esperado 7 linhas com video_url NULL depois do UPDATE, achou %', n;
  END IF;
END $$;

COMMIT;

-- TODO (nao esquecer): quando as gravacoes novas existirem, atualizar
-- video_url dos 7 exercicios acima com o link/chave do arquivo novo -- nao
-- basta gravar, precisa voltar aqui e preencher.
