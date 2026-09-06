# Auditoria de refeições ativas — consolidado para revisão (2026-09-02)

Reúne 3 investigações separadas sobre o mesmo lote de refeições ativas (validação de
`auditoria_refeicoes_v1.csv`, uma análise externa sem acesso real ao banco). Cada refeição
aparece **uma única vez** neste documento, mesmo quando foi encontrada por mais de um caminho
— ver nota sobre `meal_187` na Parte 3.

## Parte 1 — instrução de preparo desatualizada (5 casos, todos confirmados no banco)

A instrução de preparo (`instruction_ptbr`) cita um ingrediente que não existe em
`ingredients_json`. Hipótese confirmada pra 4 dos 5: o defeito de troca de ingrediente já
documentado (`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv`) trocou o
ingrediente mas deixou o texto órfão — a instrução original é evidência do que o ingrediente
deveria ser, mais útil reaproveitar que reescrever do zero.

| meal_id | Nome | Instrução cita | Ingrediente real no lugar | Instrução completa |
|---|---|---|---|---|
| `meal_068` | Strogonoff Vegano de Grão-de-Bico | arroz | batata doce cozida | *"Refogue o grão-de-bico com o molho de tomate. Incorpore o creme de leite vegetal e sirva com **arroz**."* |
| `meal_131` | Strogonoff de Carne Saudável | arroz | batata doce cozida | *"Refogue a alcatra com molho de tomate. Desligue, misture o iogurte natural e sirva com **arroz**."* |
| `meal_137` | Feijoada Vegana (com Tofu Defumado) | arroz | batata doce cozida | *"Cozinhe o feijão preto com o tofu defumado (substituindo as carnes). Sirva com **arroz**."* |
| `meal_163` | Salada de Frango Rápida | tomate | aipo (salsão) | *"Desfie o frango já cozido. Misture com alface, **tomate** picado e regue com azeite extravirgem."* |
| `meal_187` | Purê de Abóbora Simples | azeite | — (causa diferente, ver Parte 3) | *"[...] adicionando apenas um fio de **azeite** e sal."* |

**Decisão pendente pra nutricionista:** confirmar se a correção proposta (reescrever a
instrução pro ingrediente real — arroz→batata doce nos 3 primeiros, tomate→aipo no `meal_163`)
está nutricional/culinariamente correta, já que ela é quem valida a receita final.

## Parte 2 — "refeição incompleta" (lista corrigida, substitui a categoria original)

A categoria original da análise externa tinha 20 casos; **16 eram falso positivo** (checagem
por `food_group_id`, que não responde "tem proteína" — ver
`docs/CRITERIO_FOOD_GROUP_E_PROTEINA_20260902.md`). Lista final, verificada por composição real
de ingredientes:

| meal_id | Nome | Ativa? | Por que falta proteína |
|---|---|---|---|
| `meal_066` | Massa Integral com Pesto e Tomate | não | Quinoa + pesto + alface — nenhum ingrediente proteico |
| `meal_116` | Lentilha Estufada com Cogumelos | não | Inhame + pipoca + azeite — "lentilha" do nome nem está nos ingredientes reais (bug adicional) |
| `meal_153` | Strogonoff de Cogumelos | não | Batata doce + molho + creme de leite + pipoca — "cogumelos" do nome nem está nos ingredientes reais (mesmo bug) |
| `meal_187` | Purê de Abóbora Simples | **sim** | Ver Parte 3 |

`meal_066`, `meal_116` e `meal_153` estão inativas — sem urgência, fila normal de correção.

## Parte 3 — `meal_187` Purê de Abóbora Simples: entrada única, 3 ângulos

Esta refeição foi encontrada por 3 investigações independentes. Consolidada aqui pra
nutricionista revisar uma vez só, não três:

- **Instrução desatualizada** (Parte 1): instrução cita "azeite", ingrediente único real é só
  "Purê de abóbora (preparado)", 200g. Causa diferente das outras 4 da Parte 1 — não é troca de
  ingrediente, é receita que virou item pré-pronto único e a instrução (que descrevia um
  preparo passo-a-passo) ficou órfã.
- **Refeição incompleta** (Parte 2): 200g de purê, nenhum outro ingrediente — sem fonte de
  proteína.
- **Proteína real calculada**: **2,4g** — a mais baixa entre todas as 35 refeições ativas de
  almoço/jantar (ver `docs/AUDITORIA_PROTEINA_REFEICOES_20260902.md`, que agora só referencia
  este documento pra `meal_187` em vez de repetir o detalhe).

**Dado adicional relevante pra decisão:** 0 usuários têm essa refeição em plano ativo hoje
(confirmado via `profiles.current_meal_plan_id` — nenhum dos 3 profiles com plano corrente
aponta pra qualquer `meal_plan` que contenha `meal_187`). Não é incêndio, é catálogo — mesma
categoria de urgência das outras refeições já desativadas por outros defeitos.

**Pergunta única pra ela sobre `meal_187`:** é pra continuar existindo como acompanhamento
simples de baixa proteína (design intencional, só ajustar a instrução órfã) ou vira caso de
correção de composição (adicionar fonte de proteína e virar prato completo)? As duas decisões
anteriores (instrução, proteína) dependem dessa resposta.
