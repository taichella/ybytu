# Alérgeno não anunciado no nome — refeições INATIVAS (2026-09-01)

Sem urgência: nenhuma destas 45 está ativa hoje, nenhum usuário está recebendo qualquer uma
delas agora. É fila de correção de catálogo antes de uma futura reativação, mesmo critério
das ativas (`docs/ALERGENO_NAO_ANUNCIADO_ATIVAS_20260901.md`): ingrediente real de alérgeno
(glúten/trigo, leite/laticínio, ovo, castanha/amendoim/nozes, soja), presente na
`ingredients_json`, sem o nome da receita mencionar ou justificar esse alérgeno.

**Varredura refeita do zero** para esta entrega: join `meals.ingredients_json` × `foods` ×
`food_restriction_tags` (tokens `gluten`/`wheat`/`rye`, `milk`, `egg`,
`peanuts`/`tree_nuts`/`nuts`, `soy`) sobre todas as 100 refeições inativas do catálogo,
filtrando por nome não anunciar a categoria. Resultado: **45 refeições**, mesmo número já
estimado — lista fechada abaixo, confirmada contra o estado atual do banco (nenhuma virou
ativa nem teve ingredientes alterados desde a estimativa original).

Coluna "No CSV de offset?" = já referenciada em
`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv` (mesmo prato, unrelated ao
alérgeno em si mas causa raiz em comum — bug de offset de substituição de ingrediente que
gerou catálogo cheio de trocas erradas). "Sim" = mesma receita aparece nesse CSV por outro
motivo (ingrediente trocado por offset), reforçando que o prato já é candidato a revisão
completa, não só o alérgeno. "Não" = alérgeno não anunciado é o único achado conhecido até
agora para essa receita.

