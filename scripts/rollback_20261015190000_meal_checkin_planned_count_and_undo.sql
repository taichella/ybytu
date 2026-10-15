-- Rollback de supabase/migrations/20261015190000_meal_checkin_planned_count_and_undo.sql
-- Remove o desfazer e a contagem; o gatilho volta à versão de 20261004120000.
BEGIN;
DROP FUNCTION IF EXISTS public.unmark_meal(uuid);

CREATE OR REPLACE FUNCTION public.completed_meals_snapshot_slot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_meal_id text; v_name text; v_kcal numeric;
BEGIN
  SELECT mpm.meal_id, m.name_ptbr, m.calories INTO v_meal_id, v_name, v_kcal
  FROM public.meal_plan_meals mpm LEFT JOIN public.meals m ON m.id::text = mpm.meal_id
  WHERE mpm.meal_plan_id = NEW.meal_plan_id::text AND mpm.day_order = NEW.day_order AND mpm.meal_order = NEW.meal_order;
  IF v_meal_id IS NULL THEN RAISE EXCEPTION 'meal_slot_not_found' USING ERRCODE = 'P0001'; END IF;
  NEW.meal_id := v_meal_id::uuid;
  NEW.meal_name := COALESCE(v_name, NEW.meal_name);
  NEW.calories_consumed := round(v_kcal)::integer;
  RETURN NEW;
END;
$$;

ALTER TABLE public.completed_meals DROP COLUMN IF EXISTS meals_planned;
COMMIT;
