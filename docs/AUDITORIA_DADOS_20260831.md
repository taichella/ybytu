# Auditoria de dados de nutrição — 2026-08-31

Auditoria somente-leitura. Todas as queries abaixo foram rodadas via
`npx supabase db query --linked "<sql>"`. Nenhum INSERT/UPDATE/DELETE/migration
foi executado durante esta auditoria — as únicas escritas mencionadas (o reparo
de `meal_plans`) aconteceram numa sessão anterior e são aqui **verificadas**, não
repetidas.

## 1. O reparo de `meal_plans` aplicou ou ficou em dry-run?

**Aplicou.** Hoje, de 301 `meal_plans` no banco, só **1** tem âncora (café/almoço/janta)
duplicada ou faltando — não 194. O reparo da sessão anterior realmente escreveu no banco.

```sql
with day_types as (
  select meal_plan_id, day_order, meal_type_id, count(*) c
  from meal_plan_meals group by meal_plan_id, day_order, meal_type_id
),
day_summary as (
  select meal_plan_id, day_order,
    bool_or(meal_type_id='breakfast' and c>1) or bool_or(meal_type_id='lunch' and c>1)
      or bool_or(meal_type_id='dinner' and c>1) as dup_anchor,
    bool_or(meal_type_id='breakfast') as has_breakfast,
    bool_or(meal_type_id='lunch') as has_lunch,
    bool_or(meal_type_id='dinner') as has_dinner
  from day_types group by meal_plan_id, day_order
),
plan_bad as (
  select meal_plan_id,
    bool_or(dup_anchor) as any_dup,
    bool_or(not has_breakfast or not has_lunch or not has_dinner) as any_missing,
    bool_or(dup_anchor or not has_breakfast or not has_lunch or not has_dinner) as is_bad
  from day_summary group by meal_plan_id
)
select count(*) as total_plans, count(*) filter (where is_bad) as bad_plans,
       count(*) filter (where any_dup) as plans_with_dup_anchor,
       count(*) filter (where any_missing) as plans_missing_anchor
from meal_plans mp join plan_bad pb on pb.meal_plan_id = mp.id::text;
```

**Resultado:** `total_plans=301, bad_plans=1, plans_with_dup_anchor=1, plans_missing_anchor=1`.

O único plano ainda quebrado é `51765395-ffd6-412a-bf9c-11f3a6e9ccd0` (`mp_ai_1baa66ad`),
`created_by_ai=true`, criado em 2026-08-29 09:14:36 — **fora do escopo do reparo**, que só
tocou planos de catálogo (`created_by_ai=false`). É uma anomalia isolada, de uma única
chamada, achada e já registrada antes desta auditoria; não foi possível reproduzi-la
gerando o plano de novo várias vezes no mesmo perfil. Está `is_active=false`, mas
**ainda é o `current_meal_plan_id` da conta de teste** `386c4a52-99ca-4c13-be84-44be3ab45357`
(não é conta de aluno real).

```sql
select id, current_meal_plan_id from profiles
where current_meal_plan_id = '51765395-ffd6-412a-bf9c-11f3a6e9ccd0';
-- → 1 linha: a própria conta de teste
```

## 2. As refeições do reparo respeitam preferência/restrição do dono do plano?

**Não há como violar — nenhum plano de catálogo tem dono.** Verificado antes de checar
violação: zero perfis (atuais ou históricos) apontam para qualquer um dos 200 planos de
catálogo.

```sql
select count(*) from profiles p join meal_plans mp on mp.id = p.current_meal_plan_id
where mp.created_by_ai = false;                                          -- → 0

select count(*) from user_meal_plans ump join meal_plans mp on mp.id = ump.meal_plan_id
where mp.created_by_ai = false;                                          -- → 0
```

Então: **0 violações** contra usuário real, porque **0 usuários reais** estão vinculados
aos planos reparados. Não existem os 3 exemplos concretos pedidos — não por eu não ter
achado, mas porque a pré-condição (usuário dono) não existe pra nenhum dos 200 planos.

**O que EU verifiquei em vez disso** (hierarquia de preferência dentro do próprio plano,
já que não há usuário externo pra checar):

```sql
with changed as (
  select b.meal_plan_id, b.id as row_id
  from meal_plan_meals_repair_backup_20260831 b
  join meal_plan_meals cur on cur.id = b.id
  where cur.meal_id is distinct from b.meal_id or cur.meal_type_id is distinct from b.meal_type_id
),
ranked as (
  select mpm.id, mp.dietary_preference as plan_pref, m.dietary_preference as meal_pref,
    case mp.dietary_preference when 'vegan' then 1 when 'vegetarian' then 2
      when 'pescetarian' then 3 else 4 end as plan_rank,
    case m.dietary_preference when 'vegan' then 1 when 'vegetarian' then 2
      when 'pescetarian' then 3 else 4 end as meal_rank
  from meal_plan_meals mpm
  join meal_plans mp on mp.id::text = mpm.meal_plan_id
  join meals m on m.id::text = mpm.meal_id
  join changed c on c.row_id = mpm.id
)
select count(*) as total_changed_rows, count(*) filter (where meal_rank > plan_rank) as hierarchy_violations
from ranked;
```

