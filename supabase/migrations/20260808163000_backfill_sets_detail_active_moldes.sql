-- Backfill de sets_detail pros 7 moldes ativos (tr_201-207), derivado das
-- colunas existentes sets/reps/rest_seconds -- lossless, porque hoje o
-- schema so' suporta reps/rest UNIFORME por serie dentro de um exercicio
-- (nunca existiu progressao tipo piramide gravada). load_kg fica null (o
-- gerador/moldes nao prescrevem carga -- ver [[project_plan_creators_schema_debt]]).
--
-- Verificado 2026-08-08 antes de rodar: nenhuma linha dos 7 moldes tem sets
-- NULL ou < 1 (generate_series(1,0) ou com NULL nao geraria linha,
-- resultando em sets_detail NULL/vazio silenciosamente).
--
-- Verificacao pos-backfill (rodada manualmente, nao repetida aqui):
--   sum(sets) = sum(jsonb_array_length(sets_detail)) = 427, 179 linhas, 0 nulas.
UPDATE training_plan_exercises
SET sets_detail = (
  SELECT jsonb_agg(jsonb_build_object(
    'set_number', gs,
    'reps', reps,
    'load_kg', null,
    'rest_seconds', rest_seconds,
    'set_type', 'normal'
  ))
  FROM generate_series(1, sets) AS gs
)
WHERE training_plan_id IN ('tr_201', 'tr_202', 'tr_203', 'tr_204', 'tr_205', 'tr_206', 'tr_207')
  AND sets_detail IS NULL;
