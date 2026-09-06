-- Slot pulado no gerador de treino: quando nenhum exercicio seguro cobre o
-- grupo muscular alvo de um slot, o gerador para de preencher com um
-- exercicio sem relacao (fallback alfabetico, achado 2026-09-04 -- ver
-- docs/ACHADO_DEGRADACAO_SILENCIOSA_20260904.md) e pula o slot em vez disso.
-- Essa coluna persiste QUAL slot foi pulado e por que, pra nao trocar um
-- silencio (exercicio errado disfarcado de certo) por outro (dia mais curto
-- sem explicacao). Mesmo padrao jsonb de caution_warnings.
alter table training_plans add column if not exists skipped_slots jsonb default '[]';
