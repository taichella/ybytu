-- Observabilidade de geração por IA (pedido da Taina 2026-08-27, depois de a
-- cota do Gemini estourar silenciosamente durante testes desta mesma sessão
-- -- degradação de IA->determinístico não tinha registro nenhum, só a
-- resposta HTTP momentânea, nunca persistida). Guarda quantos slots vieram de
-- IA vs. determinístico por plano, e o raciocínio cru (Groq/gpt-oss) quando
-- disponível -- log de auditoria, não exibido ao profissional ainda.
alter table training_plans
  add column if not exists ai_filled_slots int,
  add column if not exists deterministic_fallback_slots int,
  add column if not exists ai_reasoning text;

alter table meal_plans
  add column if not exists ai_filled_slots int,
  add column if not exists deterministic_fallback_slots int,
  add column if not exists ai_reasoning text;
