-- Suporte a entrega de plano via link (/plano/<token>) e ao parecer
-- profissional (personal/nutricionista) que acompanha o plano entregue.

-- plan_share_tokens: token de acesso publico e temporario ao payload do
-- plano de um usuario. Gerado no backend (32 bytes aleatorios, base64url,
-- ~43 chars) -- nunca client-side. Expira em 90 dias fixos a partir da
-- criacao; "revoked_at" permite invalidar antes disso (ex: pedido do
-- usuario, ou reemissao apos edicao do plano). "last_accessed_at" e so
-- para suporte identificar tokens mortos/nunca usados.
CREATE TABLE plan_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  CONSTRAINT plan_share_tokens_token_unique UNIQUE (token)
);

CREATE INDEX plan_share_tokens_user_id_idx ON plan_share_tokens (user_id);

ALTER TABLE plan_share_tokens ENABLE ROW LEVEL SECURITY;
-- Deny-all para anon/authenticated (nenhuma policy criada de proposito,
-- mesmo padrao ja usado em exercises/training_plans -- ver memoria
-- project_exercises_rls_deny_all_intentional). So service_role le/escreve;
-- a rota /plano/<token> resolve o token no backend, nunca client-side.

-- training_plan_id/meal_plan_id (texto tipo tr_203/tr_ai_xxx, mp_201/
-- mp_ai_xxx) sao a chave de negocio usada em todo o resto do codigo
-- (gerador, queries) -- a PK real dessas tabelas e um uuid "id" solto,
-- entao pra ligar FK nessas colunas texto precisamos de UNIQUE nelas
-- primeiro (nao existia; confirmado sem duplicatas antes de criar).
ALTER TABLE training_plans ADD CONSTRAINT training_plans_training_plan_id_unique UNIQUE (training_plan_id);
ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_meal_plan_id_unique UNIQUE (meal_plan_id);

-- plan_reviews: parecer profissional (personal ou nutricionista) sobre o
-- plano ja gerado de um usuario. Um parecer por (usuario, papel) -- se o
-- profissional reavaliar, faz UPDATE na mesma linha, nao insere outra.
-- training_plan_id / meal_plan_id sao nullable porque um parecer de
-- personal so precisa referenciar o treino (idem nutricionista/nutricao).
-- training_plans e meal_plans guardam TANTO moldes (tr_2xx / mp_2xx)
-- QUANTO instancias geradas por usuario (tr_ai_xxx; mp_ai_xxx ou fallback
-- pro proprio molde compartilhado, ex mp_201) na mesma tabela -- entao a
-- FK vale nos dois casos. ON DELETE SET NULL: se o plano referenciado for
-- apagado, o parecer nao vira referencia fantasma, so perde o vinculo.
CREATE TABLE plan_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('personal', 'nutricionista')),
  reviewer_name text NOT NULL,
  reviewer_credential text,
  note_ptbr text,
  training_plan_id text REFERENCES training_plans(training_plan_id) ON DELETE SET NULL,
  meal_plan_id text REFERENCES meal_plans(meal_plan_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_reviews_user_role_unique UNIQUE (user_id, role)
);

ALTER TABLE plan_reviews ENABLE ROW LEVEL SECURITY;
-- Deny-all por enquanto, mesmo padrao acima: so service_role escreve
-- (dashboard ainda nao tem telas/papeis de admin para personal/nutri
-- validarem plano direto -- quando existir, trocar por policy dedicada
-- em vez de abrir para authenticated).
