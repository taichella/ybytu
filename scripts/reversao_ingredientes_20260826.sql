-- ============================================================
-- SCRIPT DE REVERSAO -- 99 refeicoes com ingrediente errado
-- NAO EXECUTADO. Gerado para revisao antes de rodar.
-- Pre-requisito: aprovacao da nutricionista por padrao (ver
-- docs/APROVACAO_NUTRICIONISTA_REVERSAO.md) + decisao sobre os
-- 4 alimentos nao cadastrados (banana-da-terra, berinjela,
-- amido de milho cru, milho de pipoca cru).
-- ============================================================

BEGIN;

-- 1. BACKUP -- salva o ingredients_json ANTES de qualquer UPDATE,
--    pra dar pra reverter a reversao se algo sair errado.
CREATE TABLE IF NOT EXISTS meals_ingredients_backup_20260826 (
  meal_id text PRIMARY KEY,
  ingredients_json_before jsonb NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO meals_ingredients_backup_20260826 (meal_id, ingredients_json_before)
SELECT meal_id, ingredients_json FROM meals
WHERE meal_id IN (
  'meal_011', 'meal_012', 'meal_013', 'meal_014', 'meal_015', 'meal_017', 'meal_019', 'meal_020', 'meal_023', 'meal_027', 'meal_030', 'meal_032', 'meal_033', 'meal_034', 'meal_035', 'meal_036', 'meal_037', 'meal_038', 'meal_039', 'meal_045', 'meal_047', 'meal_055', 'meal_058', 'meal_061', 'meal_062', 'meal_065', 'meal_066', 'meal_067', 'meal_069', 'meal_071', 'meal_072', 'meal_073', 'meal_074', 'meal_075', 'meal_076', 'meal_077', 'meal_078', 'meal_079', 'meal_080', 'meal_083', 'meal_086', 'meal_088', 'meal_089', 'meal_090', 'meal_093', 'meal_098', 'meal_099', 'meal_101', 'meal_102', 'meal_104', 'meal_105', 'meal_106', 'meal_109', 'meal_110', 'meal_111', 'meal_112', 'meal_113', 'meal_115', 'meal_116', 'meal_117', 'meal_119', 'meal_122', 'meal_123', 'meal_124', 'meal_125', 'meal_128', 'meal_132', 'meal_133', 'meal_134', 'meal_135', 'meal_139', 'meal_140', 'meal_142', 'meal_143', 'meal_145', 'meal_146', 'meal_148', 'meal_149', 'meal_150', 'meal_152', 'meal_153', 'meal_155', 'meal_157', 'meal_158', 'meal_159', 'meal_167', 'meal_169', 'meal_171', 'meal_175', 'meal_180', 'meal_181', 'meal_182', 'meal_183', 'meal_184', 'meal_185', 'meal_189', 'meal_190', 'meal_195', 'meal_197'
)
ON CONFLICT (meal_id) DO NOTHING;

-- 2. CORRECOES -- uma UPDATE por refeicao, escopada por meal_id.
--    Nunca faz replace por nome/food_id em toda a tabela --
--    isso poderia corromper as ~101 refeicoes limpas que usam
--    os mesmos alimentos corretamente noutro contexto.

-- meal_011
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_011';
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_011';

-- meal_012
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_012';
-- feijão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_003' THEN jsonb_set(elem, '{id}', '"food_105"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_012';

-- meal_013
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_013';

-- meal_014
-- macarrão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_008' THEN jsonb_set(elem, '{id}', '"food_003"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_014';

-- meal_015
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_015';

-- meal_017
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_017';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_017';

-- meal_019
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_019';

-- meal_020
-- arroz→milho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_007' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_020';
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_020';

-- meal_023
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_023';

-- meal_027
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_027';

-- meal_030
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_030';
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_030';

-- meal_032
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_032';

-- meal_033
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_033';

-- meal_034
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_034';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_034';
-- feijão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_003' THEN jsonb_set(elem, '{id}', '"food_105"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_034';

-- meal_035
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_035';

-- meal_036
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_036';
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_036';

-- meal_037
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_037';

-- meal_038
-- abobrinha pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_020' THEN jsonb_set(elem, '{id}', '"food_032"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_038';

-- meal_039
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_039';

-- meal_045
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_045';

-- meal_047
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_047';
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_047';

-- meal_055
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_055';

-- meal_058
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_058';

-- meal_061
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_061';

-- meal_062
-- arroz→milho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_007' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_062';

-- meal_065
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_065';

-- meal_066
-- macarrão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_008' THEN jsonb_set(elem, '{id}', '"food_003"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_066';
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_066';

-- meal_067
-- feijão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_003' THEN jsonb_set(elem, '{id}', '"food_105"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_067';
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_067';

-- meal_069
-- abobrinha pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_020' THEN jsonb_set(elem, '{id}', '"food_032"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_069';

-- meal_071
-- mandioca pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_012' THEN jsonb_set(elem, '{id}', '"food_006"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_071';

-- meal_072
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_072';

-- meal_073
-- cogumelos pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_025' THEN jsonb_set(elem, '{id}', '"food_051"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_073';
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_073';

-- meal_074
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_074';

-- meal_075
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_075';

-- meal_076
-- INDIVIDUAL: melancia
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_082' THEN jsonb_set(elem, '{id}', '"food_083"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_076';

-- meal_077
-- couve/repolho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_023' THEN jsonb_set(elem, '{id}', '"food_074"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_077';

-- meal_078
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_078';

-- meal_079
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_079';

-- meal_080
-- cogumelos pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_025' THEN jsonb_set(elem, '{id}', '"food_051"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_080';

-- meal_083
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_083';

-- meal_086 -- ⚠️ PENDENTE: alimento novo, nao aplicar ate cadastrar/decidir aproximacao
--   PENDENTE (INDIVIDUAL: berinjela nao cadastrada): food_026 -> NEW_BERINJELA (alimento nao existe ainda)

-- meal_088
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_088';

-- meal_089 -- ⚠️ PENDENTE: alimento novo, nao aplicar ate cadastrar/decidir aproximacao
--   PENDENTE (INDIVIDUAL: milho de pipoca cru nao cadastrado): food_015 -> NEW_MILHO_PIPOCA_CRU (alimento nao existe ainda)

-- meal_090
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_090';
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_090';

-- meal_093
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_093';

-- meal_098
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_098';

-- meal_099
-- INDIVIDUAL: feijão fradinho (chain com meal_116)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_160' THEN jsonb_set(elem, '{id}', '"food_119"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_099';
-- tomate pattern (secundário)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_099';

-- meal_101
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_101';

-- meal_102
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_102';

-- meal_104
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_104';
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_104';

-- meal_105
-- pimentão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_022' THEN jsonb_set(elem, '{id}', '"food_069"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_105';

-- meal_106
-- mandioca pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_012' THEN jsonb_set(elem, '{id}', '"food_006"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_106';

-- meal_109
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_109';

-- meal_110
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_110';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_110';

-- meal_111
-- INDIVIDUAL: aspargos (mesmo alvo do espinafre)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_040"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_111';

-- meal_112 -- ⚠️ PENDENTE: alimento novo, nao aplicar ate cadastrar/decidir aproximacao
--   PENDENTE (INDIVIDUAL: banana-da-terra nao cadastrada (chain com laranja)): food_080 -> NEW_BANANA_DA_TERRA (alimento nao existe ainda)

-- meal_113
-- macarrão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_008' THEN jsonb_set(elem, '{id}', '"food_003"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_113';

-- meal_115
-- couve-flor pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_021' THEN jsonb_set(elem, '{id}', '"food_055"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_115';

-- meal_116
-- INDIVIDUAL: lentilha (chain com meal_099)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_011' THEN jsonb_set(elem, '{id}', '"food_160"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_116';
-- cogumelos pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_025' THEN jsonb_set(elem, '{id}', '"food_051"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_116';

-- meal_117
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_117';
-- cogumelos pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_025' THEN jsonb_set(elem, '{id}', '"food_051"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_117';

-- meal_119
-- tomate pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_119';
-- pimentão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_022' THEN jsonb_set(elem, '{id}', '"food_069"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_119';

-- meal_122
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_122';

-- meal_123
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_123';

-- meal_124
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_124';

-- meal_125
-- INDIVIDUAL: nozes
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_141' THEN jsonb_set(elem, '{id}', '"food_114"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_125';

-- meal_128
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_128';
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_128';

-- meal_133
-- macarrão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_008' THEN jsonb_set(elem, '{id}', '"food_003"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_133';

-- meal_134
-- mandioca pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_012' THEN jsonb_set(elem, '{id}', '"food_006"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_134';

-- meal_135
-- couve-flor pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_021' THEN jsonb_set(elem, '{id}', '"food_055"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_135';

-- meal_139
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_139';

-- meal_140
-- tomate pattern (fraco)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_140';

-- meal_142
-- tomate pattern (fraco) + bug técnico separado no instruction_ptbr
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_037' THEN jsonb_set(elem, '{id}', '"food_077"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_142';

-- meal_143
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_143';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_143';

-- meal_145
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_145';

-- meal_146
-- alface pattern (fraco)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_146';

-- meal_148
-- alface pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_035' THEN jsonb_set(elem, '{id}', '"food_037"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_148';

-- meal_149
-- couve/repolho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_023' THEN jsonb_set(elem, '{id}', '"food_054"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_149';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_149';

-- meal_150
-- brócolis pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_017' THEN jsonb_set(elem, '{id}', '"food_044"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_150';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_150';

-- meal_152
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_152';

-- meal_153
-- cogumelos pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_025' THEN jsonb_set(elem, '{id}', '"food_051"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_153';
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_153';

-- meal_155
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_155';

-- meal_157
-- abobrinha pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_020' THEN jsonb_set(elem, '{id}', '"food_032"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_157';

-- meal_158
-- arroz→milho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_007' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_158';

-- meal_159
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_159';
-- feijão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_003' THEN jsonb_set(elem, '{id}', '"food_105"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_159';

-- meal_167
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_001' THEN jsonb_set(elem, '{id}', '"food_002"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_167';

-- meal_169
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_169';

-- meal_171
-- couve/repolho pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_023' THEN jsonb_set(elem, '{id}', '"food_054"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_171';
-- espinafre pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_024' THEN jsonb_set(elem, '{id}', '"food_058"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_171';
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_171';

-- meal_175
-- maçã pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_085' THEN jsonb_set(elem, '{id}', '"food_080"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_175';

-- meal_181
-- mandioca pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_012' THEN jsonb_set(elem, '{id}', '"food_006"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_181';

-- meal_182
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_182';
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_182';

-- meal_183
-- batata doce↔arroz swap (arroz branco)
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_014"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_183';

-- meal_184 -- ⚠️ PENDENTE: alimento novo, nao aplicar ate cadastrar/decidir aproximacao
--   PENDENTE (INDIVIDUAL: amido de milho/maizena nao cadastrado): food_014 -> NEW_AMIDO_MILHO (alimento nao existe ainda)

-- meal_185
-- cenoura pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_018' THEN jsonb_set(elem, '{id}', '"food_049"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_185';

-- meal_189
-- quinoa pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_009' THEN jsonb_set(elem, '{id}', '"food_008"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_189';

-- meal_190
-- batata pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_005' THEN jsonb_set(elem, '{id}', '"food_021"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_190';

-- meal_195
-- macarrão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_008' THEN jsonb_set(elem, '{id}', '"food_003"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_195';

-- meal_197
-- batata doce↔arroz swap
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_002' THEN jsonb_set(elem, '{id}', '"food_001"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_197';
-- feijão pattern
UPDATE meals SET ingredients_json = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'id' = 'food_003' THEN jsonb_set(elem, '{id}', '"food_105"')
         ELSE elem END
  )
  FROM jsonb_array_elements(ingredients_json) elem
) WHERE meal_id = 'meal_197';

-- 3. Depois de aplicar, reative as refeicoes corrigidas (nao
--    reativa as pendentes de alimento novo nem as sem fix).
-- UPDATE meals SET is_active = true WHERE meal_id IN (...);
-- (lista final depende de quais padroes a nutricionista aprovar)

COMMIT;
-- Se algo der errado antes do COMMIT: ROLLBACK;
-- Para reverter DEPOIS de já ter dado commit, usar a tabela de backup:
-- UPDATE meals m SET ingredients_json = b.ingredients_json_before
-- FROM meals_ingredients_backup_20260826 b WHERE b.meal_id = m.meal_id;
