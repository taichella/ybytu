# Modelo de dados — nutrição (canônico, 2026-09-01)

Toda afirmação abaixo foi conferida direto no banco (`supabase db query --linked`) e no
código-fonte das edge functions, não contra documentação anterior. Onde relevante, cito
a query ou o arquivo:linha que confirma.

## ⚠️ O fato mais importante deste documento

**As tabelas novas (`restriction_tokens`, `food_restriction_tags`,
`foods.allergen_review_status`) existem no schema desde 2026-08-31/09-01, mas
**não são lidas por nenhuma decisão de segurança hoje**.** Foram construídas como
fundação pra uma correção (apelidada de "Fase B" nas conversas que levaram a este
documento) que ainda não foi aplicada — está bloqueada esperando a nutricionista revisar
os 232 `foods` com `allergen_review_status='unreviewed'`. Confirmei isso lendo a
definição atual das duas funções que decidem o que é servido:

```sql
select prosrc from pg_proc where proname='ybytu_match_meals';
select prosrc from pg_proc where proname='ybytu_match_meal_plans';
```

Ambas ainda filtram por `NOT (COALESCE(m.restriction_tags, ARRAY[]::text[]) && fa.tokens)`
— a coluna antiga, curada à mão, não o novo `food_restriction_tags`. Qualquer leitura
deste documento que assuma que `allergen_review_status` já bloqueia alguma coisa em
produção está errada até a Fase B ser implementada e deployada.

## O caminho completo: de um alérgeno num alimento até a decisão de entrega

Hoje (não como devia ser depois da Fase B):

1. **`foods`** — catálogo de 486 ingredientes. Cada linha tem os valores nutricionais e,
   desde a correção de 2026-09-01, `allergen_review_status` (ver seção própria) e,
   via `food_restriction_tags`, os tokens de alérgeno **quando revisado**. Hoje isso é
   só metadado — nada consome esses dois campos em runtime.
2. **`meals`** — 200 refeições curadas. `ingredients_json` (jsonb) referencia `foods`
   por `food_id` (slug, ex: `food_171`) com quantidade e unidade. `meals.restriction_tags`
   (text[]) é **preenchido à mão** por quem curou a refeição no `MealEditor.jsx`/
   `ybytu-admin-meals` — não é derivado automaticamente de `ingredients_json`+`foods`.
   Uma auditoria anterior (2026-08-31) comparou as 200 linhas curadas contra uma
   derivação a partir dos ingredientes reais: bateram em 199 de 200 — a curadoria manual
   é confiável na prática, mas não é a mesma coisa que ser calculada.
3. **`meal_plans`** — um plano gerado (IA ou catálogo) tem seu próprio
   `restriction_tags`, escrito **uma única vez**, no momento da geração, por
   `derivePlanTags()` em `ybytu-generate-meal-plan/index.ts` — união dos
   `restriction_tags` das `meals` que entraram no rodízio daquele plano. Não há
   recálculo depois: se a composição do plano mudar (edição manual, reparo de dados),
   essa coluna não acompanha — foi exatamente o que causou o achado da auditoria de
   2026-08-31 (144 de 199 planos de catálogo com a coluna desatualizada depois de um
   reparo em `meal_plan_meals`).
4. **`meal_plan_meals`** — a composição real (quais `meals`, em qual dia/ordem/tipo, de
   qual `meal_plan`). É o que efetivamente será entregue ao aluno.
5. **A decisão em si** acontece nas duas RPCs (`ybytu_match_meals`,
   `ybytu_match_meal_plans`), chamadas por `ybytu-generate-meal-plan/index.ts` na hora
   de montar/escolher um plano: comparam `restriction_tags` (de `meals` ou de
   `meal_plans`, conforme a RPC) contra os tokens proibidos do usuário
   (`dietary_restrictions.excludes_tokens`, resolvidos a partir do que o usuário
   selecionou no onboarding). **Nenhuma dessas RPCs faz `JOIN` com `foods`,
   `food_restriction_tags` ou `restriction_tokens` hoje.**

## Tabelas de apoio — o que cada uma faz, e se participa da decisão de segurança

| Tabela | O que é | Participa da decisão hoje? |
|---|---|---|
| `food_groups`, `food_types`, `food_sources`, `food_preparation_methods`, `food_measurement_units` | Taxonomia/lookup de `foods` (grupo, tipo, origem, preparo, unidade) — só rótulo, sem lógica | Não |
| `meal_types` | Lookup de rótulo (`breakfast`→"Café da manhã" etc.), usado só pra exibir nome e popular dropdown do admin (`ybytu-admin-meals` action `lookups`, `buildPlanPayload.ts:546`) | **Não** — ver verificação abaixo |
| `dietary_preferences` | Lookup de rótulo pras 4 preferências hierárquicas (vegano/vegetariano/pescetariano/onívoro) | Indiretamente — o `dietary_preference_id` do usuário resolve pro slug usado no `CASE` de hierarquia das RPCs, mas a tabela em si só dá o nome |
| `dietary_restrictions` | Define, por restrição (ex: "Sem Glúten"), quais tokens ela exclui (`excludes_tokens`) — é a fonte real do que vira "proibido" pra um usuário | **Sim** — é a origem dos `forbidden.tokens` que as duas RPCs usam |
| `restriction_tokens` | Vocabulário fechado dos 20 tokens de alérgeno possíveis (ver seção própria) | Não ainda (Fase B) |
| `food_restriction_tags` | Junção `food_id`↔`token`, com FK pros dois lados | Não ainda (Fase B) |