| meal_id | Nome | Tipo | Alérgeno não anunciado | Ingrediente-gatilho | No CSV de offset? |
|---|---|---|---|---|---|
| meal_005 | Vitamina de Abacate Tradicional | breakfast | leite | Leite integral (200ml) | Não — caso já documentado à parte (`REVISAO_NUTRICIONISTA_meal_leite_sem_tag_20260831.md`) |
| meal_011 | Frango com Batata Doce e Brócolis | lunch | glúten | Farinha de trigo (100g) | Sim |
| meal_012 | Prato Feito (Arroz, Feijão e Bife) | lunch | glúten | Macarrão cozido (100g) | Sim |
| meal_013 | Bacalhau com Batata e Ovo | lunch | glúten, ovo | Pão integral (100g); Ovo cozido (50g) | Não |
| meal_015 | Strogonoff de Frango com Arroz | lunch | leite | Creme de leite (50g) | Sim |
| meal_019 | Omelete de Espinafre e Tomate Seco | lunch | ovo, leite | Ovo cozido (100g); Queijo muçarela (30g) | Sim |
| meal_020 | Tofu Defumado com Arroz Integral | lunch | soja, glúten | Tofu defumado (100g); Farinha de trigo (100g) | Sim |
| meal_033 | Salada Caesar Saudável com Frango | dinner | leite | Queijo parmesão (20g); Iogurte natural integral (20g) | Não |
| meal_034 | Sopa de Legumes e Feijão | dinner | glúten | Pão integral (50g); Macarrão cozido (100g) | Não |
| meal_035 | Filé de Pescada com Brócolis | dinner | glúten | Farinha de trigo (100g) | Sim |
| meal_045 | Patê de Atum com Cenoura | snack | ovo | Maionese tradicional (10g) | Sim (offset documentado é outro ingrediente do mesmo prato) |
| meal_047 | Mingau de Quinoa com Maçã e Canela | breakfast | castanha | Leite de amêndoas (150ml) | Sim (offset documentado é outro ingrediente do mesmo prato) |
| meal_055 | Crepe Verde de Espinafre | breakfast | ovo | Ovo cozido (100g) | Sim |
| meal_058 | Bruschetta Saudável de Tomate | snack | glúten, leite | Pão francês (50g); Queijo minas frescal (20g) | Sim |
| meal_061 | Salada Caprese com Frango | lunch | glúten, ovo | Torrada integral (30g); Maionese tradicional (10g) | Não |
| meal_065 | Escondidinho de Batata Doce e Carne | lunch | leite | Queijo muçarela (20g) | Sim |
| meal_067 | Peito de Frango com Feijão e Quinoa | lunch | glúten | Macarrão cozido (100g) | Sim |
| meal_069 | Lasanha de Abobrinha com Carne | lunch | leite | Queijo muçarela (20g) | Não |
| meal_072 | Taco Low-Carb de Alface | dinner | leite | Queijo muçarela (10g) | Não |
| meal_076 | Salada Refrescante de Melancia e Feta | dinner | leite | Queijo feta (50g) | Não |
| meal_078 | Creme de Brócolis e Queijo | dinner | glúten | Farinha de trigo (150g) | Sim |
| meal_079 | Hambúrguer de Atum Sem Pão | dinner | ovo | Ovo cozido (30g) | Não |
| meal_086 | Pizza de Berinjela (Low Carb) | snack | leite | Queijo muçarela (30g) | Não |
| meal_088 | Batata Frita Rústica no Forno (Ar Frito) | snack | glúten | Pão integral (150g) | Não |
| meal_089 | Pipoca Feita na Água | snack | glúten | Pão francês (30g) | Sim |
| meal_090 | Sushi Bowl (Desconstruído) | lunch | glúten, soja | Molho Shoyu / Soja (10ml) | Sim |
| meal_093 | Salada Caprese Expresso | snack | leite | Queijo muçarela (50g) | Sim |
| meal_101 | Bife a Cavalo com Batata Doce | lunch | ovo | Ovo cozido (50g) | Sim |
| meal_102 | Frango ao Curry com Leite de Coco | dinner | castanha, glúten | Leite de coco (100ml); Farinha de trigo (100g) | Sim |
| meal_104 | Picadinho de Carne com Legumes | dinner | glúten | Pão integral (100g) | Não |
| meal_105 | Espetinho de Frango e Pimentão | lunch | glúten | Cevada em grãos cozida (100g) | Não |
| meal_109 | Iscas de Mignon com Shoyu e Brócolis | lunch | glúten, soja | Farinha de trigo (100g); Molho Shoyu (15ml) | Sim |
| meal_119 | Salada Reforçada de Feijão Preto | lunch | glúten | Cevada em grãos cozida (50g) | Não |
| meal_122 | Mingau de Aveia com Maçã e Canela | breakfast | leite | Leite desnatado (200ml) | Sim |
| meal_139 | Salada Caesar com Salmão | lunch | leite, ovo | Queijo parmesão (15g); Maionese tradicional (10g) | Não |
| meal_143 | Sopa de Frango com Legumes | dinner | glúten | Pão integral (50g) | Não |
| meal_145 | Tofu Assado com Brócolis | dinner | soja, glúten | Tofu defumado (100g); Farinha de trigo (100g) | Sim |
| meal_150 | Atum com Legumes no Vapor | dinner | glúten | Farinha de trigo (50g) | Sim |
| meal_153 | Strogonoff de Cogumelos | lunch | leite | Creme de leite (50g) | Sim |
| meal_155 | Salada de Batata e Ovo (Maionese Fit) | lunch | glúten, ovo, leite | Pão integral (150g); Ovo cozido (100g); Iogurte natural (30g) | Não |
| meal_175 | Vitamina de Aveia e Maçã | breakfast | leite | Leite desnatado (200ml) | Sim |
| meal_182 | Sopa Clara de Cenoura e Batata | dinner | glúten | Pão integral (100g) | Sim |
| meal_184 | Mingau de Maizena (Amido de Milho) | breakfast | leite | Leite desnatado (200ml) | Sim |
| meal_190 | Ovos Escalfados com Batata | lunch | ovo, glúten | Ovo cozido (100g); Pão integral (150g) | Não |
| meal_197 | Prato Feito Turbinado (Ovo e Fritas) | lunch | glúten, ovo | Macarrão cozido (100g); Ovo cozido (50g) | Não |

**Total: 45 refeições, todas confirmadas `is_active = false` no banco nesta data.**

Composição por alérgeno (uma refeição pode ter mais de um): glúten em 25, leite em 16, ovo
em 11, soja em 4, castanha em 2.

Composição por meal_type: lunch 20, dinner 13, breakfast 6, snack 6.

26 das 45 (58%) já estão referenciadas no CSV de offset por outro motivo — reforça que boa
parte deste catálogo inativo tem mais de um defeito acumulado e merece revisão completa da
ficha, não só a etiqueta de alérgeno, antes de qualquer reativação.
