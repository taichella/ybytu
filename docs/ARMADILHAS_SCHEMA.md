# Armadilhas de schema (nomes que enganam)

Doc vivo — registrar aqui toda vez que um nome de tabela/coluna levar a escrever uma query
errada. Não é um schema completo (isso é `docs/SCHEMA.md`, obsoleto, ou o export específico
de domínio quando existir); é só a lista do que já pegou alguém de surpresa.

## `meal_plan_meals.meal_id` referencia `meals.id`, não `meals.meal_id`

`meal_plan_meals.meal_id` é `text` — mesmo tipo e mesmo nome de `meals.meal_id` (o código
legível tipo `meal_042`), o que sugere que é essa a coluna referenciada. Não é. Na prática
`meal_plan_meals.meal_id` guarda o **uuid de `meals.id`** (armazenado como texto, sem FK
declarada). Confirmado por amostragem 2026-09-03: valores batem 100% com `meals.id::text`,
0% com `meals.meal_id`.

Mesmo padrão do bug já corrigido em `meal_type_id` (2026-08-06, ver memória
`meal_type_id_uuid_vs_text_bug`) — coluna guardava o uuid de outra tabela mas o nome sugeria
o código texto. Já apareceu duas vezes; ao escrever JOIN em `meal_plan_meals`, sempre juntar
por `meals.id::text = meal_plan_meals.meal_id`, nunca por `meals.meal_id`.

## `exercise_equipments` (plural) e `exercise_environment` (singular)

Duas tabelas de lookup do domínio de treino, nomes inconsistentes entre si:
- `exercise_equipments` — plural
- `exercise_environment` — singular

Fácil errar o nome de uma copiando o padrão da outra. Confirmar sempre via
`information_schema.tables` antes de escrever a query, não assumir pelo padrão da tabela
irmã.

## `MUSCLE_CATEGORY_MAP` (`_shared/buildPlanPayload.ts:61-73`) não é hierarquia de músculo

É um mapa hardcoded de 4 baldes — `superior`, `inferior`, `core`, `cardio` — construído **só
pra decidir o rótulo do dia** ("Superior — Peito, Costas...") na tela do plano. Existe só pra
exibição, com voto de maioria por dia, tolerância a erro alta porque é só texto de título.

**Não usar pra decidir substituição de exercício ou qualquer coisa que precise de precisão
clínica.** Achado em 2026-09-04 avaliando fallback de slot degradado: `forearms` (antebraço)
cai no balde `superior` junto com `chest`, `pectoralis_major`, `shoulders`, `back`,
`biceps_brachii` — ou seja, esse mapa aceitaria trocar um exercício de antebraço por um de
peitoral sem reclamar, porque "os dois são superior". Além disso é incompleto pra decisão de
segurança: `hip_flexors`, `adductors`, `abductors` (grupos que aparecem nas regras de caution/
avoid de quadril/virilha) nem estão mapeados. Construir uma hierarquia de músculo de verdade —
com julgamento clínico sobre o que é substituto aceitável do quê — é trabalho de curadoria
(sessão com personal trainer), não um mapa de 4 linhas. Ver
`docs/ACHADO_DEGRADACAO_SILENCIOSA_20260904.md`.