**Resultado:** `total_changed_rows=5082, hierarchy_violations=0`. Todas as 5.082 linhas
alteradas (199 de 200 planos de catálogo) respeitam a hierarquia vegano ≤ vegetariano ≤
pescetariano ≤ onívoro em relação à `dietary_preference` do próprio plano.

### 🔴 Achado não pedido, mas real: `meal_plans.restriction_tags` ficou desatualizado no reparo

`restriction_tags` no plano é a união dos tags das refeições que ele contém (calculada
pelo gerador quando cria um plano — ver `derivePlanTags` em
`ybytu-generate-meal-plan/index.ts:174`). O reparo trocou os `meal_id` das linhas mas
**não recalculou essa coluna no `meal_plans`** — ela ficou congelada com o valor de antes
do reparo.

```sql
with changed_plans as (
  select distinct b.meal_plan_id from meal_plan_meals_repair_backup_20260831 b
  join meal_plan_meals cur on cur.id = b.id
  where cur.meal_id is distinct from b.meal_id or cur.meal_type_id is distinct from b.meal_type_id
),
actual_tags as (
  select mpm.meal_plan_id,
    array(select distinct unnest(m.restriction_tags) from meal_plan_meals mpm2
          join meals m on m.id::text = mpm2.meal_id
          where mpm2.meal_plan_id = mpm.meal_plan_id order by 1) as computed_tags
  from meal_plan_meals mpm
  where mpm.meal_plan_id in (select cp.meal_plan_id from changed_plans cp)
  group by mpm.meal_plan_id
)
select count(*) as changed_plans_checked,
       count(*) filter (where mp.restriction_tags is distinct from at.computed_tags) as stale_restriction_tags
from actual_tags at join meal_plans mp on mp.id::text = at.meal_plan_id;
```

**Resultado:** `changed_plans_checked=199, stale_restriction_tags=187`. Das quais **144
estão na direção perigosa** (a coluna gravada tem MENOS tags do que a refeição real
contém — ou seja, o plano parece mais seguro do que é):

```sql
-- mesma CTE acima, mais:
(select array(select unnest(at.computed_tags) except select unnest(mp.restriction_tags)))
  as missing_from_recorded
-- count(*) filter (where array_length(missing_from_recorded,1) > 0) → 144
```

**Exemplo concreto** (plano `07b9bb0a-36c8-43fb-ad93-c00602c6ccb6`, onívoro): coluna
gravada = `{egg, gluten, milk, pork, wheat}`; conteúdo real após o reparo =
`{egg, gluten, milk, pork, soy, wheat}` — **`soy` está faltando na coluna gravada**.

**Impacto real hoje: zero**, porque nenhum usuário está vinculado a esses planos (ver
acima) e `ybytu_match_meal_plans` (o único consumidor desse campo) só entra em jogo se
algum usuário cair no fallback de catálogo no futuro. Mas se isso acontecer antes de
`restriction_tags` ser recalculado, o matcher pode considerar seguro um plano que na
verdade contém um alérgeno não registrado. **Não corrigi nesta auditoria** (modo
somente-leitura) — fica registrado como pendência: recalcular `restriction_tags` (e
conferir `dietary_preference`) dos 199 planos alterados pelo reparo.

## 3. `meal_plans` apontando para refeições desativadas

```sql
select count(*) from meals where is_active = false;                      -- → 99 (confere)

select count(distinct mpm.meal_plan_id) as plans_referencing_inactive_meals,
       count(*) as total_inactive_meal_references
from meal_plan_meals mpm join meals m on m.id::text = mpm.meal_id
where m.is_active = false;
```

**Resultado:** `plans_referencing_inactive_meals=216, total_inactive_meal_references=2619`
— de 301 planos totais. Quebra por origem:

```sql
select mp.created_by_ai, count(distinct mpm.meal_plan_id)
from meal_plan_meals mpm join meals m on m.id::text = mpm.meal_id
join meal_plans mp on mp.id::text = mpm.meal_plan_id
where m.is_active = false group by mp.created_by_ai;
-- created_by_ai=false (catálogo): 107 de 200
-- created_by_ai=true  (IA):       100 de 101
```

**Mas nenhum usuário vivo é afetado agora:**

```sql
select count(distinct p.id) from profiles p
join meal_plan_meals mpm on mpm.meal_plan_id = p.current_meal_plan_id::text
join meals m on m.id::text = mpm.meal_id
where m.is_active = false;
-- → 0
```

