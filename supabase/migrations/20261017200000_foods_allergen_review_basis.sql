-- ============================================================================
-- 2026-10-17 -- origem da revisão de alergênicos em foods.
-- Decisão da Taina: a "IA nutricionista" é a mesma fonte das recomendações da
-- Sessão 1, não uma segunda opinião. Todo valor de revisão que entra no banco
-- grava DE ONDE veio, na mesma transação. Ver docs/POS_PILOTO.md, "A IA
-- nutricionista não é segunda opinião".
--
-- Valores:
--   carga_original      -- status veio da carga inicial do catálogo (montado
--                          com IA, jul/2026); nunca passou por profissional
--   preliminar_sem_crn  -- análise preliminar da IA, sem validação de CRN
--   revertido_sem_crn   -- foi marcado uma vez com análise preliminar e voltou
--                          para unreviewed até uma nutricionista com CRN confirmar
--   crn                 -- confirmado por nutricionista com CRN
--
-- Só adiciona colunas. Nenhum leitor atual depende delas.
-- Desfazer: scripts/rollback_20261017200000_foods_allergen_review_basis.sql
-- ============================================================================
BEGIN;

ALTER TABLE public.foods
  ADD COLUMN allergen_review_basis text NOT NULL DEFAULT 'carga_original'
    CHECK (allergen_review_basis IN ('carga_original', 'preliminar_sem_crn', 'revertido_sem_crn', 'crn')),
  ADD COLUMN allergen_review_basis_note text,
  ADD COLUMN allergen_review_basis_at timestamptz;

COMMENT ON COLUMN public.foods.allergen_review_basis IS
  'Origem do allergen_review_status: carga_original | preliminar_sem_crn | revertido_sem_crn | crn. Todo script que muda allergen_review_status grava esta coluna na mesma transação (decisão 2026-10-17).';

-- Os 37 alimentos que a Seção A da Sessão 1 (2026-09-13) tirou de unreviewed
-- com parecer preliminar sem CRN: registra a origem real antes de qualquer
-- reversão. Identificados pela diferença com o backup daquela aplicação.
UPDATE public.foods f
SET allergen_review_basis      = 'preliminar_sem_crn',
    allergen_review_basis_note = 'Sessão 1, Seção A, aplicada 2026-09-13 (scripts/aplicacao_sessao1_20260904.sql): análise preliminar sem validação de CRN.',
    allergen_review_basis_at   = '2026-09-13 15:04:56+00'
FROM public.foods_backup_20260904 b
WHERE b.food_id = f.food_id
  AND b.allergen_review_status IS DISTINCT FROM f.allergen_review_status;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.foods WHERE allergen_review_basis = 'preliminar_sem_crn';
  IF n <> 37 THEN
    RAISE EXCEPTION 'Esperava 37 alimentos preliminar_sem_crn, achei %', n;
  END IF;
END $$;

COMMIT;
