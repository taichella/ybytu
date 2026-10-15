-- Rollback de supabase/migrations/20261015120000_checkin_integrity_and_completed_exercises.sql
-- PARTE B: apaga a marcação por exercício (perde as marcações gravadas).
-- PARTE A: devolve ao aluno o UPDATE/DELETE "own rows" de antes (reabre o
-- buraco de reescrever o histórico -- só usar se algo quebrar).
BEGIN;

DROP FUNCTION IF EXISTS public.reopen_workout_session(uuid);
DROP FUNCTION IF EXISTS public.close_workout_session(uuid, integer, text);
DROP TABLE IF EXISTS public.completed_exercises;
DROP FUNCTION IF EXISTS public.completed_exercises_validate();
DROP FUNCTION IF EXISTS public.completed_exercises_guard_update();

DROP TRIGGER IF EXISTS completed_meals_force_server_time ON public.completed_meals;
DROP TRIGGER IF EXISTS completed_workouts_force_server_time ON public.completed_workouts;
DROP FUNCTION IF EXISTS public.checkin_force_server_time();

GRANT UPDATE, DELETE ON public.completed_meals TO authenticated;
GRANT UPDATE, DELETE ON public.completed_workouts TO authenticated;
CREATE POLICY "Users can update their own completed meals" ON public.completed_meals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completed meals" ON public.completed_meals
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own completed workouts" ON public.completed_workouts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completed workouts" ON public.completed_workouts
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
