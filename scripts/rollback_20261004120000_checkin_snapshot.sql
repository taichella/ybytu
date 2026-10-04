-- Rollback de supabase/migrations/20261004120000_checkin_snapshot_meal_id_and_exercise_count.sql
-- Remove triggers, funções e as colunas novas. calories_consumed já existia
-- antes: não é removida, só volta a ficar NULL (como era).

BEGIN;

DROP TRIGGER IF EXISTS completed_meals_snapshot_slot ON public.completed_meals;
DROP FUNCTION IF EXISTS public.completed_meals_snapshot_slot();
ALTER TABLE public.completed_meals DROP COLUMN IF EXISTS meal_id;
UPDATE public.completed_meals SET calories_consumed = NULL;

DROP TRIGGER IF EXISTS completed_workouts_snapshot_count ON public.completed_workouts;
DROP FUNCTION IF EXISTS public.completed_workouts_snapshot_count();
ALTER TABLE public.completed_workouts DROP COLUMN IF EXISTS exercise_count;

COMMIT;
