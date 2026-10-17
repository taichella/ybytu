-- ============================================================================
-- APLICADO EM PRODUÇÃO 2026-10-17 (depois da migração 20261017200000), aprovado pela Taina.
-- 2026-10-17 -- REVERSÃO dos 37 alimentos marcados como revisados na Sessão 1
-- (2026-09-13) com análise preliminar sem validação de CRN.
-- Decisão da Taina (2026-10-17): voltam a "não verificado" até uma
-- nutricionista com CRN confirmar. Roda DEPOIS da migração
-- 20261017200000_foods_allergen_review_basis.sql.
--
-- O que muda:
--   foods.allergen_review_status  -> 'unreviewed' nos 37
--   foods.allergen_review_basis   -> 'revertido_sem_crn' (+ nota e data)
-- O que NÃO muda, de propósito:
--   food_restriction_tags: os 3 alimentos que ganharam soja/trigo/glúten na
--   Sessão 1 (food_221, food_238, food_443) MANTÊM essas marcas. Tirar marca de
--   alérgeno é tirar proteção; o gerador continua excluindo esses pratos para
--   quem declarou a alergia (meals.restriction_tags não muda).
--
-- Impacto medido 2026-10-17 (somente leitura): 74 refeições ativas usam algum
-- dos 37; 64 delas passam de "verificada" para "não verificado" (de 82 para 18
-- refeições ativas verificadas, num total de 100). Afeta os 5 alunos com plano
-- ativo (9 a 14 refeições no plano de cada um).
-- Efeito colateral do app hoje (buildPlanPayload.ts, deriveMealAllergens): um
-- ingrediente unreviewed não contribui para "Contém", então nos pratos com
-- food_221/238/443 o aluno vê "não verificado" no lugar de "Contém soja".
--
-- Desfazer (volta ao estado da Sessão 1, ainda marcado como preliminar):
--   UPDATE foods SET allergen_review_status = CASE WHEN EXISTS (SELECT 1 FROM
--     food_restriction_tags t WHERE t.food_id = foods.food_id)
--     THEN 'reviewed_has_allergens' ELSE 'reviewed_none' END,
--     allergen_review_basis = 'preliminar_sem_crn'
--   WHERE allergen_review_basis = 'revertido_sem_crn';
-- ============================================================================
BEGIN;

UPDATE public.foods
SET allergen_review_status     = 'unreviewed',
    allergen_review_basis      = 'revertido_sem_crn',
    allergen_review_basis_note = 'Marcado como revisado em 2026-09-13 com análise preliminar sem CRN (Sessão 1, Seção A); revertido em 2026-10-17 até nutricionista com CRN confirmar.',
    allergen_review_basis_at   = now()
WHERE allergen_review_basis = 'preliminar_sem_crn';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.foods WHERE allergen_review_basis = 'revertido_sem_crn' AND allergen_review_status = 'unreviewed';
  IF n <> 37 THEN
    RAISE EXCEPTION 'Esperava 37 revertidos, achei %', n;
  END IF;
END $$;

SELECT allergen_review_status, allergen_review_basis, count(*) FROM public.foods GROUP BY 1, 2 ORDER BY 1, 2;

COMMIT;
