-- ============================================================================
-- MIGRATION: 20260925170000_user_app_checkin_and_otps.sql
-- Objetivo: Colunas mínimas de check-in estável (treino e refeição),
--           tabela auth_otps com rate-limiting/anti-abuso, limpeza periódica
--           e função helper segura para busca de usuários sem criação indevida.
-- ATENÇÃO: Esta migration será aplicada pelo agente responsável por deploys.
-- ============================================================================

-- 1. completed_workouts ------------------------------------------------------
ALTER TABLE public.completed_workouts
  ADD COLUMN IF NOT EXISTS training_plan_id text,
  ADD COLUMN IF NOT EXISTS day_number integer,
  ADD COLUMN IF NOT EXISTS session_name text;

CREATE INDEX IF NOT EXISTS completed_workouts_user_completed_at_idx 
  ON public.completed_workouts (user_id, completed_at DESC);

ALTER TABLE public.completed_workouts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.completed_workouts TO authenticated;

DROP POLICY IF EXISTS "completed_workouts_user_select" ON public.completed_workouts;
CREATE POLICY "completed_workouts_user_select"
  ON public.completed_workouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_workouts_user_insert" ON public.completed_workouts;
CREATE POLICY "completed_workouts_user_insert"
  ON public.completed_workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. completed_meals ---------------------------------------------------------
ALTER TABLE public.completed_meals
  ADD COLUMN IF NOT EXISTS meal_plan_id uuid,
  ADD COLUMN IF NOT EXISTS day_order integer,
  ADD COLUMN IF NOT EXISTS meal_order integer,
  ADD COLUMN IF NOT EXISTS meal_name text;

CREATE INDEX IF NOT EXISTS completed_meals_user_completed_at_idx 
  ON public.completed_meals (user_id, completed_at DESC);

ALTER TABLE public.completed_meals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.completed_meals TO authenticated;

DROP POLICY IF EXISTS "completed_meals_user_select" ON public.completed_meals;
CREATE POLICY "completed_meals_user_select"
  ON public.completed_meals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "completed_meals_user_insert" ON public.completed_meals;
CREATE POLICY "completed_meals_user_insert"
  ON public.completed_meals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. auth_otps (Tabela de controle com rate limit e anti-bot) ----------------
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,                       -- Telefone E.164 ou e-mail normalizado
  identifier_found boolean NOT NULL DEFAULT true, -- False quando número não existe (grava para barrar IP)
  code_hash text NOT NULL,                        -- Hash SHA-256 com salt (vazio se identifier_found = false)
  ip_address text NOT NULL,                       -- IP do requisitante para rate limiting
  attempts integer NOT NULL DEFAULT 0,            -- Contador de tentativas de verificação
  max_attempts integer NOT NULL DEFAULT 5,        -- Teto de tentativas antes de queimar o código
  is_used boolean NOT NULL DEFAULT false,         -- Código de uso único
  expires_at timestamptz NOT NULL,                -- Expiração estrita (5 minutos para códigos ativos)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Concorrência: Garante que só pode existir UM código ativo (não usado e com usuário encontrado) por identificador
CREATE UNIQUE INDEX IF NOT EXISTS auth_otps_single_active_code_idx 
  ON public.auth_otps (identifier) 
  WHERE (is_used = false AND identifier_found = true);

CREATE INDEX IF NOT EXISTS auth_otps_identifier_created_idx 
  ON public.auth_otps (identifier, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_otps_ip_created_idx 
  ON public.auth_otps (ip_address, created_at DESC);

ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_otps FROM anon, authenticated;

-- 4. Ciclo de vida da auth_otps: Limpeza diária automática via pg_cron --------
-- Padrão do projeto: SELECT cron.schedule direto (falha alto se pg_cron não estiver ativo)
-- Mantém retenção de 7 dias (necessário para auditoria e rate-limit de 24h; descarta após isso por LGPD)
SELECT cron.unschedule('cleanup_auth_otps_daily') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_auth_otps_daily');

SELECT cron.schedule(
  'cleanup_auth_otps_daily',
  '0 3 * * *',
  $$DELETE FROM public.auth_otps WHERE created_at < now() - interval '7 days';$$
);

-- 5. Helper seguro: Localização exata de usuário por telefone ou e-mail --------
-- Garante que NENHUM usuário seja criado inadvertidamente em auth.users via
-- generateLink e substitui varreduras em memória por busca indexada direta.
CREATE OR REPLACE FUNCTION public.find_user_by_identifier(p_identifier text)
RETURNS TABLE (user_id uuid, email text, whatsapp_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean text;
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
  v_clean := regexp_replace(p_identifier, '\D', '', 'g');
  IF length(v_clean) = 10 OR length(v_clean) = 11 THEN
    v_clean := '55' || v_clean;
  END IF;

  -- Rejeita se não tiver tamanho E.164 válido (mínimo 12 dígitos)
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
