-- ============================================================================
-- Cria o token 'coco' e a opcao "Sem Coco" no onboarding, SEM mexer em
-- tree_nuts -- decisao final de produto (Taina, 2026-09-13), substitui a
-- proposta anterior registrada em scripts/aplicacao_sessao1_20260904.sql
-- Bloco 2b (que propunha REMOVER tree_nuts do coco -- nao removido mais,
-- ver nota la).
--
-- Motivo da mudanca de decisao: da pra ter os dois ao mesmo tempo sem tirar
-- nada de ninguem -- quem tem alergia a coco isolada ganha uma opcao propria
-- ("Sem Coco"), quem ja marca "Sem Oleaginosas" continua protegido como hoje
-- (tree_nuts intacto nos 7 alimentos ja revisados). O unico custo e excesso
-- de cautela (coco continua excluido do cardapio de quem so tem alergia a
-- castanha de verdade, mesmo nao sendo botanicamente uma noz) -- reversivel
-- depois, sem pressa, quando a nutricionista com CRN revisar.
--
-- Roda FORA da Secao A (aplicacao_sessao1_20260904.sql) -- nao depende de
-- nenhuma resposta da nutricionista, e decisao de produto isolada, sem
-- placeholder pra preencher. food_402 (Agua de coco) NAO e tocado aqui --
-- volta a ser uma pergunta normal do Bloco 3 daquele script.
--
-- EXECUTADO 2026-09-13.
-- ============================================================================

BEGIN;

-- 1. Vocabulario -- token precisa existir antes de qualquer food_restriction_tags
-- usar 'coco' (a guarda do Bloco 3/4 da Sessao 1 valida contra esta tabela).
INSERT INTO restriction_tokens (token)
VALUES ('coco')
ON CONFLICT DO NOTHING;

-- 2. Opcao selecionavel no onboarding -- Onboarding.js busca esta tabela
-- dinamicamente (supabase.from(step.table).select('*')), nenhum deploy de
-- app necessario. dietary_restriction_id nao tem constraint UNIQUE (so `id`
-- uuid e PK, conferido 2026-09-12) -- por isso INSERT...WHERE NOT EXISTS em
-- vez de ON CONFLICT.
INSERT INTO dietary_restrictions (dietary_restriction_id, name_ptbr, excludes_tokens, is_active)
SELECT 'coconut_free', 'Sem Coco', ARRAY['coco'], true
WHERE NOT EXISTS (SELECT 1 FROM dietary_restrictions WHERE dietary_restriction_id = 'coconut_free');

-- Verificacao: token criado, opcao criada e ATIVA, e tree_nuts continua
-- intacto nos 7 alimentos de coco ja revisados (nada deveria ter mudado ali).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM restriction_tokens WHERE token = 'coco';
  IF n <> 1 THEN
    RAISE EXCEPTION 'token coco nao foi criado';
  END IF;

  SELECT count(*) INTO n FROM dietary_restrictions
  WHERE dietary_restriction_id = 'coconut_free' AND is_active = true AND excludes_tokens = ARRAY['coco'];
  IF n <> 1 THEN
    RAISE EXCEPTION 'opcao coconut_free nao foi criada corretamente';
  END IF;

  SELECT count(*) INTO n FROM foods f
  JOIN food_restriction_tags frt ON frt.food_id = f.food_id AND frt.token = 'tree_nuts'
  WHERE f.name_ptbr ILIKE '%coco%';
  IF n <> 7 THEN
    RAISE EXCEPTION 'tree_nuts nos alimentos de coco mudou -- esperado 7 (os ja revisados), achou %', n;
  END IF;
END $$;

COMMIT;
