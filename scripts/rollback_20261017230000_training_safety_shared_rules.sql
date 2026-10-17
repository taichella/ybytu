-- Desfaz supabase/migrations/20261017230000_training_safety_shared_rules.sql.
-- ATENÇÃO: o gerador de treino e o construtor (ybytu-admin-trainings) passam a
-- chamar estas funções; desfazer exige voltar o código das duas functions antes.
BEGIN;
DROP FUNCTION IF EXISTS public.ybytu_exercise_restrictions(text[], text[]);
DROP FUNCTION IF EXISTS public.ybytu_student_condition_slugs(uuid);
DROP FUNCTION IF EXISTS public.ybytu_normalize_exercise_name(text);
COMMIT;
