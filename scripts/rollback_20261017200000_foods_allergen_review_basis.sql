-- Desfaz supabase/migrations/20261017200000_foods_allergen_review_basis.sql.
-- ATENÇÃO: se scripts/reversao_37_alimentos_sem_crn_20261017.sql já rodou,
-- desfaça aquele primeiro (ele depende destas colunas para saber quais são os 37).
BEGIN;
ALTER TABLE public.foods
  DROP COLUMN allergen_review_basis_at,
  DROP COLUMN allergen_review_basis_note,
  DROP COLUMN allergen_review_basis;
COMMIT;
