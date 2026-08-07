-- Idempotencia do email de confirmacao/recapitulativo pos-onboarding (Resend),
-- mesmo padrao de onboarding_notified_at (migration 20260807090000).
ALTER TABLE profiles
  ADD COLUMN onboarding_email_sent_at timestamptz;
