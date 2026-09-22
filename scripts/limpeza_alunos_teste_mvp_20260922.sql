-- Limpeza dos 3 alunos de TESTE do dia do MVP (2026-09-22), depois da demonstração ao cliente.
-- Alvo: só as 3 contas abaixo, por id explícito (não "tudo que não é staff" -- a conta de
-- demonstração da Taina, criada com o WhatsApp real dela, NÃO entra e continua existindo).
--
-- Backup ANTES de rodar: C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_20260922_*.json
-- Restaurar: node scripts/restaurar_alunos_do_backup.mjs <backup.json> > restore.sql
--            npx supabase db query --linked -f restore.sql

create temp table _alvo on commit drop as
  select id from auth.users where id in (
    'd6ce1f3b-aaf8-403f-b890-d7f9fd095fc4', -- tainachella@gmail.com (Taina Chella, teste A)
    'b82959b1-13f6-4160-86bb-8cde9ce13389', -- loyedo4524@kingdais.com (Teste A Aluno, = teste B)
    'f7393db0-b0c9-469b-a58b-5ea8a750be7f'  -- komofe3268@art2mart.com (Teste B Aluno, = teste C)
  );

do $guard$
begin
  if (select count(*) from _alvo) <> 3 then
    raise exception 'ABORTADO: alvo tem % contas, esperado exatamente as 3 hardcoded', (select count(*) from _alvo);
  end if;
  if exists (select 1 from _alvo a join staff s on s.user_id = a.id) then
    raise exception 'ABORTADO: alvo inclui conta de staff';
  end if;
end $guard$;

create temp table _tp on commit drop as
  select id, training_plan_id from training_plans where id in (
    '88965b08-c9e7-479d-9551-b1a289372f28', '1807e205-d273-4467-8612-2bea4a11bb5f', '95a23591-313b-4c98-991b-58dec20ed1d0');
create temp table _mp on commit drop as
  select id, meal_plan_id from meal_plans where id in (
    '2e41e061-74bb-4b99-9a2c-b510d37d0925', '567f4372-eb86-4565-b479-e85d7558f634', '90ea9bab-95c4-4a3a-bf4d-80a1cdcf7382');

do $guard2$
begin
  if (select count(*) from _tp) <> 3 or (select count(*) from _mp) <> 3 then
    raise exception 'ABORTADO: esperava 3 planos de treino e 3 de nutricao, achou % e %', (select count(*) from _tp), (select count(*) from _mp);
  end if;
  if exists (select 1 from user_training_plans l where l.user_id in (select id from _alvo) and l.training_plan_id not in (select id from _tp)) then
    raise exception 'ABORTADO: aluno ligado a plano de treino fora da lista hardcoded';
  end if;
  if exists (select 1 from user_meal_plans l where l.user_id in (select id from _alvo) and l.meal_plan_id not in (select id from _mp)) then
    raise exception 'ABORTADO: aluno ligado a plano de nutricao fora da lista hardcoded';
  end if;
end $guard2$;

delete from whatsapp_notifications where user_id in (select id from _alvo);
delete from profiles where id in (select id from _alvo);
delete from user_training_profiles where user_id in (select id from _alvo);
delete from training_plan_exercises where training_plan_id in (select training_plan_id from _tp);
delete from training_plan_exercises_history where training_plan_id in (select training_plan_id from _tp) or changed_by in (select id from _alvo);
delete from training_plans where id in (select id from _tp);
delete from meal_plan_meals where meal_plan_id::text in (select id::text from _mp union select meal_plan_id::text from _mp);
delete from meal_plans where id in (select id from _mp);
delete from auth.users where id in (select id from _alvo);
