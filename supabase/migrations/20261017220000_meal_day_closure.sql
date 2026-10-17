-- ============================================================================
-- MIGRATION: 20261017220000_meal_day_closure.sql
-- Rollback:  scripts/rollback_20261017220000_meal_day_closure.sql
--
-- Encerrar o registro do dia alimentar (briefing
-- docs/propostas/20261017_briefing_fechamento_dia_alimentar.md, desenho
-- designs/AlunoAlimentacaoCheckin.dc.html, decisões da Taina 2026-10-17).
--
-- Encerrar é o aluno declarando que terminou de REGISTRAR o dia -- não que
-- terminou de comer. O sistema não deduz nada disso. Substitui o "sem tabela de
-- dia alimentar" de 20261015190000: agora existe um evento real (o aluno
-- declarou), então ele é gravado.
--
-- 1. meal_day_closures: uma linha por aluno e DATA LOCAL (fuso do aluno,
--    student_timezone). closed_at NULL = reaberto. closed_by: 'student' (botão)
--    ou 'auto_last_meal' (registrou a última refeição do cardápio). Dia que o
--    aluno nunca encerrou não tem linha -- é "registro não encerrado pelo aluno".
-- 2. close_meal_day / reopen_meal_day: só o dia de HOJE do aluno. Reabrir vale
--    até o fim do mesmo dia (decisão 1); depois o dia é histórico. Sem diálogo
--    ao encerrar (decisão 2) -- isso é do app.
-- 3. Dia encerrado não aceita registro nem desfazer de refeição: o banco recusa
--    com 'meal_day_closed' (o app reabre antes, com a confirmação do desenho).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.meal_day_closures (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date       date NOT NULL,
  meal_plan_id     uuid,
  day_order        integer,
  closed_at        timestamptz,
  closed_by        text CHECK (closed_by IN ('student', 'auto_last_meal')),
  first_closed_at  timestamptz NOT NULL DEFAULT now(),
  reopen_count     integer NOT NULL DEFAULT 0,
  last_reopened_at timestamptz,
  PRIMARY KEY (user_id, local_date)
);

COMMENT ON TABLE public.meal_day_closures IS
  'Aluno declarou que terminou de REGISTRAR o dia alimentar (2026-10-17). closed_at NULL = reaberto. Sem linha = não encerrado. Nunca significa "comeu só isso".';

ALTER TABLE public.meal_day_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_day_closures_own_select ON public.meal_day_closures;
CREATE POLICY meal_day_closures_own_select ON public.meal_day_closures
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Escrita só pelas funções abaixo (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.meal_day_is_closed(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meal_day_closures c
    WHERE c.user_id = p_user
      AND c.local_date = (now() AT TIME ZONE public.student_timezone(p_user))::date
      AND c.closed_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.close_meal_day(p_meal_plan_id uuid, p_day_order integer, p_closed_by text DEFAULT 'student')
RETURNS TABLE(closed_at timestamptz, closed_by text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  IF p_closed_by NOT IN ('student', 'auto_last_meal') THEN
    RAISE EXCEPTION 'invalid_closed_by' USING ERRCODE = 'P0001';
  END IF;
  v_today := (now() AT TIME ZONE public.student_timezone(v_user))::date;

  INSERT INTO public.meal_day_closures AS c (user_id, local_date, meal_plan_id, day_order, closed_at, closed_by)
  VALUES (v_user, v_today, p_meal_plan_id, p_day_order, now(), p_closed_by)
  ON CONFLICT (user_id, local_date) DO UPDATE
    SET closed_at = now(), closed_by = EXCLUDED.closed_by,
        meal_plan_id = EXCLUDED.meal_plan_id, day_order = EXCLUDED.day_order
    WHERE c.closed_at IS NULL;   -- já encerrado: não muda nada

  RETURN QUERY
  SELECT c.closed_at, c.closed_by FROM public.meal_day_closures c
  WHERE c.user_id = v_user AND c.local_date = v_today;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_meal_day()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.meal_day_closures c
  SET closed_at = NULL, reopen_count = c.reopen_count + 1, last_reopened_at = now()
  WHERE c.user_id = v_user
    AND c.local_date = (now() AT TIME ZONE public.student_timezone(v_user))::date
    AND c.closed_at IS NOT NULL;
  -- Sem linha encerrada hoje: nada a reabrir (idempotente, sem erro).
END;
$$;

REVOKE ALL ON FUNCTION public.meal_day_is_closed(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_meal_day(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reopen_meal_day() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_meal_day(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_meal_day() TO authenticated;

-- 3a. Registro de refeição em dia encerrado: recusado.
CREATE OR REPLACE FUNCTION public.completed_meals_block_closed_day()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.meal_day_is_closed(NEW.user_id) THEN
    RAISE EXCEPTION 'meal_day_closed' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_meals_block_closed_day ON public.completed_meals;
CREATE TRIGGER completed_meals_block_closed_day
  BEFORE INSERT ON public.completed_meals
  FOR EACH ROW EXECUTE FUNCTION public.completed_meals_block_closed_day();

-- 3b. Desfazer em dia encerrado: recusado. Mesma função de 20261015190000,
-- mais a checagem.
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
  IF public.meal_day_is_closed(v_user) THEN
    RAISE EXCEPTION 'meal_day_closed' USING ERRCODE = 'P0001';
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

COMMIT;
