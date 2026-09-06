-- Schema DDL (reconstruído via information_schema/pg_catalog) — export 2026-09-01
-- Projeto Supabase jwjfmvkfzelbdvyqetyb. Não é pg_dump literal, mas cobre colunas,
-- tipos, defaults, PK/FK/UNIQUE, CHECK e índices de cada tabela abaixo.

-- ==============================================================================
-- TABLE: food_groups
-- ==============================================================================
CREATE TABLE food_groups (
  food_group_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: food_groups_pkey (id)
-- CHECK (2200_31939_1_not_null): food_group_id IS NOT NULL
-- CHECK (2200_31939_5_not_null): id IS NOT NULL
-- CREATE UNIQUE INDEX food_groups_pkey ON public.food_groups USING btree (id);


-- ==============================================================================
-- TABLE: food_measurement_units
-- ==============================================================================
CREATE TABLE food_measurement_units (
  food_measurement_unit_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: food_measurement_units_pkey (id)
-- CHECK (2200_31903_5_not_null): id IS NOT NULL
-- CHECK (2200_31903_1_not_null): food_measurement_unit_id IS NOT NULL
-- CREATE UNIQUE INDEX food_measurement_units_pkey ON public.food_measurement_units USING btree (id);


-- ==============================================================================
-- TABLE: food_preparation_methods
-- ==============================================================================
CREATE TABLE food_preparation_methods (
  food_preparation_method_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: food_preparation_methods_pkey (id)
-- CHECK (2200_31913_1_not_null): food_preparation_method_id IS NOT NULL
-- CHECK (2200_31913_5_not_null): id IS NOT NULL
-- CREATE UNIQUE INDEX food_preparation_methods_pkey ON public.food_preparation_methods USING btree (id);


-- ==============================================================================
-- TABLE: food_sources
-- ==============================================================================
CREATE TABLE food_sources (
  food_source_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: food_sources_pkey (id)
-- CHECK (2200_31931_1_not_null): food_source_id IS NOT NULL
-- CHECK (2200_31931_5_not_null): id IS NOT NULL
-- CREATE UNIQUE INDEX food_sources_pkey ON public.food_sources USING btree (id);


-- ==============================================================================
-- TABLE: food_types
-- ==============================================================================
CREATE TABLE food_types (
  food_type_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: food_types_pkey (id)
-- CHECK (2200_31922_5_not_null): id IS NOT NULL
-- CHECK (2200_31922_1_not_null): food_type_id IS NOT NULL
-- CREATE UNIQUE INDEX food_types_pkey ON public.food_types USING btree (id);


-- ==============================================================================
-- TABLE: restriction_tokens
-- ==============================================================================
CREATE TABLE restriction_tokens (
  token text NOT NULL
);

-- PK: restriction_tokens_pkey (token)
-- CHECK (2200_54096_1_not_null): token IS NOT NULL
-- CREATE UNIQUE INDEX restriction_tokens_pkey ON public.restriction_tokens USING btree (token);


-- ==============================================================================
-- TABLE: dietary_restrictions
-- ==============================================================================
CREATE TABLE dietary_restrictions (
  dietary_restriction_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text,
  excludes_tokens text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

-- PK: dietary_restrictions_pkey (id)
-- CHECK (2200_29004_6_not_null): id IS NOT NULL
-- CHECK (2200_29004_1_not_null): dietary_restriction_id IS NOT NULL
-- CREATE UNIQUE INDEX dietary_restrictions_pkey ON public.dietary_restrictions USING btree (id);


-- ==============================================================================
-- TABLE: dietary_preferences
-- ==============================================================================
CREATE TABLE dietary_preferences (
  dietary_preference_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0
);

-- PK: dietary_preferences_pkey (id)
-- CHECK (2200_52085_6_not_null): id IS NOT NULL
-- CHECK (2200_52085_1_not_null): dietary_preference_id IS NOT NULL
-- CREATE UNIQUE INDEX dietary_preferences_pkey ON public.dietary_preferences USING btree (id);


-- ==============================================================================
-- TABLE: foods
-- ==============================================================================
CREATE TABLE foods (
  food_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  food_group_id text,
  food_source_id text,
  food_type_id text,
  brand text,
  food_preparation_method_id text,
  quantity numeric,
  food_measurement_unit_id text,
  correction_factor numeric,
  cooking_factor numeric,
  calories_per_unit numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  fat_sat_g numeric,
  fat_trans_g numeric,
  cholesterol_mg numeric,
  sodium_mg numeric,
  calcium_mg numeric,
  iron_mg numeric,
  potassium_mg numeric,
  magnesium_mg numeric,
  vitamins_ids text,
  minerals_ids text,
  dietary_restrictions_ids_deprecated text,
  diet_tags_ids text,
  functional_tags_ids text,
  tags_ids text,
  food_facts_source_id text,
  url_image text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dietary_preference text,
  allergen_review_status text NOT NULL DEFAULT 'unreviewed'::text
);

-- PK: foods_pkey (id)
-- UNIQUE: foods_food_id_unique (food_id)
-- CHECK (foods_allergen_review_status_check): (allergen_review_status = ANY (ARRAY['unreviewed'::text, 'reviewed_none'::text, 'reviewed_has_allergens'::text]))
-- CHECK (2200_31871_1_not_null): food_id IS NOT NULL
-- CHECK (2200_31871_36_not_null): id IS NOT NULL
-- CHECK (2200_31871_38_not_null): allergen_review_status IS NOT NULL
-- CREATE UNIQUE INDEX foods_food_id_unique ON public.foods USING btree (food_id);
-- CREATE UNIQUE INDEX foods_pkey ON public.foods USING btree (id);


-- ==============================================================================
-- TABLE: food_restriction_tags
-- ==============================================================================
CREATE TABLE food_restriction_tags (
  food_id text NOT NULL,
  token text NOT NULL
);

-- PK: food_restriction_tags_pkey (food_id, token)
-- FK: food_restriction_tags_food_id_fkey: food_id -> foods.food_id
-- FK: food_restriction_tags_token_fkey: token -> restriction_tokens.token
-- CHECK (2200_54112_2_not_null): token IS NOT NULL
-- CHECK (2200_54112_1_not_null): food_id IS NOT NULL
-- CREATE UNIQUE INDEX food_restriction_tags_pkey ON public.food_restriction_tags USING btree (food_id, token);


-- ==============================================================================
-- TABLE: meal_types
-- ==============================================================================
CREATE TABLE meal_types (
  meal_type_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- PK: meal_types_pkey (id)
-- CHECK (2200_33333_1_not_null): meal_type_id IS NOT NULL
-- CHECK (2200_33333_5_not_null): id IS NOT NULL
-- CREATE UNIQUE INDEX meal_types_pkey ON public.meal_types USING btree (id);


-- ==============================================================================
-- TABLE: meals
-- ==============================================================================
CREATE TABLE meals (
  meal_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  meal_type text,
  prep_time_min bigint,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  diet_tags_raw text,
  ingredients_json jsonb,
  instruction_ptbr text,
  instruction_en text,
  instruction_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dietary_preference text,
  restriction_tags text[] DEFAULT '{}'::text[],
  diet_tags text[] DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true
);

-- PK: meals_pkey (id)
-- CHECK (2200_33214_16_not_null): id IS NOT NULL
-- CHECK (2200_33214_1_not_null): meal_id IS NOT NULL
-- CHECK (2200_33214_20_not_null): is_active IS NOT NULL
-- CREATE INDEX idx_meals_diettag ON public.meals USING gin (diet_tags);
-- CREATE INDEX idx_meals_pref ON public.meals USING btree (dietary_preference);
-- CREATE INDEX idx_meals_restr ON public.meals USING gin (restriction_tags);
-- CREATE UNIQUE INDEX meals_pkey ON public.meals USING btree (id);


-- ==============================================================================
-- TABLE: meal_plans
-- ==============================================================================
CREATE TABLE meal_plans (
  name_ptbr text,
  name_en text,
  name_fr text,
  goals_ids jsonb,
  calories bigint,
  meals_per_day bigint,
  instruction_ptbr text,
  instruction_en text,
  instruction_fr text,
  meal_plan_id text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by_ai boolean,
  created_at timestamp with time zone,
  days_per_week integer,
  is_active boolean NOT NULL DEFAULT true,
  dietary_preference text,
  restriction_tags text[],
  ai_filled_slots integer,
  deterministic_fallback_slots integer,
  ai_reasoning text
);

-- PK: meal_plans_pkey (id)
-- UNIQUE: meal_plans_meal_plan_id_unique (meal_plan_id)
-- CHECK (2200_52343_11_not_null): id IS NOT NULL
-- CHECK (2200_52343_15_not_null): is_active IS NOT NULL
-- CREATE UNIQUE INDEX meal_plans_meal_plan_id_unique ON public.meal_plans USING btree (meal_plan_id);
-- CREATE UNIQUE INDEX meal_plans_pkey ON public.meal_plans USING btree (id);


-- ==============================================================================
-- TABLE: meal_plan_meals
-- ==============================================================================
CREATE TABLE meal_plan_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id text,
  day_order bigint,
  meal_order bigint,
  meal_type_id text,
  meal_id text
);

-- PK: meal_plan_foods_pkey (id)
-- CHECK (meal_plan_meals_meal_id_is_uuid): (meal_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text)
-- CHECK (meal_plan_meals_meal_plan_id_is_uuid): (meal_plan_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'::text)
-- CHECK (2200_52198_1_not_null): id IS NOT NULL
-- CREATE INDEX idx_meal_plan_meals_meal_id ON public.meal_plan_meals USING btree (meal_id);
-- CREATE INDEX idx_meal_plan_meals_meal_plan_id ON public.meal_plan_meals USING btree (meal_plan_id);
-- CREATE UNIQUE INDEX meal_plan_foods_pkey ON public.meal_plan_meals USING btree (id);