### Verificação 1: o que `meal_types` controla de verdade

Não controla nada além de rótulo. Os 3 usos no código inteiro:
- `buildPlanPayload.ts:544-550` — busca `meal_type_id → name_ptbr` só pra montar o texto
  exibido no documento do plano (“Café da manhã”, “Almoço”...).
- `ybytu-admin-meals/index.ts:67-77` — devolve a lista completa como `lookups.meal_types`
  pra popular o `<select>` de tipo de refeição no editor do admin.
- `ybytu-admin-meal-plans/index.ts` — mesmo padrão de lookup.

`meals.meal_type` (a coluna que as RPCs realmente filtram) é `text` solto — **não tem FK
pra `meal_types`**:
```sql
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'meals'::regclass and contype='f';
-- 0 linhas
```
O vínculo é só convenção (os mesmos slugs `breakfast`/`lunch`/`dinner`/`snack` aparecem
nos dois lugares), garantido por disciplina de código, não pelo banco.

## Os três estados de `allergen_review_status`

Direto do constraint, não de descrição:
```sql
select conname, pg_get_constraintdef(oid) as def from pg_constraint
where conname = 'foods_allergen_review_status_check';
-- CHECK ((allergen_review_status = ANY (ARRAY['unreviewed'::text, 'reviewed_none'::text, 'reviewed_has_allergens'::text])))
```

- **`unreviewed`** — nunca revisado. Estado inicial de todo food sem tag no backfill
  (232 hoje). **Não significa "sem alérgeno"** — significa "não sabemos".
- **`reviewed_none`** — revisado, confirmado que não tem alérgeno. Só chega nesse estado
  por ação humana (a nutricionista confirmando); nada no sistema atribui isso
  automaticamente.
- **`reviewed_has_allergens`** — revisado, tem pelo menos um alérgeno, listado em
  `food_restriction_tags`. Estado atual de 254 foods (backfill automático: todo food que
  já tinha `dietary_restrictions_ids` preenchido antes da migração virou isso).

## Por que `restriction_tokens` existe como tabela, com FK

Antes, `foods.dietary_restrictions_ids` (hoje `_deprecated`) era texto solto separado
por vírgula — nada impedia um valor digitado errado ou um token inventado. `restriction_tokens`
é o vocabulário fechado (20 tokens: `milk`, `egg`, `gluten`, `wheat`, `soy`, `peanuts`,
`tree_nuts`, `nuts`, `sesame`, `fish`, `shellfish`, `crustacean`, `mollusk`, `pork`,
`red_meat`, `rye`, `lupin`, `mustard`, `sulfites`, `gluten_free_if_certified`), seedado a
partir de `dietary_restrictions.excludes_tokens`. `food_restriction_tags` tem FK pra
`restriction_tokens.token` — um `INSERT` com token fora da lista falha na hora
(constraint), em vez de silenciosamente aceitar um valor não reconhecido pelas RPCs de
match. É a mesma proteção que uma coluna de enum daria, mas permitindo N tokens por food
(relação muitos-pra-muitos), o que um `CHECK` num campo só não cobre.

## O que é legado

**`foods.dietary_restrictions_ids_deprecated`** (renomeada de `dietary_restrictions_ids`
em 2026-09-01): morta de verdade. Busquei todo uso de `dietary_restrictions_ids` no
código das functions — os 4 casos reais que sobraram são todos `profiles.dietary_restrictions_ids`
(coluna diferente, ativa, uuid[] do que o usuário escolheu no onboarding, sem relação com
esta). Achei **1 referência residual** que merece registro: `ybytu-admin-foods/index.ts:18`
ainda lista `dietary_restrictions_ids` no array `WRITABLE_FIELDS` do editor de foods —
column que não existe mais sob esse nome. Não é bug ativo hoje porque
`FoodEditor.jsx` nunca populou esse campo no payload (confirmado, zero ocorrência no
componente), mas é uma referência a limpar quando alguém mexer nesse arquivo de novo.

**`meal_plans.restriction_tags`**: **não é legado ainda — é a fonte de decisão ativa
hoje**, confirmado na seção "O fato mais importante" acima. Vai se tornar legado quando
a Fase B substituir a leitura direta dessa coluna por derivação ao vivo a partir de
`meal_plan_meals`→`meals`→`food_restriction_tags`. Até lá, tratar como dado real, com o
problema de staleness já registrado na auditoria de 2026-08-31 (recalculada só na
criação do plano, nunca depois).
