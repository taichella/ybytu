-- Observabilidade de envio de WhatsApp: profiles.*_notified_at só prova que a
-- function TENTOU enviar, não que a Meta aceitou. Achado no teste E2E de
-- 2026-08-20 -- a Meta recusou por pendência de pagamento na conta WhatsApp
-- Business e ninguém soube, porque só ficava em console.error (log perdido).
create table if not exists whatsapp_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  template text not null,
  target_phone text not null,
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_notifications_user_id_idx on whatsapp_notifications(user_id);
create index if not exists whatsapp_notifications_created_at_idx on whatsapp_notifications(created_at desc);

alter table whatsapp_notifications enable row level security;
-- Deny-all de propósito, sem policy: só service_role (que ignora RLS) grava/lê
-- aqui, mesmo padrão de exercises/onboarding_* -- ver [[project_exercises_rls_deny_all_intentional]].
