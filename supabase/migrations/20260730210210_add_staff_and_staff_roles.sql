-- Sistema de staff (admin/personal/nutricionista) e seus papeis, com convite
-- server-side. Ver [[project_staff_role_system_design]] pra desenho completo
-- e decisoes (por que tabela separada de profiles, por que 2 tabelas em vez
-- de 1, por que deny-all).

-- staff: a PESSOA (quem e staff, independente de quantos papeis tem).
-- Nao tem coluna "role" -- isso vive em staff_roles, porque uma pessoa pode
-- acumular papeis (ex: personal com CREF que tambem tem CRN de nutricionista).
CREATE TABLE staff (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  revoked_at  timestamptz
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
-- Deny-all de proposito, mesmo padrao de plan_share_tokens/plan_reviews (ver
-- memoria project_exercises_rls_deny_all_intentional). O papel NUNCA pode ser
-- lido por RLS direta a partir do client -- toda leitura passa por Edge
-- Function com service_role (ybytu-whoami, etc), pra nao depender de
-- auth.uid() em policy alguma aqui.

-- staff_roles: QUAIS papeis cada staff tem. Granular por linha pra permitir
-- revogar um papel isolado (perdeu o CRN, mantem o CREF) sem tocar no acesso
-- geral da pessoa (isso e' staff.revoked_at, kill-switch da pessoa inteira).
CREATE TABLE staff_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES staff(user_id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('admin', 'personal', 'nutricionista')),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  granted_by  uuid NOT NULL REFERENCES auth.users(id),
  revoked_at  timestamptz,
  CONSTRAINT staff_roles_user_role_unique UNIQUE (user_id, role)
);

CREATE INDEX staff_roles_user_id_idx ON staff_roles (user_id);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
-- Deny-all, mesmo motivo.

-- staff_invites: convite de acesso (so pra CONTA NOVA -- staff existente
-- ganhando papel adicional usa ybytu-grant-staff-role direto, sem convite,
-- decisao explicita: caso raro, admin ja conhece a pessoa, nao precisa do
-- overhead de token/expiracao pra isso).
CREATE TABLE staff_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'personal', 'nutricionista')),
  token       text NOT NULL UNIQUE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at     timestamptz,
  revoked_at  timestamptz
);

CREATE INDEX staff_invites_email_idx ON staff_invites (email);

ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;
-- Deny-all, mesmo motivo. Criacao e resgate de convite passam por Edge
-- Function (ybytu-create-staff-invite / ybytu-redeem-staff-invite),
-- service_role dos dois lados.
