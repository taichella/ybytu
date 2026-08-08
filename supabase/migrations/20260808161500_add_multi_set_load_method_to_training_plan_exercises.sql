-- Suporte a multiplas series por exercicio + carga sugerida + metodo
-- (bi-set/drop-set) no construtor de treino. Decisao 2026-08-08 (Taina):
-- jsonb aditivo, nao tabela filha -- a serie so e' lida/escrita como bloco
-- inteiro de um exercicio, nunca filtrada por serie individual entre planos.
--
-- sets/reps/rest_seconds continuam existindo e sendo gravados como sempre
-- (resumo/1a serie) -- nenhum consumidor existente (gerador, buildPlanPayload,
-- ybytu-get-plan-for-staff, UserPlan.jsx) precisa mudar pra este passo nao
-- quebrar nada. sets_detail e' aditivo puro, nullable, ignorado por quem
-- ainda nao sabe dele.
--
-- Formato de sets_detail (quando presente):
--   [{ "set_number": 1, "reps": 12, "load_kg": null, "rest_seconds": 90, "set_type": "normal" }, ...]
--   set_type: 'normal' | 'dropset' | 'warmup'
--   load_kg: carga SUGERIDA/inicial que o profissional pode prescrever no
--     molde/plano -- NAO e' a carga real individual do aluno (essa fica pra
--     uma estrutura futura separada, nao existe hoje). Ver
--     [[project_plan_creators_schema_debt]] pra contexto da decisao.
--
-- method_id/superset_group agrupam SLOTS (exercicios), nao series -- ex:
-- dois slots consecutivos com o mesmo superset_group e method_id='bi_set'
-- significam "execute em sequencia, sem descanso entre eles". Enum pequeno
-- e fixo, tratado em codigo (nao vale tabela de lookup pra 3-4 valores),
-- mesma convencao de GOAL_LABEL_PTBR em ybytu-generate-training-plan.
ALTER TABLE training_plan_exercises
  ADD COLUMN sets_detail jsonb,
  ADD COLUMN method_id text,
  ADD COLUMN superset_group smallint;
