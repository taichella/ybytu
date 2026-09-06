# Export do catálogo de nutrição — 2026-09-01

Exportado do banco de produção (Supabase, projeto `jwjfmvkfzelbdvyqetyb`), somente
leitura, para análise externa que acelere a revisão dos 232 `foods` com
`allergen_review_status='unreviewed'`.

## ⚠️ Duas coisas que quem for ler isto precisa saber antes de mexer

**1. `allergen_review_status='unreviewed'` significa "nunca revisado", não "sem
alérgeno".** Não é o mesmo estado que `reviewed_none` (revisado e confirmado sem
alérgeno). Essa distinção existe de propósito — antes dela, um alimento sem tag de
alérgeno era ambíguo: podia ser "verificado, realmente não tem nada" ou "nunca ninguém
olhou". Um sistema de matching (`ybytu_match_meal_plans`/`ybytu_match_meals`) trata
`unreviewed` como "não posso confirmar que é seguro" e exclui esse alimento/refeição do
resultado até alguém confirmar — não trata como seguro por padrão. **Qualquer proposta
que vier desta análise precisa preencher com `reviewed_none` ou `reviewed_has_allergens`,
nunca deixar como estava, porque `unreviewed` já tem um comportamento ativo no sistema.**

**2. Qualquer proposta gerada a partir deste export é insumo para a nutricionista
confirmar — não é valor pra gravar direto no banco.** Ninguém deve rodar um `UPDATE` em
`foods.allergen_review_status` ou em `food_restriction_tags` com base só na análise
externa. O fluxo é: análise externa propõe → nutricionista revisa cada proposta (o
volume real é 232 linhas, não 486 — os outros 254 já têm alérgeno confirmado) → só depois
disso alguém aplica no banco, com o devido registro de quem aprovou.

## O que tem em cada arquivo

| Arquivo | Conteúdo | Linhas |
|---|---|---|
| `schema.sql` | DDL reconstruído das 14 tabelas de nutrição — colunas, tipos, defaults, PK, FK, UNIQUE, CHECK e índices | — |
| `foods.csv` | Todas as `foods` — id, nome, grupo, tipo, valores nutricionais, `allergen_review_status`, tokens de `food_restriction_tags` agregados | 486 |
| `meals.csv` | Todas as `meals` — id, nome, tipo, `is_active`, `restriction_tags`, lista de ingredientes expandida (nome + quantidade, não o JSON cru) | 200 |
| `vocabulario_restricoes.csv` | `dietary_restrictions` com `excludes_tokens` — o que cada restrição alimentar exclui, em tokens | 16 |
| `vocabulario_tokens.csv` | Lista simples dos 20 tokens de alérgeno/restrição que existem hoje no catálogo | 20 |

`meal_plans` e `meal_plan_meals` não foram exportados — são composição derivada (rodízio
de refeições por dia), não pedem revisão linha a linha e não cabem no volume desta
análise.

## Como ler `foods.csv`

`restriction_tokens` vazio quer dizer **ou** que o alimento genuinamente não tem
alérgeno registrado (`allergen_review_status='reviewed_has_allergens'` mas token vazio
não deveria acontecer — se acontecer, é inconsistência a reportar) **ou** que ele nunca
foi revisado (`allergen_review_status='unreviewed'`, o caso normal e esperado para os
232 alvo desta análise). Sempre olhe as duas colunas juntas, nunca só o campo de tokens.

Os tokens usados em `restriction_tokens`/`food_restriction_tags` são um vocabulário
fechado (ver `vocabulario_tokens.csv`) — uma proposta que sugerir um token fora dessa
lista está incorreta, não é uma opção válida nova.

## Como ler `meals.csv`

`ingredients` já traz nome do alimento e quantidade (`Nome do alimento: quantidadeunidade`,
várias entradas separadas por `; `), extraído de `meals.ingredients_json` e resolvido
contra `foods.food_id`. Não precisa voltar ao JSON bruto para entender a composição de
uma refeição.

## Tabelas de classificação adicionadas (2026-09-01)

