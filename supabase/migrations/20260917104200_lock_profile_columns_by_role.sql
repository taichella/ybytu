-- Bloqueia escrita de coluna sensível por aluno; mantém escrita das colunas
-- de resposta que os 2 formulários de onboarding usam (widget WordPress e
-- ybytu-app/Onboarding.js). Achado: RLS só restringe LINHA (auth.uid()=id),
-- não coluna -- aluno logado conseguia alterar subscription_type_id,
-- plan_generation_status, current_*_plan_id etc via update() direto.
-- Backup tirado antes desta migration: C:\ybytu-backups\
-- ybytu_pre_migration_profiles_grants_20260917_103947Z.sql (schema) +
-- _data.sql (dados), fora do repositório.

-- profiles ---------------------------------------------------
revoke insert, update on table public.profiles from anon, authenticated;

grant insert (
  id, full_name, first_name, last_name, whatsapp_phone
) on public.profiles to authenticated;

grant update (
  id,  -- upsert do widget faz ON CONFLICT DO UPDATE SET id=excluded.id;
       -- WITH CHECK auth.uid()=id impede trocar por outro valor
  full_name, first_name, last_name, whatsapp_phone,
  goals_ids, gender_id, age, weight_kg, height_cm, activity_level_id,
  health_conditions_ids, pregnancy_trimester, physical_conditions_ids,
  muscle_groups_ids, exercise_environment_id, exercise_equipments_ids,
  training_duration_minutes, exercise_level_id, training_days_per_week,
  nutrition_days_per_week, meals_per_day, dietary_preference_id,
  dietary_restrictions_ids, disliked_foods, onboarding_completed
) on public.profiles to authenticated;

-- NÃO concedidas a authenticated (ficam só pra service_role, que ignora
-- grants/RLS): created_at, subscription_type_id, current_training_plan_id,
-- current_meal_plan_id, plan_generation_status, plan_generation_error,
-- plan_ready_notified_at, plan_review_reminder_sent_at,
-- user_notified_ready_at, onboarding_notified_at, onboarding_email_sent_at.

-- user_training_plans / user_meal_plans -----------------------
-- Log append-only escrito só pela Edge Function (service_role). Nenhum
-- client legítimo insere/atualiza aqui hoje.
revoke insert, update on table public.user_training_plans from anon, authenticated;
revoke insert, update on table public.user_meal_plans from anon, authenticated;

-- user_meal_profiles / user_training_profiles (tabelas mortas) -
-- policy ALL de hoje também libera DELETE -- revogar os 3.
revoke insert, update, delete on table public.user_meal_profiles from anon, authenticated;
revoke insert, update, delete on table public.user_training_profiles from anon, authenticated;

-- ============================================================
-- Trigger: onboarding_completed nunca regride de true pra false.
-- SECURITY INVOKER (padrão) -- roda com o privilégio de quem chama, sem
-- escalar; a checagem só lê OLD/NEW, não precisa de privilégio extra.
-- ============================================================
create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
as $$
begin
  if old.onboarding_completed is true and new.onboarding_completed is false then
    raise exception 'onboarding_completed não pode voltar de true para false (perfil %)', old.id
      using errcode = '22000';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_profile_update_rules
before update on public.profiles
for each row execute function public.enforce_profile_update_rules();

-- subscription_type_id fora do cliente (piloto = sempre COMPLETE) -----
alter table public.profiles alter column subscription_type_id
  set default '7b5502f1-eeed-4640-8c4f-0ebc0502481e';
