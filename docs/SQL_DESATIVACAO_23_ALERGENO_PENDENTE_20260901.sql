-- ============================================================================
-- NAO EXECUTAR sem aprovacao da nutricionista / responsavel de catalogo.
-- Este arquivo eh apenas REDACAO do UPDATE para revisao humana. Nao foi
-- rodado contra o banco. Acesso usado para levantar os dados foi somente
-- leitura (npx supabase db query --linked, sem INSERT/UPDATE/DELETE).
--
-- Contexto: 23 refeicoes ativas hoje no catalogo levam ingrediente de
-- alergeno (gluten, leite, ovo, castanha/amendoim, soja) que o nome da
-- receita nao anuncia -- mesmo padrao do caso ja confirmado e corrigido em
-- 2026-08-31 (meal_005, "Vitamina de Abacate Tradicional", ver
-- docs/REVISAO_NUTRICIONISTA_meal_leite_sem_tag_20260831.md).
-- Detalhe completo de cada uma (ingredientes, gramagem, alergeno) em
-- docs/ALERGENO_NAO_ANUNCIADO_ATIVAS_20260901.md.
--
-- NOTA DE CONTAGEM: o pedido original citava "23 ativas" mas a enumeracao
-- literal de meal_ids continha 22 IDs unicos. meal_042 (Pao de Queijo de
-- Frigideira: ovo nao anunciado, queijo/laticinio ja esta no nome) foi
-- identificada na revarredura como a 23a, mesmo criterio dos outros 22 --
-- incluida aqui para fechar o numero declarado. Ver nota no topo de
-- docs/ALERGENO_NAO_ANUNCIADO_ATIVAS_20260901.md.
--
-- ATUALIZACAO 2026-09-01: a lista virou 26. Investigando food_420 (Whey
-- Protein Concentrado) na revisao de alergenos do catalogo completo,
-- apareceram 3 refeicoes ativas novas que a varredura original (por nome de
-- receita) nao capturou -- porque essa investigacao partiu do ingrediente,
-- nao do nome: meal_022 (leite duplo -- whey E leite desnatado direto --
-- mais soja via whey), meal_043 (o caso mais grave do documento inteiro:
-- leite + soja + OVO, 3 alergenos escondidos numa unica refeicao), meal_053
-- (soja via whey sempre; leite tratado como nao anunciado porque "Whey" no
-- nome so comunica laticinio pra quem conhece jargao fitness -- nutricionista
-- pode discordar, ver justificativa completa no Doc A).
--
-- ALERTA DE COBERTURA (recalculado com as 26, ver "Impacto de cobertura" no
-- Doc A): as 3 novas caem nas combinacoes de maior folga do catalogo
-- (vegetarian x breakfast, vegetarian x snack) e NAO mudam o quadro de risco.
-- Continuam sendo as mesmas 3 de antes, e so elas, que deixam a combinacao
-- preferencia-alimentar x tipo de refeicao com 1 opcao ou ZERO restantes:
--   meal_081 (Pizza de Frigideira com Massa de Aveia) -> vegetarian x dinner: resta 1
--   meal_092 (Wrap Frio de Atum Rapido)               -> pescetarian x lunch:  resta 1
--   meal_114 (Tilapia Empanada na Aveia)               -> pescetarian x dinner: resta 0 (ZERA a categoria)
-- Recomendacao: nao rodar a desativacao dessas 3 sem repor opcao equivalente
-- antes, ou sem confirmar que a nutricionista aceita o corte de cobertura.
-- As outras 23 nao tem esse risco (sobra >= 4 opcoes na mesma combinacao).
--
-- Sobre os moinhos/molhos do lote "unreviewed" (food_380/383/395, 13 usos
-- ativos combinados): NAO estao neste SQL. Decisao tomada de esperar a
-- revisao dos 3 itens de catalogo em vez de desativar 13 refeicoes -- ver
-- docs/REVISAO_NUTRICIONISTA_ALERGENOS_486_FOODS_20260901.md.
-- ============================================================================

-- Opcao A -- as 26 completas, como pedido (inclui as 3 de risco de cobertura acima)
UPDATE meals
SET is_active = false
WHERE meal_id IN (
  -- padrao "vitamina/batido/whey escondendo leite" -- prioridade, sem risco de cobertura
  'meal_046', 'meal_100', 'meal_165', 'meal_176',
  'meal_022', 'meal_043', 'meal_053',
  -- demais 19 identificadas originalmente
  'meal_002', 'meal_003', 'meal_026', 'meal_054', 'meal_063',
  'meal_081', 'meal_082', 'meal_092', 'meal_103', 'meal_114',
  'meal_127', 'meal_136', 'meal_151', 'meal_156', 'meal_192',
  'meal_194', 'meal_198', 'meal_200',
  -- 23a, adicionada na revarredura para fechar a contagem original (ver nota acima)
  'meal_042'
);

-- Opcao B -- apenas as 23 sem risco de cobertura, segurando as 3 sensiveis
-- (meal_081, meal_092, meal_114) ate haver reposicao. Recomendada como
-- primeiro passo se a aprovacao preferir ir por etapas.
-- UPDATE meals
-- SET is_active = false
-- WHERE meal_id IN (
--   'meal_046', 'meal_100', 'meal_165', 'meal_176',
--   'meal_022', 'meal_043', 'meal_053',
--   'meal_002', 'meal_003', 'meal_026', 'meal_054', 'meal_042',
--   'meal_063', 'meal_082', 'meal_103', 'meal_127', 'meal_136',
--   'meal_151', 'meal_156', 'meal_192', 'meal_194', 'meal_198', 'meal_200'
-- );
