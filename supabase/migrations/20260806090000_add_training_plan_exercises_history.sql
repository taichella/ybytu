-- Auditoria de edicoes em training_plan_exercises quando o training_plan
-- pai e' um dos 7 moldes ativos (tr_201-207). O gerador (ybytu-generate-
-- training-plan) le esses moldes AO VIVO a cada plano novo -- nao ha
-- snapshot/cache -- entao qualquer UPDATE num slot de molde muda o formato
-- de plano de todo usuario novo dali pra frente, pra ate 4 objetivos ao
-- mesmo tempo (conditioning/health_routine emprestam a estrutura do
-- weight_loss). Decisao com a Taina 2026-08-06: nao bloquear escrita nos
-- moldes (personal/admin precisam poder corrigir), mas manter um jeito de
-- reverter -- ver [[project_split_patterns_pending_validation]] e
-- [[project_training_conditioning_health_fallback_debt]].
CREATE TABLE training_plan_exercises_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_id  text NOT NULL,
  exercise_row_id   uuid NOT NULL,
  snapshot          jsonb NOT NULL,
  changed_by        uuid NOT NULL REFERENCES auth.users(id),
  changed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX training_plan_exercises_history_plan_idx ON training_plan_exercises_history (training_plan_id, changed_at DESC);

ALTER TABLE training_plan_exercises_history ENABLE ROW LEVEL SECURITY;
-- Deny-all, mesmo padrao de staff/plan_reviews -- so a Edge Function
-- (service_role) grava e le isso, nunca o client direto.
