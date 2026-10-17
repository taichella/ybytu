-- Desfaz supabase/migrations/20261017210000_meal_safety_shared_rules.sql:
-- volta ybytu_match_meals para a definição de antes (copiada do banco em 2026-10-17)
-- e remove as funções compartilhadas.
BEGIN;
pg_get_functiondef
"CREATE OR REPLACE FUNCTION public.ybytu_match_meals(p_dietary_preference text, p_restriction_ids text[], p_target_calories integer, p_meals_per_day integer, p_limit_per_type integer DEFAULT 10)
 RETURNS TABLE(meal_id text, name_ptbr text, meal_type text, calories numeric, restriction_tags text[], dietary_preference text, score numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
WITH
  -- 1. Forbidden tokens = lookup de restrições ativas + exclusões de preferência
  forbidden AS (
    SELECT DISTINCT unnest(dr.excludes_tokens) AS token
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
  ),
  forbidden_arr AS (
    SELECT COALESCE(array_agg(token), ARRAY[]::text[]) AS tokens
    FROM forbidden
    WHERE token IS NOT NULL AND token != ''
  ),
  -- 2. Rank hierárquico do usuário
  user_rank(rank) AS (
    SELECT CASE p_dietary_preference
      WHEN 'vegan'       THEN 1
      WHEN 'vegetarian'  THEN 2
      WHEN 'pescetarian' THEN 3
      ELSE 4
    END
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
      AND CASE m.dietary_preference
            WHEN 'vegan'       THEN 1
            WHEN 'vegetarian'  THEN 2
            WHEN 'pescetarian' THEN 3
            ELSE 4
          END <= ur.rank
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
$function$
";
DROP FUNCTION IF EXISTS public.ybytu_meals_incompatible(text, text[], uuid[]);
DROP FUNCTION IF EXISTS public.ybytu_forbidden_tokens(text, text[]);
DROP FUNCTION IF EXISTS public.ybytu_preference_rank(text);
COMMIT;
