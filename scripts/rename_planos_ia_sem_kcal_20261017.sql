-- ============================================================================
-- 2026-10-17 -- tira a kcal do nome dos 5 planos alimentares gerados por IA.
-- Decisão da Taina: o nome prometia a meta ("… – 1525 kcal") e nenhum cardápio
-- a atinge (média −6%; ver docs/POS_PILOTO.md, "Gerador de cardápio"). A faixa
-- real passa a ser calculada na hora no /plano/ e no dashboard. O gerador
-- (ybytu-generate-meal-plan) deixa de pôr kcal no nome dos planos novos.
--
-- Escopo: só os planos mp_ai_* (planos de aluno). Os 300 planos de catálogo
-- (mp_001..mp_300) não foram tocados.
--
-- Desfazer (nomes antigos):
--   mp_ai_2cf6a3ef  Plano IA – Emagrecimento – 1798 kcal
--   mp_ai_4cc9bf08  Plano IA – Emagrecimento – 1467 kcal
--   mp_ai_7458d485  Plano IA – Emagrecimento – 1525 kcal
--   mp_ai_78fba644  Plano IA – Emagrecimento – 1615 kcal
--   mp_ai_c2d2c8aa  Plano IA – Emagrecimento – 1798 kcal
-- ============================================================================
BEGIN;

UPDATE public.meal_plans
SET name_ptbr = regexp_replace(name_ptbr, ' – [0-9]+ kcal$', '')
WHERE meal_plan_id LIKE 'mp_ai_%'
  AND name_ptbr ~ ' – [0-9]+ kcal$';

SELECT meal_plan_id, name_ptbr FROM public.meal_plans WHERE meal_plan_id LIKE 'mp_ai_%' ORDER BY 1;

COMMIT;
