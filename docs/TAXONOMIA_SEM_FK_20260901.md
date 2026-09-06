# Taxonomia de alimentos e preferência alimentar sem FK real (2026-09-01)

## O que foi confirmado

Nenhuma das colunas abaixo tem foreign key de verdade — todas são texto/id livre, sem
constraint no schema:

| Coluna | Tem FK real? |
|---|---|
| `foods.food_group_id` | Não |
| `foods.food_type_id` | Não |
| `foods.food_source_id` | Não |
| `foods.food_preparation_method_id` | Não |
| `foods.food_measurement_unit_id` | Não |
| `meal_plans.dietary_preference` | Não |

Mesmo padrão de `meals.meal_type` (já confirmado sem FK antes). Nada no banco impede gravar
qualquer string nesses seis campos — um typo, um valor inventado, ou uma classificação errada
feita à mão passa sem erro, sem warning, sem constraint alguma barrando.

## dietary_preference (meals) — resultado da varredura, e por que ele não prova nada estrutural

Uma varredura cruzando `meals.dietary_preference` contra a origem real dos ingredientes
(`food_source_id`/`food_group_id`) em todas as 200 refeições do catálogo (137
vegan/vegetarian/pescetarian) não encontrou **nenhuma violação**: zero vegana com ingrediente
animal, zero vegetariana com carne/peixe, zero pescetariana com carne vermelha/ave.

**Isso é bom resultado, mas é disciplina operacional, não garantia estrutural.** É o mesmo
tipo de ausência de FK que já causou o bug confirmado em `restriction_tags` (campo curado
manualmente, sem checagem, que deixou passar erro real). Aqui, por enquanto, quem cadastrou
não errou — mas o banco não impediria se errasse. Se algum dia alguém escrever `"vegan"` com
espaço a mais, `"Vegano"` com maiúscula inconsistente, ou simplesmente marcar errado à mão
numa refeição nova, nada acusa isso automaticamente. Quem for construir qualquer automação em
cima da premissa "toda refeição vegana é seguramente vegana" precisa saber que essa premissa
não é garantida pelo schema, só pelo histórico de quem cadastrou até aqui.

## Lacuna de vocabulário em food_source_id / food_group_id

Além de não terem FK, essas duas colunas usam valores que não têm vocabulário fechado --
aparecem valores como `mixed`, `mineral` (em `food_source_id`) e `beverages`, `mixed`,
`spices`, `supplements` (em `food_group_id`) que não resolvem contra nenhuma tabela de
referência (`food_sources`/`food_groups`).

**56 alimentos** do catálogo têm `food_source_id = 'mixed'` — em geral pratos/produtos
compostos (ex.: "Croissant", "Pizza de muçarela", "Chocolate ao leite", "Doce de leite") --
onde `mixed` não diz se a origem é animal, vegetal ou as duas. Isso significa que, para esses
56 itens especificamente, **não dá pra confiar em `food_source_id` pra determinar origem
animal/vegetal automaticamente** -- teria que abrir o ingrediente e checar manualmente.

Na varredura de `dietary_preference` acima, nenhum desses 56 apareceu como ingrediente de
refeição vegana/vegetariana/pescetariana com conteúdo animal real escondido -- então a lacuna
não contaminou aquele resultado específico. Mas ela existe, é real, e vai voltar a importar
assim que alguém tentar automatizar qualquer checagem em cima de `food_source_id` sem tratar
o valor `mixed` como "indeterminado, checar à mão" em vez de "resolvido".

## O que isso muda pra quem for automatizar

- Não dá pra confiar que `dietary_preference`, `food_source_id`, `food_group_id`,
  `food_type_id`, `food_preparation_method_id` ou `food_measurement_unit_id` só contêm valores
  do vocabulário esperado -- qualquer automação precisa validar contra a lista de valores
  válidos antes de usar, e tratar valor fora da lista (ou `mixed`) como caso a revisar, não
  como dado confiável.
- Adicionar FK real nessas colunas resolveria a garantia estrutural pra frente, mas não
  teria efeito retroativo em dados já gravados fora do vocabulário -- precisaria de um
  saneamento prévio (mesmo problema que apareceu na correção de `restriction_tags`).
