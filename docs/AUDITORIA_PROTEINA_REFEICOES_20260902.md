# Auditoria de proteína real — almoço e jantar ativos (2026-09-02)

Substitui a categoria "Refeição Incompleta" da auditoria externa (descartada por 80% de falso
positivo — ver `docs/CRITERIO_FOOD_GROUP_E_PROTEINA_20260902.md`). Critério novo: `protein_g`
de cada ingrediente somado proporcionalmente à gramagem real (`qtd_ingrediente /
quantity_do_food × protein_g_do_food`), não taxonomia.

**Universo:** 35 refeições ativas de `meal_type` `lunch` ou `dinner`.

## Limiar escolhido: 10g de proteína — piso técnico, não o padrão do produto

10g é só o corte de "não sustenta como fonte de proteína" mesmo pelo critério mais frouxo
possível — abaixo disso, as 3 refeições vão para a nutricionista sem alternativa. Acima disso,
**a decisão de qual é o padrão nutricional do produto (15g? 20g? outro número?) é dela, não
nossa.**

**Pergunta explícita pra ela responder:** qual deve ser o piso mínimo de proteína por refeição
principal (almoço/jantar) do produto? A resposta muda o tamanho do problema de forma
significativa — melhor descobrir isso agora do que depois do lançamento:

| Limiar | Refeições ativas abaixo | % do universo (35 refeições) |
|---|---|---|
| < 10g (piso técnico, sempre entra) | **3** | 8,6% |
| < 15g | 8 | 22,9% |
| < 20g | **15** | **42,9%** |

Se ela escolher 20g como padrão, **15 das 35 refeições ativas de almoço/jantar ficam abaixo** —
quase metade do cardápio principal. Isso não é motivo pra escolher o número mais confortável;
é motivo pra ela decidir com o tamanho real do problema à vista, em vez de descobrir depois que
o padrão que parecia certo esvazia o cardápio.

## As 3 refeições abaixo de 10g

| meal_id | Nome | Tipo | Proteína real |
|---|---|---|---|
| `meal_187` | Purê de Abóbora Simples | dinner | **2,4g** — ver entrada consolidada em `docs/AUDITORIA_REFEICOES_ATIVAS_CONSOLIDADO_20260902.md` (não repetida aqui — essa refeição foi encontrada por 3 caminhos diferentes, revisão única) |
| `meal_141` | Sopa Creme de Ervilha | dinner | **6,2g** |
| `meal_147` | Sopa de Tomate com Ovo Escalfado | dinner | **8,5g** |

`meal_141` e `meal_147` são achados novos que a
auditoria externa não pegou, porque ela olhava `food_group_id`/nome, não o valor nutricional
real — `meal_147` tem ovo escalfado (proteína real, `food_group_id` correto), mas em
quantidade baixa demais pra sustentar como fonte de proteína de um jantar.

**`meal_141` e `meal_147` são a prova de que o método novo funciona, não só mais dois casos.**
Em ambas a taxonomia está certa — Sopa Creme de Ervilha e Sopa de Tomate com Ovo Escalfado têm
`food_group_id` correto nos seus ingredientes, incluindo fonte de proteína real (ervilha, ovo).
O problema não é classificação errada, é quantidade insuficiente — algo que só o cálculo real
de `protein_g` pega. A auditoria externa, checando taxonomia/nome, nunca acharia essas duas.
