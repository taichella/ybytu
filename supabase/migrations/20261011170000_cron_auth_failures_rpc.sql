-- ============================================================================
-- MIGRATION: 20261011170000_cron_auth_failures_rpc.sql
-- Rollback:  scripts/rollback_20261011170000_cron_auth_failures_rpc.sql
--
-- Achado 2026-10-11: os 3 pg_cron recebiam 401/403 desde 30/08 (segredo do
-- vault diferente do INTERNAL_FUNCTION_SECRET das functions) e ninguém viu --
-- o lembrete de parecer de 12h nunca saiu. O vigia (ybytu-email-health-cron)
-- também é um cron, então não consegue avisar da própria queda.
--
-- Esta função expõe ao service_role as respostas 401/403 recebidas pelo pg_net
-- nas últimas N horas (o schema net não é exposto pela API). Só os crons usam
-- net.http_post neste projeto (conferido nas migrations e nas funções do
-- schema public em 2026-10-11), então toda resposta 401/403 ali é um cron
-- falhando na autenticação. ybytu-admin-email-health devolve isto e o banner
-- vermelho do dashboard mostra -- é um caminho que não depende de cron.
-- O pg_net guarda só ~6h de respostas; a janela usada é 2h.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.cron_auth_failures(p_hours integer DEFAULT 2)
RETURNS TABLE (created timestamptz, status_code integer, content text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, net
AS $$
  SELECT r.created, r.status_code, left(r.content::text, 200)
  FROM net._http_response r
  WHERE r.status_code IN (401, 403)
    AND r.created > now() - make_interval(hours => p_hours)
  ORDER BY r.created DESC;
$$;

REVOKE ALL ON FUNCTION public.cron_auth_failures(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_auth_failures(integer) TO service_role;

COMMIT;