O gerador (`ybytu_match_meals`) já filtra `is_active=true` — nenhum plano NOVO pode
receber uma refeição desativada. O número alto (216/301) é passivo histórico: quase
todo plano de catálogo e quase todo plano de IA já gerado em algum momento usou pelo
menos 1 das 99 refeições hoje desativadas, mas nenhum aluno ativo está com uma na mão.

## 4. O seed de 25/05 tocou mais alguma tabela?

Só 10 tabelas em `public` têm coluna `created_at` — a maioria das tabelas de catálogo
(`exercises`, `foods`, `meals`, `meal_types`, `muscle_groups` etc.) não tem, então não dá
pra correlacionar por data nelas (débito já conhecido: catálogo sem trilha de auditoria).

```sql
select table_name from information_schema.columns
where table_schema='public' and column_name='created_at' order by table_name;
-- meal_plans, plan_reviews, plan_share_tokens, profiles, staff, staff_invites,
-- training_plans, user_meal_plans, user_training_plans, whatsapp_notifications
```

Checando cada uma das 10 por `created_at::date = '2026-05-25'`: **só `meal_plans`
tem linhas dessa data (200)**. As outras 9 têm 0. `training_plans` (que teria as
"receitas" do lado treino) também deu 0 — o seed de 25/05 não mexeu no catálogo de
treino, só no de nutrição.

Para as tabelas sem `created_at`, priorizei por tamanho (tabelas pequenas de
enum/lookup — `goals`, `dietary_preferences`, `food_groups` etc., a maioria com
≤20 linhas — são baixo risco pra corrupção de seed em massa e não foram auditadas
linha a linha aqui):

```sql
-- contagens: foods=486, exercises=298, muscle_groups=49, tudo o resto ≤22
```

**`foods` (486 linhas) — checado, sem sinal do defeito:**

```sql
-- 1. calorias vs macros (índice trocado entre proteína/carbo/gordura de comidas diferentes)
select food_id, name_ptbr, calories_per_unit, protein_g, carbs_g, fat_g
from foods
where calories_per_unit is not null
  and (calories_per_unit > (protein_g*4+carbs_g*4+fat_g*9)*2.5
    or calories_per_unit < (protein_g*4+carbs_g*4+fat_g*9)*0.35)
  and (protein_g*4+carbs_g*4+fat_g*9) > 5;
```

5 resultados — todos bebidas alcoólicas (cerveja, vinho tinto/branco, espumante) +
extrato de baunilha. Divergência esperada (álcool tem 7 kcal/g, fora da fórmula
proteína/carbo/gordura) — **não é corrupção**, é a fórmula não contemplar álcool.

```sql
-- 2. nome duplicado com macros divergentes (mesmo padrão do defeito em meals)
select name_ptbr, count(*) from foods group by name_ptbr having count(*) > 1;
```

**0 linhas** — nenhum nome duplicado em `foods`. Catálogo de alimentos limpo por essas
duas checagens.

**`exercises` (298 linhas) — números re-confirmados, com uma correção:**

```sql
select name_ptbr, count(*) as n, count(distinct muscle_groups_ids) as distinct_muscle_sets
from exercises group by name_ptbr having count(*) > 1;
```

Por nome EXATO: **17 pares** (não 19). Normalizando (minúsculo + trim, pra pegar
variação de maiúscula/espaço que o match exato perde):

```sql
select lower(trim(name_ptbr)) as norm_name, count(*) as n, count(distinct name_ptbr) as distinct_raw
from exercises group by lower(trim(name_ptbr)) having count(*) > 1;
```

**19 pares confirmados** (bate com o registrado) — 2 deles (`face pull com elástico`,
`wall ball`) só aparecem duplicados depois de normalizar, porque o texto tem variação
de caixa/espaço entre as duas linhas. Dos 19, **16 têm `muscle_groups_ids` divergente**
entre as duas linhas do par; 3 são duplicatas de verdade (mesmo nome, mesmo músculo,
sem defeito).

**Não consegui reconfirmar o "5 com músculo errado" por SQL puro.** Isso exige
julgamento de domínio (qual dos 16 pares divergentes é um erro real vs. uma variação
legítima do exercício) — foi o trabalho da auditoria anterior (2026-08-26), não algo
que dá pra re-derivar mecanicamente sem repetir aquela revisão manual. Não vou inventar
que bati o número sem ter checado de verdade.

## Veredito

**Os dados de nutrição estão utilizáveis para o piloto:** a corrupção estrutural
conhecida (194 planos com âncora duplicada/faltando) está reparada e verificada, nenhum
aluno real está exposto a plano quebrado ou a refeição desativada hoje — mas o reparo
deixou uma pendência real não-trivial (`restriction_tags` desatualizado em 144 planos,
sentido perigoso) que precisa ser corrigida antes de esses planos poderem ser
confiavelmente usados no fallback de restrição alimentar.
