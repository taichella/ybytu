-- ============================================================================
-- EXECUTADO em 2026-09-02, aprovado explicitamente pelo usuario. Os 12 foods
-- abaixo confirmados com food_group_id='mixed' via RETURNING apos o UPDATE.
-- Mantido aqui como registro/histórico, nao precisa rodar de novo.
--
-- Contexto: docs/CRITERIO_FOOD_GROUP_E_PROTEINA_20260902.md -- food_group_id
-- classifica por NATUREZA do alimento (predominancia de macro para alimento
-- simples, 'mixed' para prato composto), nunca por calculo. Estes 12 sao
-- pratos compostos (carboidrato "por fora", proteina embutida por dentro),
-- mesmo padrao ja usado corretamente em food_276/food_277/food_476 (ja
-- 'mixed'). Motivo da reclassificacao: SAO PRATO COMPOSTO, nao "tem proteina
-- escondida" -- essa segunda pergunta se responde com protein_g, nunca com
-- food_group_id (ver mesmo doc).
--
-- Achados na auditoria de 2026-09-02: nenhum codigo le food_group_id fora do
-- editor admin (ybytu-admin-foods/index.ts, so popula dropdown + campo
-- gravavel) -- sem consumidor de logica de negocio, sem risco de runtime,
-- sem necessidade de janela de deploy.
-- ============================================================================

UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_460'; -- Pizza de muçarela (fatia) -- massa de pizza (carb) + queijo (proteína) embutido, mesmo padrão de food_276/277/476
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_461'; -- Pizza de calabresa (fatia) -- massa de pizza (carb) + calabresa (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_462'; -- Hambúrguer Fast-Food (com pão e carne) -- pão (carb) + carne (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_463'; -- Cheeseburger Fast-Food -- pão (carb) + carne + queijo (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_465'; -- Cachorro-quente (com pão e salsicha) -- pão (carb) + salsicha (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_466'; -- Pastel de carne (frito) -- massa frita (carb) + carne (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_467'; -- Pastel de queijo (frito) -- massa frita (carb) + queijo (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_468'; -- Coxinha de frango (frita) -- massa/casca (carb) + frango (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_469'; -- Pão de queijo (fast-food/congelado) -- pão (carb) + queijo (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_472'; -- Macarrão com queijo (Mac and Cheese) -- macarrão (carb) + queijo (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_475'; -- Sushi (Salmão e Arroz) -- arroz (carb) + salmão (proteína) embutido
UPDATE foods SET food_group_id = 'mixed' WHERE food_id = 'food_477'; -- Burrito de frango e arroz -- tortilha + arroz (carb) + frango (proteína) embutido

-- food_464 (Batata frita Fast-Food), food_470 (Salgadinho de pacote) e
-- food_471 (Batata chips) FICAM DE FORA -- sao carboidrato puro sem proteína
-- embutida, food_group_id='carbohydrates' já está correto pra eles.
