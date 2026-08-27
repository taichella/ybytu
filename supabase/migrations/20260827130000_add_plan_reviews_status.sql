-- Parecer atrelado ao plano (pedido da Taina 2026-08-27): hoje plan_reviews
-- só registra QUE um parecer foi dado (a linha existe), não SE foi aprovado
-- ou pediu ajuste. Nullable pra não quebrar as linhas antigas (sem status
-- retroativo, elas só não mostram badge de aprovado/ajuste na UI).
alter table plan_reviews add column if not exists status text
  check (status is null or status in ('approved', 'needs_changes'));
