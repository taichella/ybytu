-- ============================================================================
-- MIGRATION: 20261015190000_meal_checkin_planned_count_and_undo.sql
-- Rollback:  scripts/rollback_20261015190000_meal_checkin_planned_count_and_undo.sql
--
-- Backend da alimentação na lógica "registrar é acompanhar, não cumprir"
-- (decisão da Taina 2026-10-15, docs/PRINCIPIOS_DE_PRODUTO.md):
--
-- 1. completed_meals.meals_planned: quantas refeições aquele dia do cardápio
--    tinha NO MOMENTO do registro (mesmo princípio do exercise_count do
--    treino): editar o cardápio depois não muda o "de quantas" do histórico.
--    Registros antigos ficam NULL de propósito (não dá para provar quantas
--    refeições o dia tinha quando foram marcados).
-- 2. unmark_meal(id): o aluno desfaz um registro de refeição SÓ no mesmo dia,
--    no fuso dele (student_timezone, migration 20261015160000). Depois disso o
--    registro é histórico. Antes desta função o aluno não tinha como desfazer
--    (UPDATE/DELETE fechados em 20261015120000).
--
-- Sem tabela de "dia alimentar concluído": o dia é só o agrupamento das
-- refeições registradas numa data, calculado na leitura
-- (ybytu-get-user-activity). Criar o registro seria inventar um evento.
-- ============================================================================

BEGIN;

ALTER TABLE public.completed_meals ADD COLUMN IF NOT EXISTS meals_planned integer;

-- Mesma função de 20261004120000, mais a contagem do dia.
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
  SELECT count(*)::integer INTO NEW.meals_planned
  FROM public.meal_plan_meals mpm
  WHERE mpm.meal_plan_id = NEW.meal_plan_id::text
    AND mpm.day_order = NEW.day_order;
  RETURN NEW;
END;
$$;

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

REVOKE ALL ON FUNCTION public.unmark_meal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unmark_meal(uuid) TO authenticated;

COMMIT;
