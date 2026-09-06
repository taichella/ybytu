-- schema_treino.sql
-- DDL representation (extraida via information_schema + pg_catalog em 2026-09-03, nao e um pg_dump literal)
-- do catalogo de TREINO usado neste export. Tabelas base + a view exercise_effective_cautions.

CREATE TABLE public.exercise_condition_proposals (id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id text NOT NULL,
  condition_slug text NOT NULL,
  tipo text NOT NULL DEFAULT 'caution'::text,
  status text NOT NULL DEFAULT 'ai_suggested'::text,
  rule_id text NOT NULL,
  clinical_reason text,
  review_priority text NOT NULL DEFAULT 'normal'::text,
  proposed_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text,
  UNIQUE (exercise_id, condition_slug, tipo),
  PRIMARY KEY (id),
  CHECK ((review_priority = ANY (ARRAY['normal'::text, 'high'::text, 'critical'::text]))),
  CHECK ((status = ANY (ARRAY['ai_suggested'::text, 'confirmed'::text, 'rejected'::text]))),
  CHECK ((tipo = ANY (ARRAY['caution'::text, 'avoid'::text]))));

CREATE TABLE public.exercise_environment (exercise_environment_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0,
  PRIMARY KEY (id));

CREATE TABLE public.exercise_equipments (exercise_equipment_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (id));

CREATE TABLE public.exercise_levels (exercise_level_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0,
  PRIMARY KEY (id));

CREATE TABLE public.exercises (name_ptbr text,
  name_en text,
  name_fr text,
  instruction_ptbr text,
  instruction_en text,
  instruction_fr text,
  muscle_groups_ids text[],
  exercise_equipments_ids text[],
  exercise_level_id text,
  avoid_health_conditions_ids text[],
  caution_health_condition_ids text[],
  calories integer,
  image_url text,
  video_url text,
  exercise_id text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (id));

CREATE TABLE public.health_conditions (id uuid NOT NULL DEFAULT gen_random_uuid(),
  health_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  sort_order integer DEFAULT 0,
  PRIMARY KEY (id));

CREATE TABLE public.muscle_groups (muscle_group_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (id));

CREATE TABLE public.physical_condition_exercise_slugs (physical_condition_id text NOT NULL,
  exercise_condition_slugs text[] NOT NULL DEFAULT '{}'::text[],
  pending_slugs text[] NOT NULL DEFAULT '{}'::text[],
  FOREIGN KEY (physical_condition_id) REFERENCES physical_conditions(physical_condition_id),
  PRIMARY KEY (physical_condition_id));

CREATE TABLE public.physical_conditions (id uuid NOT NULL DEFAULT gen_random_uuid(),
  physical_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  UNIQUE (physical_condition_id),
  PRIMARY KEY (id));
-- exercise_effective_cautions e uma VIEW (nao tabela base), definicao real via pg_get_viewdef:
CREATE VIEW public.exercise_effective_cautions AS
 SELECT exercise_id,
    condition_slug,
    tipo,
    source
   FROM ( SELECT e.exercise_id,
            unnest(e.caution_health_condition_ids) AS condition_slug,
            'caution'::text AS tipo,
            'confirmed'::text AS source
           FROM exercises e
        UNION ALL
         SELECT e.exercise_id,
            unnest(e.avoid_health_conditions_ids) AS condition_slug,
            'avoid'::text AS tipo,
            'confirmed'::text AS source
           FROM exercises e
        UNION ALL
         SELECT p.exercise_id,
            p.condition_slug,
            p.tipo,
            'ai_suggested'::text AS source
           FROM exercise_condition_proposals p
          WHERE p.status = 'ai_suggested'::text) sub
  WHERE condition_slug IS NOT NULL AND condition_slug <> 'none'::text;
