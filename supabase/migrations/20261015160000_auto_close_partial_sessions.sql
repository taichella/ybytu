-- ============================================================================
-- MIGRATION: 20261015160000_auto_close_partial_sessions.sql
-- Rollback:  scripts/rollback_20261015160000_auto_close_partial_sessions.sql
--
-- Decisão da Taina (2026-10-15): sessão de marcação por exercício deixada
-- aberta fecha sozinha na VIRADA DO DIA, no fuso do aluno, como treino
-- parcial. Sessão de ontem pela metade confunde o aluno e o "3/6" perde sentido.
--
-- 1. profiles.timezone: fuso IANA do aparelho do aluno, gravado pelo
--    ybytu-get-user-plan (o app já manda ?timezone=). Sem fuso ou fuso
--    inválido -> America/Sao_Paulo.
-- 2. completed_workouts.exercises_done: quantos exercícios foram marcados na
--    sessão (null = treino concluído sem marcação por exercício). Junto com
--    exercise_count (total do dia, já existente) dá o "3 de 6" do feed.
--    completed_workouts.auto_closed: fechado pelo sistema na virada do dia.
-- 3. checkin_force_server_time: força hora do servidor e zera os campos acima
--    só para o ALUNO (authenticated/anon). Funções do sistema gravam a hora da
--    última marcação no fechamento automático.
-- 4. close_workout_session também grava exercises_done.
-- 5. auto_close_stale_exercise_sessions(p_user): fecha toda sessão aberta cuja
--    última marcação foi num dia anterior ao de hoje NO FUSO DO ALUNO. Chamada
--    pelo get-user-plan ao abrir o app (o aluno nunca vê a sessão de ontem) e
--    por um pg_cron em SQL puro de hora em hora (sem HTTP, sem segredo, sem
--    prazo de resposta) para o feed do profissional ficar certo mesmo se o
--    aluno não abrir o app.
-- ============================================================================

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.completed_workouts
  ADD COLUMN IF NOT EXISTS exercises_done integer,
  ADD COLUMN IF NOT EXISTS auto_closed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.checkin_force_server_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.completed_at := now();
    IF TG_TABLE_NAME = 'completed_workouts' THEN
      NEW.exercises_done := NULL;
      NEW.auto_closed := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fuso válido do aluno ou o padrão.
CREATE OR REPLACE FUNCTION public.student_timezone(p_user uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.timezone FROM public.profiles p
      WHERE p.id = p_user
        AND EXISTS (SELECT 1 FROM pg_timezone_names t WHERE t.name = p.timezone)),
    'America/Sao_Paulo');
$$;

CREATE OR REPLACE FUNCTION public.close_workout_session(
  p_training_plan_id uuid,
  p_day_number integer,
  p_session_name text
)
RETURNS public.completed_workouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.completed_workouts;
  v_done integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_user AND p.current_training_plan_id = p_training_plan_id
  ) THEN
    RAISE EXCEPTION 'training_plan_not_active' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.completed_workouts (user_id, training_plan_id, day_number, session_name)
  VALUES (v_user, p_training_plan_id, p_day_number, left(coalesce(p_session_name, ''), 200))
  RETURNING * INTO v_row;

  UPDATE public.completed_exercises
  SET workout_id = v_row.id
  WHERE user_id = v_user
    AND training_plan_id = p_training_plan_id
    AND day_number = p_day_number
    AND workout_id IS NULL;
  GET DIAGNOSTICS v_done = ROW_COUNT;

  -- Só quem marcou exercício por exercício tem "N de M"; "Concluir treino"
  -- sem nenhuma marcação fica null (não é parcial, só não foi detalhado).
  IF v_done > 0 THEN
    UPDATE public.completed_workouts SET exercises_done = v_done WHERE id = v_row.id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_close_stale_exercise_sessions(p_user uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_row public.completed_workouts;
  v_done integer;
  v_name text;
  v_closed integer := 0;
BEGIN
  FOR r IN
    SELECT ce.user_id, ce.training_plan_id, ce.day_number,
           max(ce.completed_at) AS last_at,
           public.student_timezone(ce.user_id) AS tz
    FROM public.completed_exercises ce
    WHERE ce.workout_id IS NULL
      AND (p_user IS NULL OR ce.user_id = p_user)
    GROUP BY ce.user_id, ce.training_plan_id, ce.day_number
  LOOP
    -- Última marcação num dia anterior ao de hoje, no fuso do aluno.
    CONTINUE WHEN (r.last_at AT TIME ZONE r.tz)::date >= (now() AT TIME ZONE r.tz)::date;

    -- Nome da sessão: o mesmo que o app usou da última vez neste dia do plano;
    -- sem histórico, "Treino Dia N".
    SELECT cw.session_name INTO v_name
    FROM public.completed_workouts cw
    WHERE cw.user_id = r.user_id AND cw.training_plan_id IS NOT DISTINCT FROM r.training_plan_id
      AND cw.day_number = r.day_number AND coalesce(cw.session_name, '') <> ''
    ORDER BY cw.completed_at DESC LIMIT 1;

    -- completed_at = hora da última marcação (o treino aconteceu naquele dia).
    INSERT INTO public.completed_workouts (user_id, training_plan_id, day_number, session_name, completed_at, auto_closed)
    VALUES (r.user_id, r.training_plan_id, r.day_number, coalesce(v_name, 'Treino Dia ' || r.day_number), r.last_at, true)
    RETURNING * INTO v_row;

    UPDATE public.completed_exercises
    SET workout_id = v_row.id
    WHERE user_id = r.user_id
      AND training_plan_id IS NOT DISTINCT FROM r.training_plan_id
      AND day_number = r.day_number
      AND workout_id IS NULL;
    GET DIAGNOSTICS v_done = ROW_COUNT;

    UPDATE public.completed_workouts SET exercises_done = v_done WHERE id = v_row.id;
    v_closed := v_closed + 1;
  END LOOP;
  RETURN v_closed;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_close_stale_exercise_sessions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_close_stale_exercise_sessions(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.student_timezone(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_timezone(uuid) TO service_role;

-- SQL puro, sem HTTP: minuto 5 de cada hora.
SELECT cron.schedule(
  'ybytu-auto-close-sessions-hourly',
  '5 * * * *',
  $$ SELECT public.auto_close_stale_exercise_sessions(); $$
);

COMMIT;
