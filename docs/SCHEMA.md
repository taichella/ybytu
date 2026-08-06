# Schema real do banco (referência)

Gerado a partir de `information_schema.columns` no banco Supabase linkado (projeto `jwjfmvkfzelbdvyqetyb`), em 2026-08-05. Não é um pg_dump — é uma reconstrução legível para consulta rápida, sem dados.

`supabase db pull` falha por conflito de histórico de migrations pré-existente (débito antigo, não resolvido aqui). Este documento e `supabase/schema.sql` existem justamente para não depender do pull: qualquer agente/dev pode ler o schema real sem acesso ao banco.

## Tabelas com/sem `is_active`

**Têm `is_active`:** `dietary_restrictions`, `meal_plans`, `meals`, `training_plans`

**NÃO têm `is_active`:** `activity_levels`, `best_forms`, `completed_meals`, `completed_workouts`, `diet_tags`, `dietary_preferences`, `exercise_condition_proposals`, `exercise_effective_cautions`, `exercise_environment`, `exercise_equipments`, `exercise_levels`, `exercises`, `food_groups`, `food_measurement_units`, `food_preparation_methods`, `food_sources`, `food_types`, `foods`, `functional_tags`, `genders`, `goals`, `health_conditions`, `meal_plan_meals`, `meal_types`, `metabolic_facts`, `minerals`, `muscle_groups`, `onboarding_exercise_equipments`, `onboarding_health_conditions`, `onboarding_muscle_groups`, `onboarding_physical_conditions`, `physical_condition_exercise_slugs`, `physical_conditions`, `plan_reviews`, `plan_share_tokens`, `profiles`, `rep_types`, `staff`, `staff_invites`, `staff_roles`, `subscription_types`, `tags`, `training_plan_exercises`, `user_meal_plans`, `user_meal_profiles`, `user_training_plans`, `user_training_profiles`, `vitamins`

## ⚠️ Incoerências de nomenclatura conhecidas

- `genders` usa `label_ptbr`/`label_en`/`label_fr` enquanto outras tabelas de lookup (ex: `goals`, `exercise_levels`) usam `name_ptbr`. Confira a coluna real antes de escrever query.
- `foods` usa `calories_per_unit` e `carbs_g` (não `kcal`/`carb`).
- `exercises` usa `name_ptbr`, `muscle_groups_ids` (plural, array), `exercise_level_id` (singular, FK), `exercise_equipments_ids` (plural, array), `calories`.
- Tabelas com colunas `label_*`: `activity_levels`, `best_forms`
- Tabelas com colunas `name_*`: `best_forms`, `diet_tags`, `dietary_preferences`, `dietary_restrictions`, `exercise_environment`, `exercise_equipments`, `exercise_levels`, `exercises`, `food_groups`, `food_measurement_units`, `food_preparation_methods`, `food_sources`, `food_types`, `foods`, `functional_tags`, `genders`, `goals`, `health_conditions`, `meal_plans`, `meal_types`, `meals`, `metabolic_facts`, `minerals`, `muscle_groups`, `onboarding_exercise_equipments`, `onboarding_health_conditions`, `onboarding_muscle_groups`, `onboarding_physical_conditions`, `physical_conditions`, `rep_types`, `subscription_types`, `tags`, `training_plans`, `vitamins`
- Possíveis anomalias singular/plural em colunas _id/_ids (nome sugere lista, mas tipo real não é array):
  - `foods.vitamins_ids`, `foods.minerals_ids`, `foods.dietary_restrictions_ids`, `foods.diet_tags_ids`, `foods.functional_tags_ids`, `foods.tags_ids` — todas `TEXT`, não `uuid[]`. Confirmado via `udt_name`: é texto puro (provavelmente string separada por vírgula ou JSON serializado em string), **diferente** de `exercises.muscle_groups_ids`/`exercise_equipments_ids`/`profiles.*_ids`, que são `uuid[]` de verdade. Não assuma array do Postgres nessas colunas de `foods` — trate como string e faça parse conforme o formato real gravado.
  - `meal_plans.goals_ids`, `training_plans.goals_ids`, `training_plans.exercise_environments_ids`, `training_plans.exercise_equipment_ids`, `onboarding_physical_conditions.main_physical_conditions_ids` — mesma checagem recomendada antes de tratar como array.

