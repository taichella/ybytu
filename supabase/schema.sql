-- Baseline de schema (somente leitura, gerado via information_schema.columns)
-- Gerado em 2026-08-05T13:36:10.211Z a partir do banco Supabase linkado (jwjfmvkfzelbdvyqetyb)
-- NAO eh um pg_dump; reconstruido a partir de information_schema para servir de referencia legivel.
-- Nao contem dados, apenas estrutura (nomes de tabela/coluna/tipo).

CREATE TABLE public.activity_levels (
  name text NOT NULL,
  label_ptbr text,
  label_en text,
  label_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.best_forms (
  best_form_id text NOT NULL,
  label_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.completed_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  calories_consumed integer,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.completed_workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.diet_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  diet_tag_id text NOT NULL,
  name_ptbr text NOT NULL,
  name_en text,
  name_fr text,
  category text,
  description_ptbr text,
  sort_order integer DEFAULT 0
);

CREATE TABLE public.dietary_preferences (
  dietary_preference_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.dietary_restrictions (
  dietary_restriction_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text,
  excludes_tokens text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true
);

CREATE TABLE public.exercise_condition_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id text NOT NULL,
  condition_slug text NOT NULL,
  tipo text NOT NULL DEFAULT 'caution'::text,
  status text NOT NULL DEFAULT 'ai_suggested'::text,
  rule_id text NOT NULL,
  clinical_reason text,
  review_priority text NOT NULL DEFAULT 'normal'::text,
  proposed_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text
);

CREATE TABLE public.exercise_effective_cautions (
  exercise_id text,
  condition_slug text,
  tipo text,
  source text
);

CREATE TABLE public.exercise_environment (
  exercise_environment_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.exercise_equipments (
  exercise_equipment_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.exercise_levels (
  exercise_level_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.exercises (
  name_ptbr text,
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
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.food_groups (
  food_group_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.food_measurement_units (
  food_measurement_unit_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.food_preparation_methods (
  food_preparation_method_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.food_sources (
  food_source_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.food_types (
  food_type_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.foods (
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
  dietary_restrictions_ids text,
  diet_tags_ids text,
  functional_tags_ids text,
  tags_ids text,
  food_facts_source_id text,
  url_image text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dietary_preference text
);

CREATE TABLE public.functional_tags (
  functional_tag_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.genders (
  name text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.goals (
  goal_id text NOT NULL,
  applicable_to text,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.health_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  health_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text
);

CREATE TABLE public.meal_plan_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id text,
  day_order bigint,
  meal_order bigint,
  meal_type_id text,
  meal_id text
);

CREATE TABLE public.meal_plans (
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
  restriction_tags text[]
);

CREATE TABLE public.meal_types (
  meal_type_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.meals (
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

CREATE TABLE public.metabolic_facts (
  metabolic_fact_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.minerals (
  mineral_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.muscle_groups (
  muscle_group_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.onboarding_exercise_equipments (
  id uuid DEFAULT gen_random_uuid(),
  exercise_equipment_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  main_exercise_equipments_ids uuid[]
);

CREATE TABLE public.onboarding_health_conditions (
  id uuid NOT NULL,
  health_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  main_health_conditions_ids uuid[]
);

CREATE TABLE public.onboarding_muscle_groups (
  id uuid NOT NULL,
  muscle_group_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  main_muscle_groups_ids uuid[]
);

CREATE TABLE public.onboarding_physical_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  physical_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  main_physical_conditions_ids text
);

CREATE TABLE public.physical_condition_exercise_slugs (
  physical_condition_id text NOT NULL,
  exercise_condition_slugs text[] NOT NULL DEFAULT '{}'::text[],
  pending_slugs text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE TABLE public.physical_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  physical_condition_id text,
  name_ptbr text,
  name_en text,
  name_fr text
);

CREATE TABLE public.plan_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_credential text,
  note_ptbr text,
  training_plan_id text,
  meal_plan_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.plan_share_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '90 days'::interval),
  revoked_at timestamp with time zone,
  last_accessed_at timestamp with time zone
);

CREATE TABLE public.profiles (
  created_at timestamp with time zone DEFAULT now(),
  gender_id uuid,
  age integer,
  weight_kg integer,
  height_cm integer,
  health_conditions_ids uuid[],
  activity_level_id uuid,
  goals_ids uuid[],
  dietary_preference_id uuid,
  dietary_restrictions_ids uuid[],
  exercise_level_id uuid,
  muscle_groups_ids uuid[],
  exercise_equipments_ids uuid[],
  training_duration_minutes integer DEFAULT 30,
  onboarding_completed boolean,
  first_name text,
  last_name text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  subscription_type_id uuid,
  current_training_plan_id uuid DEFAULT gen_random_uuid(),
  current_meal_plan_id uuid DEFAULT gen_random_uuid(),
  physical_conditions_ids uuid[],
  pregnancy_trimester integer,
  training_days_per_week integer,
  exercise_environment_id uuid,
  nutrition_days_per_week integer,
  disliked_foods text,
  meals_per_day integer,
  whatsapp_phone text,
  plan_generation_status text DEFAULT 'pending'::text,
  plan_ready_notified_at timestamp with time zone,
  plan_review_reminder_sent_at timestamp with time zone,
  user_notified_ready_at timestamp with time zone
);

CREATE TABLE public.rep_types (
  rep_type_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.staff (
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  revoked_at timestamp with time zone
);

CREATE TABLE public.staff_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL,
  token text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  used_at timestamp with time zone,
  revoked_at timestamp with time zone
);

CREATE TABLE public.staff_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL,
  revoked_at timestamp with time zone
);

CREATE TABLE public.subscription_types (
  subscription_type_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  includes_training boolean,
  includes_meals boolean,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.tags (
  tag_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE public.training_plan_exercises (
  training_plan_id text NOT NULL,
  exercise_id text,
  exercise_order bigint,
  sets bigint,
  reps bigint,
  rep_type_id text,
  rest_seconds bigint,
  cadence_eccentric bigint,
  cadence_isometric_bottom bigint,
  cadence_concentric bigint,
  cadence_isometric_top bigint,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_number smallint,
  order_within_day smallint
);

CREATE TABLE public.training_plans (
  training_plan_id text,
  name_ptbr text,
  name_en text,
  name_fr text,
  goals_ids text,
  exercise_environments_ids text,
  exercise_equipment_ids text,
  exercise_level_id text,
  days_per_week integer,
  duration_minutes bigint,
  instruction_ptbr text,
  instruction_en text,
  instruction_fr text,
  created_by_ai boolean,
  created_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  caution_warnings jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE public.user_meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  meal_plan_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_meal_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  dietary_restrictions text[],
  meals_per_day integer,
  activity_level text,
  food_aversions text,
  onboarding_muscle_groups_ids uuid[]
);

CREATE TABLE public.user_training_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  training_plan_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_training_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  days_per_week integer,
  duration_minutes integer,
  exercise_level_id uuid DEFAULT gen_random_uuid(),
  goals_ids uuid[],
  exercise_environments_ids uuid[],
  exercise_equipment_ids uuid[],
  onboarding_muscle_groups_ids uuid[]
);

CREATE TABLE public.vitamins (
  vitamin_id text NOT NULL,
  name_ptbr text,
  name_en text,
  name_fr text,
  id uuid NOT NULL DEFAULT gen_random_uuid()
);
