-- Corrige débito de dado: 11.165 linhas de meal_plan_meals (300 dos 302
-- meal_plans, todos os "Original" seedados em massa, não os criados por
-- ybytu-generate-meal-plan) gravaram meal_type_id como o UUID de
-- meal_types.id, quando todo consumidor (buildPlanPayload.ts, o gerador de
-- IA, o dashboard pro novo) espera o código texto de meal_types.meal_type_id
-- (ex: 'lunch', 'breakfast'). Efeito real confirmado testando o payload
-- público de um plano afetado: o usuário via o UUID cru no lugar de
-- "Almoço"/"Café da manhã" em todo dia do cardápio -- ver
-- [[project_meal_type_id_uuid_vs_text_bug]].
--
-- Mapeamento é total e sem ambiguidade (4 uuids distintos usados, cada um
-- bate com exatamente 1 meal_types.id, cobrindo os 4 meal_type_id reais:
-- breakfast/lunch/dinner/snack — confirmado antes de aplicar).
UPDATE meal_plan_meals mpm
SET meal_type_id = mt.meal_type_id
FROM meal_types mt
WHERE mpm.meal_type_id = mt.id::text;