## Tabelas principais e de lookup

### `profiles`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| created_at | timestamp with time zone | YES | `now()` |
| gender_id | uuid | YES |  |
| age | integer | YES |  |
| weight_kg | integer | YES |  |
| height_cm | integer | YES |  |
| health_conditions_ids | uuid[] | YES |  |
| activity_level_id | uuid | YES |  |
| goals_ids | uuid[] | YES |  |
| dietary_preference_id | uuid | YES |  |
| dietary_restrictions_ids | uuid[] | YES |  |
| exercise_level_id | uuid | YES |  |
| muscle_groups_ids | uuid[] | YES |  |
| exercise_equipments_ids | uuid[] | YES |  |
| training_duration_minutes | integer | YES | `30` |
| onboarding_completed | boolean | YES |  |
| first_name | text | YES |  |
| last_name | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| full_name | text | YES |  |
| subscription_type_id | uuid | YES |  |
| current_training_plan_id | uuid | YES | `gen_random_uuid()` |
| current_meal_plan_id | uuid | YES | `gen_random_uuid()` |
| physical_conditions_ids | uuid[] | YES |  |
| pregnancy_trimester | integer | YES |  |
| training_days_per_week | integer | YES |  |
| exercise_environment_id | uuid | YES |  |
| nutrition_days_per_week | integer | YES |  |
| disliked_foods | text | YES |  |
| meals_per_day | integer | YES |  |
| whatsapp_phone | text | YES |  |
| plan_generation_status | text | YES | `'pending'::text` |
| plan_ready_notified_at | timestamp with time zone | YES |  |
| plan_review_reminder_sent_at | timestamp with time zone | YES |  |
| user_notified_ready_at | timestamp with time zone | YES |  |

### `exercises`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| instruction_ptbr | text | YES |  |
| instruction_en | text | YES |  |
| instruction_fr | text | YES |  |
| muscle_groups_ids | text[] | YES |  |
| exercise_equipments_ids | text[] | YES |  |
| exercise_level_id | text | YES |  |
| avoid_health_conditions_ids | text[] | YES |  |
| caution_health_condition_ids | text[] | YES |  |
| calories | integer | YES |  |
| image_url | text | YES |  |
| video_url | text | YES |  |
| exercise_id | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `foods`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| food_group_id | text | YES |  |
| food_source_id | text | YES |  |
| food_type_id | text | YES |  |
| brand | text | YES |  |
| food_preparation_method_id | text | YES |  |
| quantity | numeric | YES |  |
| food_measurement_unit_id | text | YES |  |
| correction_factor | numeric | YES |  |
| cooking_factor | numeric | YES |  |
| calories_per_unit | numeric | YES |  |
| protein_g | numeric | YES |  |
| carbs_g | numeric | YES |  |
| fat_g | numeric | YES |  |
| fiber_g | numeric | YES |  |
| sugar_g | numeric | YES |  |
| fat_sat_g | numeric | YES |  |
| fat_trans_g | numeric | YES |  |
| cholesterol_mg | numeric | YES |  |
| sodium_mg | numeric | YES |  |
| calcium_mg | numeric | YES |  |
| iron_mg | numeric | YES |  |
| potassium_mg | numeric | YES |  |
| magnesium_mg | numeric | YES |  |
| vitamins_ids | text | YES |  |
| minerals_ids | text | YES |  |
| dietary_restrictions_ids | text | YES |  |
| diet_tags_ids | text | YES |  |
| functional_tags_ids | text | YES |  |
| tags_ids | text | YES |  |
| food_facts_source_id | text | YES |  |
| url_image | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| dietary_preference | text | YES |  |

### `meals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| meal_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| meal_type | text | YES |  |
| prep_time_min | bigint | YES |  |
| calories | numeric | YES |  |
| protein_g | numeric | YES |  |
| carbs_g | numeric | YES |  |
| fat_g | numeric | YES |  |
| diet_tags_raw | text | YES |  |
| ingredients_json | jsonb | YES |  |
| instruction_ptbr | text | YES |  |
| instruction_en | text | YES |  |
| instruction_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| dietary_preference | text | YES |  |
| restriction_tags | text[] | YES | `'{}'::text[]` |
| diet_tags | text[] | YES | `'{}'::text[]` |
| is_active | boolean | NO | `true` |

