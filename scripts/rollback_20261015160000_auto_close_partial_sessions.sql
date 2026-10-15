-- Rollback de supabase/migrations/20261015160000_auto_close_partial_sessions.sql
-- Para o cron, remove o fechamento automático e as colunas novas, e volta
-- close_workout_session / checkin_force_server_time à versão de 20261015120000.
BEGIN;
SELECT cron.unschedule('ybytu-auto-close-sessions-hourly');
DROP FUNCTION IF EXISTS public.auto_close_stale_exercise_sessions(uuid);
DROP FUNCTION IF EXISTS public.student_timezone(uuid);

CREATE OR REPLACE FUNCTION public.checkin_force_server_time()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.completed_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_workout_session(p_training_plan_id uuid, p_day_number integer, p_session_name text)
RETURNS public.completed_workouts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_row public.completed_workouts;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user AND p.current_training_plan_id = p_training_plan_id) THEN
    RAISE EXCEPTION 'training_plan_not_active' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.completed_workouts (user_id, training_plan_id, day_number, session_name)
  VALUES (v_user, p_training_plan_id, p_day_number, left(coalesce(p_session_name, ''), 200)) RETURNING * INTO v_row;
  UPDATE public.completed_exercises SET workout_id = v_row.id
  WHERE user_id = v_user AND training_plan_id = p_training_plan_id AND day_number = p_day_number AND workout_id IS NULL;
  RETURN v_row;
END;
$$;

ALTER TABLE public.completed_workouts DROP COLUMN IF EXISTS exercises_done, DROP COLUMN IF EXISTS auto_closed;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS timezone;
COMMIT;
