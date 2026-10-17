-- ============================================================================
-- 2026-10-17 -- regra "o que este aluno não pode receber no treino" em UM lugar.
-- Decisão da Taina: o construtor de treino recusa exercício contraindicado
-- ("evitar") e avisa os de "cautela" nomeando a condição. Para não duplicar a
-- regra do gerador (lição da regra de ambiente), a lógica sai do código do
-- gerador para o banco e passa a ser usada pelos dois:
--   ybytu_normalize_exercise_name(nome)     -> mesma normalização de
--                                              exerciseNames.ts (sem acento,
--                                              minúsculas, sem espaço nas pontas)
--   ybytu_student_condition_slugs(aluno)    -> condições de saúde + dores
--                                              (onboarding -> physical_conditions
--                                              -> ponte de slugs), sem none/other
--   ybytu_exercise_restrictions(slugs, ids) -> avoid/caution por exercício,
--                                              com o avoid propagado ao "irmão"
--                                              de mesmo nome (via_sibling)
-- Leitura só por service_role (exercises tem RLS deny-all).
-- Desfazer: scripts/rollback_20261017230000_training_safety_shared_rules.sql
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.ybytu_normalize_exercise_name(p_name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $function$
  SELECT lower(btrim(translate(p_name,
    'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝáàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
    'AAAAAAEEEEIIIIOOOOOUUUUCNYaaaaaaeeeeiiiiooooouuuucnyy')))
$function$;

CREATE OR REPLACE FUNCTION public.ybytu_student_condition_slugs(p_user uuid)
RETURNS text[]
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH prof AS (
    SELECT health_conditions_ids, physical_conditions_ids FROM profiles WHERE id = p_user
  ),
  health AS (
    SELECT hc.health_condition_id AS slug
    FROM health_conditions hc, prof
    WHERE hc.id = ANY(COALESCE(prof.health_conditions_ids, ARRAY[]::uuid[]))
  ),
  pain AS (
    SELECT pc.physical_condition_id AS slug
    FROM prof
    JOIN onboarding_physical_conditions o ON o.id = ANY(COALESCE(prof.physical_conditions_ids, ARRAY[]::uuid[]))
    JOIN physical_conditions pc ON pc.id::text = o.main_physical_conditions_ids
  ),
  bridged AS (
    SELECT unnest(br.exercise_condition_slugs) AS slug
    FROM physical_condition_exercise_slugs br
    JOIN pain ON pain.slug = br.physical_condition_id
  )
  SELECT COALESCE(array_agg(DISTINCT slug ORDER BY slug), ARRAY[]::text[])
  FROM (SELECT slug FROM health UNION SELECT slug FROM bridged) x
  WHERE slug IS NOT NULL AND slug <> '' AND slug NOT IN ('none', 'other')
$function$;

-- p_exercise_ids NULL = catálogo inteiro (gerador); lista = só esses (construtor).
CREATE OR REPLACE FUNCTION public.ybytu_exercise_restrictions(p_condition_slugs text[], p_exercise_ids text[] DEFAULT NULL)
RETURNS TABLE(exercise_id text, tipo text, condition_slug text, via_sibling boolean)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH direct AS (
    SELECT c.exercise_id, c.tipo, c.condition_slug
    FROM exercise_effective_cautions c
    WHERE c.condition_slug = ANY(COALESCE(p_condition_slugs, ARRAY[]::text[]))
  ),
  avoided_names AS (
    SELECT DISTINCT ybytu_normalize_exercise_name(e.name_ptbr) AS n, d.condition_slug
    FROM direct d JOIN exercises e ON e.exercise_id = d.exercise_id
    WHERE d.tipo = 'avoid' AND e.name_ptbr IS NOT NULL AND ybytu_normalize_exercise_name(e.name_ptbr) <> ''
  ),
  siblings AS (
    SELECT e.exercise_id, 'avoid'::text AS tipo, an.condition_slug, true AS via_sibling
    FROM exercises e
    JOIN avoided_names an ON ybytu_normalize_exercise_name(e.name_ptbr) = an.n
    WHERE NOT EXISTS (
      SELECT 1 FROM direct d WHERE d.exercise_id = e.exercise_id AND d.tipo = 'avoid' AND d.condition_slug = an.condition_slug
    )
  )
  SELECT r.exercise_id, r.tipo, r.condition_slug, r.via_sibling
  FROM (
    SELECT d.exercise_id, d.tipo, d.condition_slug, false AS via_sibling FROM direct d
    UNION
    SELECT s.exercise_id, s.tipo, s.condition_slug, s.via_sibling FROM siblings s
  ) r
  WHERE p_exercise_ids IS NULL OR r.exercise_id = ANY(p_exercise_ids)
$function$;

REVOKE ALL ON FUNCTION public.ybytu_student_condition_slugs(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ybytu_exercise_restrictions(text[], text[]) FROM PUBLIC, anon, authenticated;

COMMIT;