### `meal_plans`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| goals_ids | jsonb | YES |  |
| calories | bigint | YES |  |
| meals_per_day | bigint | YES |  |
| instruction_ptbr | text | YES |  |
| instruction_en | text | YES |  |
| instruction_fr | text | YES |  |
| meal_plan_id | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| created_by_ai | boolean | YES |  |
| created_at | timestamp with time zone | YES |  |
| days_per_week | integer | YES |  |
| is_active | boolean | NO | `true` |
| dietary_preference | text | YES |  |
| restriction_tags | text[] | YES |  |

### `meal_plan_meals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| meal_plan_id | text | YES |  |
| day_order | bigint | YES |  |
| meal_order | bigint | YES |  |
| meal_type_id | text | YES |  |
| meal_id | text | YES |  |

### `training_plans`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| training_plan_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| goals_ids | text | YES |  |
| exercise_environments_ids | text | YES |  |
| exercise_equipment_ids | text | YES |  |
| exercise_level_id | text | YES |  |
| days_per_week | integer | YES |  |
| duration_minutes | bigint | YES |  |
| instruction_ptbr | text | YES |  |
| instruction_en | text | YES |  |
| instruction_fr | text | YES |  |
| created_by_ai | boolean | YES |  |
| created_at | timestamp with time zone | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| is_active | boolean | NO | `true` |
| caution_warnings | jsonb | YES | `'[]'::jsonb` |

### `training_plan_exercises`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| training_plan_id | text | NO |  |
| exercise_id | text | YES |  |
| exercise_order | bigint | YES |  |
| sets | bigint | YES |  |
| reps | bigint | YES |  |
| rep_type_id | text | YES |  |
| rest_seconds | bigint | YES |  |
| cadence_eccentric | bigint | YES |  |
| cadence_isometric_bottom | bigint | YES |  |
| cadence_concentric | bigint | YES |  |
| cadence_isometric_top | bigint | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| day_number | smallint | YES |  |
| order_within_day | smallint | YES |  |

### `genders`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| name | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `goals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| goal_id | text | NO |  |
| applicable_to | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `exercise_levels`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| exercise_level_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `dietary_preferences`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| dietary_preference_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `health_conditions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| health_condition_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |

### `physical_conditions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| physical_condition_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |

### `muscle_groups`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| muscle_group_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `exercise_equipments`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| exercise_equipment_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

## Todas as demais tabelas do schema public

### `activity_levels`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| name | text | NO |  |
| label_ptbr | text | YES |  |
| label_en | text | YES |  |
| label_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `best_forms`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| best_form_id | text | NO |  |
| label_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `completed_meals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES |  |
| calories_consumed | integer | YES |  |
| completed_at | timestamp with time zone | YES | `timezone('utc'::text, now())` |

### `completed_workouts`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES |  |
| completed_at | timestamp with time zone | YES | `timezone('utc'::text, now())` |

### `diet_tags`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| diet_tag_id | text | NO |  |
| name_ptbr | text | NO |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| category | text | YES |  |
| description_ptbr | text | YES |  |
| sort_order | integer | YES | `0` |

### `dietary_restrictions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| dietary_restriction_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
| category | text | YES |  |
| excludes_tokens | text[] | YES | `'{}'::text[]` |
| is_active | boolean | YES | `true` |

### `exercise_condition_proposals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| exercise_id | text | NO |  |
| condition_slug | text | NO |  |
| tipo | text | NO | `'caution'::text` |
| status | text | NO | `'ai_suggested'::text` |
| rule_id | text | NO |  |
| clinical_reason | text | YES |  |
| review_priority | text | NO | `'normal'::text` |
| proposed_at | timestamp with time zone | NO | `now()` |
| reviewed_at | timestamp with time zone | YES |  |
| reviewed_by | text | YES |  |

