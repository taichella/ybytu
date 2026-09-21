-- 2026-09-21 -- equipamento cadastrado discordava do nome do exercicio (aprovado pela Taina).
-- Impacto medido antes: nenhum training_plan (molde ou de aluno) contem estes exercicios.
-- Efeito: a tag de ambiente e o filtro do gerador passam a tratar ex_113/129/170/223 como
-- "Só academia" (antes: ab_wheel/bar_fixed_bar caiam em "Casa (com equipamento)").

UPDATE exercises SET exercise_equipments_ids = ARRAY['bench','dumbbells'], load_type = 'weighted' WHERE exercise_id = 'ex_132';
UPDATE exercises SET exercise_equipments_ids = ARRAY['crunch_machine']  WHERE exercise_id IN ('ex_113','ex_129');
UPDATE exercises SET exercise_equipments_ids = ARRAY['weight_plate']    WHERE exercise_id = 'ex_170';
UPDATE exercises SET exercise_equipments_ids = ARRAY['assisted_pull_up'] WHERE exercise_id = 'ex_223';

-- ROLLBACK (valores anteriores):
-- UPDATE exercises SET exercise_equipments_ids = ARRAY['none_bodyweight'], load_type = 'bodyweight' WHERE exercise_id = 'ex_132';
-- UPDATE exercises SET exercise_equipments_ids = ARRAY['ab_wheel']        WHERE exercise_id IN ('ex_113','ex_129');
-- UPDATE exercises SET exercise_equipments_ids = ARRAY['bar_fixed_bar']   WHERE exercise_id IN ('ex_170','ex_223');

-- 2026-09-21 (2o passo, aprovado pela Taina): ex_113 e ex_129 sao "na maquina" -> load_type machine
-- (carga em kg). Nenhum plano usava estes exercicios.
UPDATE exercises SET load_type = 'machine' WHERE exercise_id IN ('ex_113','ex_129');
-- ROLLBACK: UPDATE exercises SET load_type = 'bodyweight' WHERE exercise_id IN ('ex_113','ex_129');
