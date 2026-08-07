-- Idempotencia pro novo par de avisos WhatsApp disparado logo apos o
-- onboarding (usuario: "recebemos seu perfil"; sales: "novo aluno completou
-- onboarding") -- ver ybytu-notify-onboarding-received. Mesmo padrao de
-- plan_ready_notified_at (migration 20260805120000): evita reenvio em
-- retry/duplo-clique do onboarding.
ALTER TABLE profiles
  ADD COLUMN onboarding_notified_at timestamptz;
