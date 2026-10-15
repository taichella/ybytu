-- ============================================================================
-- MIGRATION: 20261015120000_checkin_integrity_and_completed_exercises.sql
-- Rollback:  scripts/rollback_20261015120000_checkin_integrity_and_completed_exercises.sql
--
-- PARTE A -- o aluno não reescreve o próprio histórico (achado 2026-10-11,
-- decisão da Taina 2026-10-15: "o profissional toma decisão com base nisso").
-- Medido antes desta migration, nas DUAS tabelas de check-in:
--   - policy UPDATE "own rows" sem restrição de coluna: pela API o aluno trocava
--     prato/kcal (completed_meals), nº de exercícios/dia (completed_workouts) e
--     a data (completed_at) de qualquer check-in dele;
--   - policy DELETE: apagava check-ins antigos;
--   - INSERT aceitava completed_at vindo do cliente: dava para lançar um
--     check-in no passado.
-- Nenhuma tela usa UPDATE/DELETE nessas tabelas (conferido no PWA e no
-- dashboard em 2026-10-15). Correção: sem UPDATE/DELETE para o aluno e
-- completed_at sempre a hora do servidor. Desfazer o fechamento de um treino
-- passa a existir só pela função reopen_workout_session (Parte B), com prazo.
--
-- PARTE B -- marcação por exercício (designs/AlunoTreinoCheckin.dc.html).
--   completed_exercises: uma linha por exercício marcado. Chave estável
--   plano + dia + exercício (o construtor apaga e recria as linhas de
--   training_plan_exercises a cada save, então o id da linha não serve).
--   workout_id NULL = marcação da sessão ABERTA; ao fechar, as marcações abertas
--   passam a apontar para o completed_workouts criado. No máximo uma marcação
--   aberta por plano + dia + exercício (permite a 2ª sessão no mesmo dia).
--   Carga opcional (load_kg). O aluno só pode alterar a carga e desmarcar
--   enquanto a sessão está aberta.
--   close_workout_session / reopen_workout_session: fechar e reabrir numa
--   transação só (nada fica pela metade).
-- ============================================================================

BEGIN;

-- ─── PARTE A ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can update their own completed meals" ON public.completed_meals;
DROP POLICY IF EXISTS "Users can delete their own completed meals" ON public.completed_meals;
DROP POLICY IF EXISTS "Users can update their own completed workouts" ON public.completed_workouts;
DROP POLICY IF EXISTS "Users can delete their own completed workouts" ON public.completed_workouts;

-- Sem policy o RLS já nega; o REVOKE é a segunda trava (e tira o TRUNCATE do
-- grant padrão).
REVOKE UPDATE, DELETE, TRUNCATE ON public.completed_meals FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.completed_workouts FROM anon, authenticated;

-- Hora do check-in é sempre a do servidor.
CREATE OR REPLACE FUNCTION public.checkin_force_server_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.completed_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_meals_force_server_time ON public.completed_meals;
CREATE TRIGGER completed_meals_force_server_time
  BEFORE INSERT ON public.completed_meals
  FOR EACH ROW EXECUTE FUNCTION public.checkin_force_server_time();

DROP TRIGGER IF EXISTS completed_workouts_force_server_time ON public.completed_workouts;
CREATE TRIGGER completed_workouts_force_server_time
  BEFORE INSERT ON public.completed_workouts
  FOR EACH ROW EXECUTE FUNCTION public.checkin_force_server_time();

-- ─── PARTE B ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.completed_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  training_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL,
  day_number integer NOT NULL,
  exercise_id text NOT NULL,                   -- exercises.exercise_id (chave estável, não o id da linha do plano)
  load_kg numeric CHECK (load_kg IS NULL OR (load_kg >= 0 AND load_kg < 1000)),
  completed_at timestamptz NOT NULL DEFAULT now(),
  workout_id uuid REFERENCES public.completed_workouts(id) ON DELETE SET NULL -- NULL = sessão aberta
);

CREATE UNIQUE INDEX IF NOT EXISTS completed_exercises_one_open_mark
  ON public.completed_exercises (user_id, training_plan_id, day_number, exercise_id)
  WHERE workout_id IS NULL;
CREATE INDEX IF NOT EXISTS completed_exercises_user_exercise_idx
  ON public.completed_exercises (user_id, exercise_id, completed_at DESC); -- última carga usada
