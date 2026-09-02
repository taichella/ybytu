-- NAO EXECUTADO AINDA -- aguardando confirmacao explicita antes de aplicar
-- (nem via `supabase db push` nem manualmente no Studio).
--
-- meals.meal_type nunca teve FK/CHECK. A RPC ybytu_match_meals trata
-- qualquer valor fora de breakfast/lunch/dinner como 'snack' silenciosamente
-- (CASE ... ELSE q_snack END) -- mesmo padrao de fail-open ja visto duas
-- vezes neste catalogo (array vazio de alergeno virando "seguro";
-- allergen_review_status ausente virando "sem alergeno"). Um typo futuro no
-- admin (campo livre em MealEditor.jsx, sem validacao) cairia nesse bucket
-- sem erro nenhum -- cota calorica errada em silencio, nao um erro visivel.
--
-- Verificado 2026-09-02: os 200 registros atuais de `meals` batem
-- exatamente nos 4 valores esperados (lunch:61, snack:51, dinner:50,
-- breakfast:38) -- zero violacao, aplicado com seguranca.
--
-- APLICADO em 2026-09-02.
--
-- PENDENCIA DE INTERFACE REGISTRADA (nao implementada, fora de escopo aqui):
-- meal_types tem 5 valores, nao 4 -- o 5o e 'dessert' ("Sobremesa"),
-- disponivel no dropdown de MealEditor.jsx (populado de lookups.meal_types)
-- mas NUNCA usado em nenhuma meal existente e NAO referenciado em nenhum
-- lugar do codigo (RPC ybytu_match_meals, buildPlanPayload) -- ja era opcao
-- morta antes desta constraint, so caia silenciosamente no bucket de lanche
-- via `ELSE q_snack`. Com a constraint, selecionar "Sobremesa" no editor e
-- salvar agora falha com erro de constraint do banco em vez de salvar
-- errado em silencio -- troca defensavel (falha visivel > falha silenciosa),
-- mas ainda deixa a nutricionista/admin ver mensagem tecnica em vez de
-- simplesmente nao conseguir escolher a opcao. Correcao futura (nao feita
-- aqui): remover 'dessert' do dropdown, ou dar suporte real a ele em toda a
-- pipeline (RPC + payload) e incluir no CHECK.

ALTER TABLE public.meals
  ADD CONSTRAINT meals_meal_type_check
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));
