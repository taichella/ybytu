-- ============================================================================
-- MIGRATION: 20261004120000_checkin_snapshot_meal_id_and_exercise_count.sql
-- Rollback:  scripts/rollback_20261004120000_checkin_snapshot.sql
--
-- Problema (medido 2026-10-04): completed_meals aponta para a refeição só pela
-- POSIÇÃO (meal_plan_id + day_order + meal_order). Salvar o cardápio no
-- construtor faz delete + insert de meal_plan_meals, sem histórico -- depois de
-- uma edição, o check-in passa a apontar em silêncio para o prato que ocupar a
-- posição. Mesmo padrão no "N exercícios" do feed de atividade, contado no
-- plano ATUAL.
--
-- Correção: o próprio banco grava, no momento do check-in, o que foi feito:
--   completed_meals:    meal_id (prato) + calories_consumed (kcal do prato,
--                       coluna já existia e nunca era preenchida) + meal_name.
--                       Posição inexistente no plano -> check-in recusado.
--   completed_workouts: exercise_count (nº de exercícios do dia naquele momento).
-- day_order/meal_order/day_number continuam gravados como referência.
-- Preenchido por trigger (não pelo app): vale para qualquer versão do PWA e o
-- aluno não consegue gravar prato que não está no plano. SECURITY DEFINER
-- porque meal_plan_meals/meals/training_* têm RLS e o aluno grava como
-- authenticated.
-- ============================================================================

BEGIN;

-- 1. completed_meals.meal_id -------------------------------------------------
ALTER TABLE public.completed_meals
  ADD COLUMN IF NOT EXISTS meal_id uuid REFERENCES public.meals(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.completed_meals_snapshot_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meal_id text;
  v_name text;
  v_kcal numeric;
BEGIN
  SELECT mpm.meal_id, m.name_ptbr, m.calories
    INTO v_meal_id, v_name, v_kcal
  FROM public.meal_plan_meals mpm
  LEFT JOIN public.meals m ON m.id::text = mpm.meal_id
  WHERE mpm.meal_plan_id = NEW.meal_plan_id::text
    AND mpm.day_order = NEW.day_order
    AND mpm.meal_order = NEW.meal_order;

  IF v_meal_id IS NULL THEN
    RAISE EXCEPTION 'meal_slot_not_found' USING ERRCODE = 'P0001';
  END IF;

  NEW.meal_id := v_meal_id::uuid;
  NEW.meal_name := COALESCE(v_name, NEW.meal_name);
  NEW.calories_consumed := round(v_kcal)::integer;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_meals_snapshot_slot ON public.completed_meals;
CREATE TRIGGER completed_meals_snapshot_slot
  BEFORE INSERT ON public.completed_meals
  FOR EACH ROW EXECUTE FUNCTION public.completed_meals_snapshot_slot();

-- Recupera os check-ins existentes SÓ onde o nome copiado no check-in bate com
-- o prato que está hoje naquela posição (prova de que o cardápio não mudou).
-- Onde não bater, fica NULL -- melhor vazio que um prato chutado.
UPDATE public.completed_meals cm
SET meal_id = m.id,
    calories_consumed = round(m.calories)::integer
FROM public.meal_plan_meals mpm
JOIN public.meals m ON m.id::text = mpm.meal_id
WHERE cm.meal_id IS NULL
  AND mpm.meal_plan_id = cm.meal_plan_id::text
  AND mpm.day_order = cm.day_order
  AND mpm.meal_order = cm.meal_order
  AND m.name_ptbr = cm.meal_name;

-- 2. completed_workouts.exercise_count ---------------------------------------
ALTER TABLE public.completed_workouts
  ADD COLUMN IF NOT EXISTS exercise_count integer;

CREATE OR REPLACE FUNCTION public.completed_workouts_snapshot_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- training_plan_exercises.training_plan_id é o SLUG; o check-in grava o uuid.
  SELECT NULLIF(count(*), 0)::integer
    INTO NEW.exercise_count
  FROM public.training_plans tp
  JOIN public.training_plan_exercises tpe ON tpe.training_plan_id = tp.training_plan_id
  WHERE tp.id = NEW.training_plan_id
    AND tpe.day_number = NEW.day_number;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS completed_workouts_snapshot_count ON public.completed_workouts;
CREATE TRIGGER completed_workouts_snapshot_count
  BEFORE INSERT ON public.completed_workouts
  FOR EACH ROW EXECUTE FUNCTION public.completed_workouts_snapshot_count();

-- Treinos já registrados ficam com exercise_count NULL de propósito: não há
-- histórico de edição do plano do aluno, então não dá para provar quantos
-- exercícios o dia tinha quando o treino foi marcado.

COMMIT;
