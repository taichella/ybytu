-- ============================================================================
-- 2026-10-17 -- regra de segurança alimentar em UM lugar só.
-- Decisão da Taina: o construtor do dashboard passa a recusar prato
-- incompatível com as restrições do aluno. Para não duplicar a regra do
-- gerador (já aconteceu com a regra de ambiente), a parte "o que é proibido
-- para este aluno" sai de dentro de ybytu_match_meals para duas funções
-- pequenas, usadas pelo gerador (via ybytu_match_meals) e pelo construtor
-- (via ybytu_meals_incompatible):
--   ybytu_forbidden_tokens(pref, restrições) -> tokens proibidos
--   ybytu_preference_rank(pref)              -> 1 vegano .. 4 onívoro
-- ybytu_match_meals é recriada com o MESMO resultado (conferido por hash da
-- saída antes/depois em 7 combinações de perfil).
-- Desfazer: scripts/rollback_20261017210000_meal_safety_shared_rules.sql
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.ybytu_forbidden_tokens(p_dietary_preference text, p_restriction_ids text[])
RETURNS text[]
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT COALESCE(array_agg(DISTINCT token), ARRAY[]::text[])
  FROM (
    SELECT unnest(dr.excludes_tokens) AS token
    FROM dietary_restrictions dr
    WHERE dr.dietary_restriction_id = ANY(COALESCE(p_restriction_ids, ARRAY[]::text[]))
      AND dr.is_active = true
    UNION
    SELECT unnest(CASE p_dietary_preference
      WHEN 'no_pork'     THEN ARRAY['pork']::text[]
      WHEN 'no_red_meat' THEN ARRAY['red_meat']::text[]
      WHEN 'no_seafood'  THEN ARRAY['fish','shellfish','crustacean','mollusk']::text[]
      ELSE ARRAY[]::text[]
    END)
  ) t
  WHERE token IS NOT NULL AND token <> ''
$function$;

CREATE OR REPLACE FUNCTION public.ybytu_preference_rank(p_dietary_preference text)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $function$
  SELECT CASE p_dietary_preference
    WHEN 'vegan'       THEN 1
    WHEN 'vegetarian'  THEN 2
    WHEN 'pescetarian' THEN 3
    ELSE 4
  END
$function$;

-- Para o construtor: das refeições dadas (meals.id), quais o aluno NÃO pode
-- receber e por quê. Mesmo critério do filtro duro de ybytu_match_meals.
CREATE OR REPLACE FUNCTION public.ybytu_meals_incompatible(p_dietary_preference text, p_restriction_ids text[], p_meal_uuids uuid[])
RETURNS TABLE(meal_uuid uuid, meal_name text, forbidden_tokens text[], preference_conflict boolean)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT m.id, m.name_ptbr,
         ARRAY(SELECT unnest(COALESCE(m.restriction_tags, ARRAY[]::text[])) INTERSECT SELECT unnest(ybytu_forbidden_tokens(p_dietary_preference, p_restriction_ids))),
         ybytu_preference_rank(m.dietary_preference) > ybytu_preference_rank(p_dietary_preference)
  FROM meals m
  WHERE m.id = ANY(p_meal_uuids)
    AND (COALESCE(m.restriction_tags, ARRAY[]::text[]) && ybytu_forbidden_tokens(p_dietary_preference, p_restriction_ids)
         OR ybytu_preference_rank(m.dietary_preference) > ybytu_preference_rank(p_dietary_preference))
$function$;

CREATE OR REPLACE FUNCTION public.ybytu_match_meals(p_dietary_preference text, p_restriction_ids text[], p_target_calories integer, p_meals_per_day integer, p_limit_per_type integer DEFAULT 10)
 RETURNS TABLE(meal_id text, name_ptbr text, meal_type text, calories numeric, restriction_tags text[], dietary_preference text, score numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
WITH
  -- 1. Forbidden tokens: regra compartilhada com o construtor (2026-10-17)
  forbidden_arr AS (
    SELECT ybytu_forbidden_tokens(p_dietary_preference, p_restriction_ids) AS tokens
  ),
  -- 2. Rank hierárquico do usuário (regra compartilhada)
  user_rank(rank) AS (
    SELECT ybytu_preference_rank(p_dietary_preference)
  ),
  -- 3. Cotas adaptadas ao número de refeições
  --    meals_per_day <= 3 → sem snack: B/L/D dividem 100% (target/3 cada)
  --    meals_per_day >  3 → com snack: B/L/D = 20% cada, snack = 40%/(N-3)
  quotas AS (
    SELECT
      CASE WHEN p_meals_per_day <= 3
           THEN p_target_calories / 3.0
           ELSE p_target_calories * 0.20
      END AS q_main,
      CASE WHEN p_meals_per_day > 3
           THEN p_target_calories * 0.40 / (p_meals_per_day - 3)::numeric
           ELSE NULL
      END AS q_snack
  ),
  -- 4. Score por proximidade à cota do tipo
  scored AS (
    SELECT
      m.meal_id,
      m.name_ptbr,
      m.meal_type,
      m.calories,
      m.restriction_tags,
      m.dietary_preference,
      GREATEST(0,
        100 - ABS(m.calories -
          CASE m.meal_type
            WHEN 'breakfast' THEN q.q_main
            WHEN 'lunch'     THEN q.q_main
            WHEN 'dinner'    THEN q.q_main
            ELSE                  q.q_snack
          END
        ) /
        CASE m.meal_type
          WHEN 'breakfast' THEN q.q_main
          WHEN 'lunch'     THEN q.q_main
          WHEN 'dinner'    THEN q.q_main
          ELSE                  q.q_snack
        END * 100
      ) AS score
    FROM meals m
    CROSS JOIN user_rank     ur
    CROSS JOIN forbidden_arr fa
    CROSS JOIN quotas        q
    WHERE m.is_active = true
      AND ybytu_preference_rank(m.dietary_preference) <= ur.rank
      AND NOT (COALESCE(m.restriction_tags, ARRAY[]::text[]) && fa.tokens)
      AND (m.meal_type <> 'snack' OR p_meals_per_day > 3)
  ),
  -- 5. Limite N por tipo (não global)
  ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY meal_type ORDER BY score DESC) AS rn
    FROM scored
  )
SELECT meal_id, name_ptbr, meal_type, calories, restriction_tags, dietary_preference, score
FROM ranked
WHERE rn <= p_limit_per_type
ORDER BY meal_type, score DESC;
$function$;

COMMIT;