### `exercise_effective_cautions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| exercise_id | text | YES |  |
| condition_slug | text | YES |  |
| tipo | text | YES |  |
| source | text | YES |  |

### `exercise_environment`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| exercise_environment_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `food_groups`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_group_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `food_measurement_units`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_measurement_unit_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `food_preparation_methods`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_preparation_method_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `food_sources`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_source_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `food_types`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| food_type_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `functional_tags`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| functional_tag_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `meal_types`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| meal_type_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `metabolic_facts`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| metabolic_fact_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `minerals`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| mineral_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `onboarding_exercise_equipments`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | YES | `gen_random_uuid()` |
| exercise_equipment_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| main_exercise_equipments_ids | uuid[] | YES |  |

### `onboarding_health_conditions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO |  |
| health_condition_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| main_health_conditions_ids | uuid[] | YES |  |

### `onboarding_muscle_groups`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO |  |
| muscle_group_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| main_muscle_groups_ids | uuid[] | YES |  |

### `onboarding_physical_conditions`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| physical_condition_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| main_physical_conditions_ids | text | YES |  |

### `physical_condition_exercise_slugs`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| physical_condition_id | text | NO |  |
| exercise_condition_slugs | text[] | NO | `'{}'::text[]` |
| pending_slugs | text[] | NO | `'{}'::text[]` |

### `plan_reviews`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| role | text | NO |  |
| reviewer_name | text | NO |  |
| reviewer_credential | text | YES |  |
| note_ptbr | text | YES |  |
| training_plan_id | text | YES |  |
| meal_plan_id | text | YES |  |
| created_at | timestamp with time zone | NO | `now()` |
| updated_at | timestamp with time zone | NO | `now()` |

### `plan_share_tokens`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| token | text | NO |  |
| created_at | timestamp with time zone | NO | `now()` |
| expires_at | timestamp with time zone | NO | `(now() + '90 days'::interval)` |
| revoked_at | timestamp with time zone | YES |  |
| last_accessed_at | timestamp with time zone | YES |  |

### `rep_types`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| rep_type_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `staff`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| user_id | uuid | NO |  |
| full_name | text | NO |  |
| created_at | timestamp with time zone | NO | `now()` |
| created_by | uuid | YES |  |
| revoked_at | timestamp with time zone | YES |  |

### `staff_invites`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| email | text | NO |  |
| role | text | NO |  |
| token | text | NO |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | NO | `now()` |
| expires_at | timestamp with time zone | NO | `(now() + '7 days'::interval)` |
| used_at | timestamp with time zone | YES |  |
| revoked_at | timestamp with time zone | YES |  |

### `staff_roles`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| role | text | NO |  |
| granted_at | timestamp with time zone | NO | `now()` |
| granted_by | uuid | NO |  |
| revoked_at | timestamp with time zone | YES |  |

### `subscription_types`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| subscription_type_id | text | YES |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| includes_training | boolean | YES |  |
| includes_meals | boolean | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `tags`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| tag_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |

### `user_meal_plans`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES |  |
| meal_plan_id | uuid | YES |  |
| created_at | timestamp with time zone | YES | `now()` |

### `user_meal_profiles`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES |  |
| dietary_restrictions | text[] | YES |  |
| meals_per_day | integer | YES |  |
| activity_level | text | YES |  |
| food_aversions | text | YES |  |
| onboarding_muscle_groups_ids | uuid[] | YES |  |

### `user_training_plans`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES |  |
| training_plan_id | uuid | YES |  |
| created_at | timestamp with time zone | YES | `now()` |

### `user_training_profiles`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | YES | `auth.uid()` |
| days_per_week | integer | YES |  |
| duration_minutes | integer | YES |  |
| exercise_level_id | uuid | YES | `gen_random_uuid()` |
| goals_ids | uuid[] | YES |  |
| exercise_environments_ids | uuid[] | YES |  |
| exercise_equipment_ids | uuid[] | YES |  |
| onboarding_muscle_groups_ids | uuid[] | YES |  |

### `vitamins`

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| vitamin_id | text | NO |  |
| name_ptbr | text | YES |  |
| name_en | text | YES |  |
| name_fr | text | YES |  |
| id | uuid | NO | `gen_random_uuid()` |