CREATE INDEX IF NOT EXISTS completed_exercises_workout_idx
  ON public.completed_exercises (workout_id);

-- Validação no INSERT: plano ATIVO do aluno e exercício que existe naquele dia.
-- SECURITY DEFINER porque training_plan_exercises/profiles têm RLS e o aluno
-- grava como authenticated (mesmo padrão dos snapshots de 2026-10-04).
CREATE OR REPLACE FUNCTION public.completed_exercises_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.completed_at := now();
  NEW.workout_id := NULL; -- marcação sempre nasce na sessão aberta

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.user_id AND p.current_training_plan_id = NEW.training_plan_id
  ) THEN
    RAISE EXCEPTION 'training_plan_not_active' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.training_plans tp
    JOIN public.training_plan_exercises tpe ON tpe.training_plan_id = tp.training_plan_id -- slug
    WHERE tp.id = NEW.training_plan_id
      AND tpe.day_number = NEW.day_number
      AND tpe.exercise_id = NEW.exercise_id
  ) THEN
    RAISE EXCEPTION 'exercise_not_in_plan_day' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_exercises_validate ON public.completed_exercises;
CREATE TRIGGER completed_exercises_validate
  BEFORE INSERT ON public.completed_exercises
  FOR EACH ROW EXECUTE FUNCTION public.completed_exercises_validate();

-- No UPDATE o aluno só muda a carga, e só com a sessão aberta.
CREATE OR REPLACE FUNCTION public.completed_exercises_guard_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF OLD.workout_id IS NOT NULL THEN
      RAISE EXCEPTION 'session_already_closed' USING ERRCODE = 'P0001';
    END IF;
    IF (NEW.user_id, NEW.training_plan_id, NEW.day_number, NEW.exercise_id, NEW.completed_at, NEW.workout_id)
       IS DISTINCT FROM (OLD.user_id, OLD.training_plan_id, OLD.day_number, OLD.exercise_id, OLD.completed_at, OLD.workout_id) THEN
      RAISE EXCEPTION 'only_load_is_editable' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_exercises_guard_update ON public.completed_exercises;
CREATE TRIGGER completed_exercises_guard_update
  BEFORE UPDATE ON public.completed_exercises
  FOR EACH ROW EXECUTE FUNCTION public.completed_exercises_guard_update();

ALTER TABLE public.completed_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS completed_exercises_select_own ON public.completed_exercises;
CREATE POLICY completed_exercises_select_own ON public.completed_exercises
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS completed_exercises_insert_own ON public.completed_exercises;
CREATE POLICY completed_exercises_insert_own ON public.completed_exercises
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS completed_exercises_update_open_own ON public.completed_exercises;
CREATE POLICY completed_exercises_update_open_own ON public.completed_exercises
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND workout_id IS NULL)
  WITH CHECK (auth.uid() = user_id AND workout_id IS NULL);

-- Desmarcar = apagar a marcação, só com a sessão aberta.
DROP POLICY IF EXISTS completed_exercises_delete_open_own ON public.completed_exercises;
CREATE POLICY completed_exercises_delete_open_own ON public.completed_exercises
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND workout_id IS NULL);

REVOKE ALL ON public.completed_exercises FROM anon;
REVOKE TRUNCATE ON public.completed_exercises FROM authenticated;

-- Fecha a sessão: cria o completed_workouts (os gatilhos gravam a hora do
-- servidor e o nº de exercícios do dia) e liga a ele as marcações abertas do
-- dia, na mesma transação. Vale também para o botão "Concluir treino" sem
-- nenhuma marcação.
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

  RETURN v_row;
END;
$$;

-- Reabre um treino fechado há pouco (desmarcar o último exercício, no
-- desenho): apaga o completed_workouts e as marcações voltam a ficar abertas
-- (FK ON DELETE SET NULL). Só o próprio aluno e só até 3h depois do
-- fechamento -- depois disso o treino é histórico e não se apaga.
CREATE OR REPLACE FUNCTION public.reopen_workout_session(p_workout_id uuid)
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

  DELETE FROM public.completed_workouts
  WHERE id = p_workout_id
    AND user_id = v_user
    AND completed_at > now() - interval '3 hours';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'workout_not_reopenable' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.close_workout_session(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_workout_session(uuid, integer, text) TO authenticated;
REVOKE ALL ON FUNCTION public.reopen_workout_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reopen_workout_session(uuid) TO authenticated;

COMMIT;