`foods.csv` já trazia o nome do grupo/tipo resolvido, mas não tinha as colunas de FK nem
as outras 3 dimensões de classificação (fonte, método de preparo, unidade de medida) —
sem isso, quem analisa de fora só tinha o nome do alimento pra adivinhar. Os 8 arquivos
abaixo exportam essas tabelas de vocabulário na íntegra, e `foods.csv` foi reescrito para
incluir, para cada uma das 5 dimensões, a coluna de FK (`*_id`) seguida da coluna com o
nome já resolvido em português (`*_nome`) — sem precisar fazer join.

| Arquivo | Conteúdo | Linhas |
|---|---|---|
| `food_groups.csv` | Grupos alimentares (ex.: Carboidratos, Proteínas, Gorduras) | 7 |
| `food_types.csv` | Tipos de alimento dentro de cada grupo (ex.: Grãos, Raiz, Cereal) | 30 |
| `food_measurement_units.csv` | Unidades de medida usadas em `foods.quantity` (ex.: Grama, Unidade, Colher) | 17 |
| `food_preparation_methods.csv` | Métodos de preparo (ex.: Cozido, Cru, Assado) | 13 |
| `food_sources.csv` | Origem do alimento (ex.: Vegetal, Animal, Mineral) | 5 |
| `meal_types.csv` | Tipos de refeição (ex.: Café da manhã, Almoço, Sobremesa) | 5 |
| `dietary_restrictions.csv` | Restrições alimentares cadastradas, com `excludes_tokens` (o que cada uma exclui) — mesma informação de `vocabulario_restricoes.csv`, mas com todas as colunas da tabela (`category`, `is_active`, `sort_order`) | 16 |
| `dietary_preferences.csv` | Preferências alimentares que o usuário escolhe no onboarding (ex.: flexitariano, vegano) — não confundir com `dietary_restrictions`, que é sobre alergia/exclusão | 8 |

Todas as 8 tabelas foram exportadas com `select *` (todas as colunas, sem filtro), e os
nomes de tabela/coluna bateram exatamente com o pedido — não houve divergência de nome a
resolver.

`foods.csv` continua com 486 linhas e os mesmos campos de antes; as 10 colunas novas no
final são `food_group_id`, `food_group_nome`, `food_type_id`, `food_type_nome`,
`food_source_id`, `food_source_nome`, `food_preparation_method_id`,
`food_preparation_method_nome`, `food_measurement_unit_id`, `food_measurement_unit_nome`.
Um valor vazio numa dessas colunas significa que o alimento não tem aquela FK preenchida
no banco (ex.: `food_499` não tem `food_group_id`).

## Contexto de origem (pra quem não acompanhou o histórico)

**Correção 2026-09-03:** o parágrafo abaixo, na versão original, dizia que `unreviewed` já
bloqueia a distribuição no código. **Isso é falso, verificado direto no código-fonte.**
`ybytu_match_meals`/`ybytu_match_meal_plans` (as RPCs que decidem quais refeições um usuário
recebe) não fazem `JOIN` nenhum com `foods`, `food_restriction_tags` ou `restriction_tokens` —
continuam filtrando só por `meals.restriction_tags`/`meal_plans.restriction_tags` (a coluna
antiga, curada à mão). **Nada no runtime hoje lê `allergen_review_status` pra decidir o que
entregar** — o único lugar que lê esse campo é o badge de exibição no card de refeição
(`buildPlanPayload.ts`), que avisa mas não bloqueia. Ver `docs/SESSAO_1_NUTRICIONISTA_20260902.md`
pra o relato completo do achado.

Esses 232 `foods` sem revisão vieram à tona numa auditoria de segurança alimentar
(2026-08-31): o sistema de geração de plano nutricional deveria decidir se um alimento é
seguro pra alguém com restrição olhando pra esse status, e um alimento nunca revisado era
(e continua sendo) tratado, na prática, como qualquer outro — não há bloqueio, o bug de
fail-open original nunca foi corrigido no runtime, só documentado. O catálogo tem 232
alimentos represados nesse estado, e revisá-los continua sendo necessário — mas não porque
algo "destrava" ao completar a revisão; é porque, sem revisão, ninguém sabe se o alérgeno
está lá ou não.
