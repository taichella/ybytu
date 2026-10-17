-- Desfaz supabase/migrations/20261017220000_meal_day_closure.sql.
-- ATENÇÃO: apaga o histórico de encerramentos do dia alimentar.
BEGIN;
DROP TRIGGER IF EXISTS completed_meals_block_closed_day ON public.completed_meals;
DROP FUNCTION IF EXISTS public.completed_meals_block_closed_day();

-- unmark_meal volta à versão de 20261015190000 (sem checar dia encerrado).
CREATE OR REPLACE FUNCTION public.unmark_meal(p_completed_meal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tz text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  v_tz := public.student_timezone(v_user);

  DELETE FROM public.completed_meals
  WHERE id = p_completed_meal_id
    AND user_id = v_user
    AND (completed_at AT TIME ZONE v_tz)::date = (now() AT TIME ZONE v_tz)::date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'meal_not_undoable' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.reopen_meal_day();
DROP FUNCTION IF EXISTS public.close_meal_day(uuid, integer, text);
DROP FUNCTION IF EXISTS public.meal_day_is_closed(uuid);
DROP TABLE IF EXISTS public.meal_day_closures;
COMMIT;
