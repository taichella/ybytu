-- ============================================================================
-- MIGRATION: 20260927185000_fix_completed_workouts_uuid_and_phone_e164.sql
-- Objetivo:
-- 1. Converter completed_workouts.training_plan_id de TEXT para UUID com FK
--    para training_plans(id) ON DELETE SET NULL.
--    Nota de segurança: A tabela completed_workouts possui 0 linhas em produção
--    neste momento, tornando a conversão USING training_plan_id::uuid 100% segura
--    e sem risco de falha por dados prévios.
-- 2. Atualizar a função helper find_user_by_identifier para NÃO assumir Brasil (+55)
--    quando a entrada já contiver o prefixo internacional '+' (ex: +33 para França),
--    preservando logins de alunos estrangeiros.
--
-- ATENÇÃO: Esta migration será aplicada pelo agente responsável por deploys.
-- ============================================================================

-- 1. completed_workouts.training_plan_id: TEXT -> UUID ------------------------
ALTER TABLE public.completed_workouts
  ALTER COLUMN training_plan_id TYPE uuid USING (
    CASE
      WHEN training_plan_id IS NULL OR training_plan_id = '' OR training_plan_id = 'active_plan' THEN NULL
      ELSE training_plan_id::uuid
    END
  );

ALTER TABLE public.completed_workouts
  DROP CONSTRAINT IF EXISTS completed_workouts_training_plan_id_fkey;

ALTER TABLE public.completed_workouts
  ADD CONSTRAINT completed_workouts_training_plan_id_fkey
  FOREIGN KEY (training_plan_id) REFERENCES public.training_plans(id) ON DELETE SET NULL;

-- 2. find_user_by_identifier: Respeitar prefixo internacional '+' -------------
CREATE OR REPLACE FUNCTION public.find_user_by_identifier(p_identifier text)
RETURNS TABLE (user_id uuid, email text, whatsapp_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean text;
  v_has_plus boolean;
BEGIN
  IF p_identifier IS NULL OR trim(p_identifier) = '' THEN
    RETURN;
  END IF;

  -- Se for e-mail: busca estrita e exata em auth.users garantindo perfil existente
  IF position('@' in p_identifier) > 0 THEN
    RETURN QUERY
    SELECT u.id, u.email::text, p.whatsapp_phone::text
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE lower(trim(u.email)) = lower(trim(p_identifier))
    LIMIT 1;
    RETURN;
  END IF;

  -- Se for telefone: normalização E.164
  -- SÓ assume Brasil (+55) se a entrada NÃO começou com '+' e possui 10 ou 11 dígitos nacionais (DDD + número)
  v_has_plus := (left(trim(p_identifier), 1) = '+');
  v_clean := regexp_replace(p_identifier, '\D', '', 'g');

  IF NOT v_has_plus AND (length(v_clean) = 10 OR length(v_clean) = 11) THEN
    v_clean := '55' || v_clean;
  END IF;

  -- Rejeita se não tiver tamanho E.164 válido (mínimo 12 dígitos, máximo 15)
  IF length(v_clean) < 12 OR length(v_clean) > 15 THEN
    RETURN;
  END IF;

  -- Busca direta indexada e exata nos formatos correspondentes ao mesmo número
  RETURN QUERY
  SELECT p.id, u.email::text, p.whatsapp_phone::text
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.whatsapp_phone IS NOT NULL
    AND (
      p.whatsapp_phone = ('+' || v_clean)
      OR p.whatsapp_phone = v_clean
      OR (v_clean LIKE '55%' AND p.whatsapp_phone = substr(v_clean, 3))
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_identifier FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_identifier TO service_role;

-- ============================================================================
-- INSTRUÇÕES DE ROLLBACK (se necessário reverter)
-- ============================================================================
-- ALTER TABLE public.completed_workouts
--   DROP CONSTRAINT IF EXISTS completed_workouts_training_plan_id_fkey;
-- ALTER TABLE public.completed_workouts
--   ALTER COLUMN training_plan_id TYPE text USING training_plan_id::text;
--
-- Reexecutar a versão anterior de find_user_by_identifier da migration
-- 20260925170000_user_app_checkin_and_otps.sql.
