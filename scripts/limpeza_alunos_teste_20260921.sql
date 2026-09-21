-- Limpeza dos alunos de TESTE antes do primeiro aluno real (2026-09-21).
-- NAO EXECUTADO ate a Taina escolher a opcao (a) -- ver docs/ROLLBACK_PILOTO.md.
--
-- Alvo: toda conta de auth.users que NAO tem linha em staff_roles nem em staff
-- (= as 3 da equipe ativas + contato+teste_ui_staff, papel revogado, ficam de fora).
-- Hoje sao 10 contas, todas de teste. Multi-statement = 1 transacao implicita:
-- ou apaga tudo, ou nada.
--
-- Backup ANTES de rodar: C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_*.json
-- Restaurar: node scripts/restaurar_alunos_do_backup.mjs <backup.json> > restore.sql
--            npx supabase db query --linked -f restore.sql

create temp table _alvo on commit drop as
  select id from auth.users
  where id not in (select user_id from staff_roles union select user_id from staff);

-- Salvaguarda: se apareceu conta nova (aluno real) desde o backup, ou se o alvo
-- inclui alguma conta da equipe, aborta sem apagar nada.
do $guard$
begin
  if (select count(*) from _alvo) <> 10 then
    raise exception 'ABORTADO: alvo tem % contas, esperado 10 (conta nova desde o backup?)', (select count(*) from _alvo);
  end if;
  if exists (select 1 from auth.users u join _alvo a using (id)
             where u.email in ('mymba.studio@gmail.com','contato+personal@ybytu.app','contato+nutri@ybytu.app')) then
    raise exception 'ABORTADO: alvo inclui conta da equipe';
  end if;
end $guard$;

-- Planos GERADOS PARA os alunos: prefixo tr_ai_ / mp_ai_ (created_by_ai sozinho NAO basta:
-- o catalogo mp_201..mp_300 tambem e marcado como IA). Moldes tr_201..207 e catalogo mp_001..300
-- nunca entram: a guarda abaixo aborta se algum aluno estiver ligado a plano fora desse prefixo.
create temp table _tp on commit drop as
  select id, training_plan_id from training_plans
  where training_plan_id like 'tr_ai_%' and (
    id in (select training_plan_id from user_training_plans where user_id in (select id from _alvo))
    or id in (select current_training_plan_id from profiles where id in (select id from _alvo)));
create temp table _mp on commit drop as
  select id, meal_plan_id from meal_plans
  where meal_plan_id like 'mp_ai_%' and (
    id in (select meal_plan_id from user_meal_plans where user_id in (select id from _alvo))
    or id in (select current_meal_plan_id from profiles where id in (select id from _alvo)));

do $guard2$
begin
  if exists (select 1 from user_training_plans l where l.user_id in (select id from _alvo)
             and l.training_plan_id not in (select id from _tp)) then
    raise exception 'ABORTADO: aluno ligado a plano de treino fora do prefixo tr_ai_ (molde?)';
  end if;
  if exists (select 1 from user_meal_plans l where l.user_id in (select id from _alvo)
             and l.meal_plan_id not in (select id from _mp)) then
    raise exception 'ABORTADO: aluno ligado a plano de nutricao fora do prefixo mp_ai_ (catalogo?)';
  end if;
end $guard2$;

-- 1. Log de WhatsApp dos alunos (senao viraria linha orfa: FK e SET NULL).
delete from whatsapp_notifications where user_id in (select id from _alvo);

-- 2. Perfil: cascata leva plan_reviews, plan_share_tokens (links /plano/<token> morrem),
--    user_training_plans, user_meal_plans, user_meal_profiles. profiles NAO tem FK para
--    auth.users, entao precisa ser apagado explicitamente.
delete from profiles where id in (select id from _alvo);
delete from user_training_profiles where user_id in (select id from _alvo); -- sem FK

-- 3. Planos dos alunos (o trigger que bloqueia apagar plano em uso so olha profiles,
--    que ja foi apagado no passo 2).
delete from training_plan_exercises where training_plan_id in (select training_plan_id from _tp);
delete from training_plan_exercises_history
  where training_plan_id in (select training_plan_id from _tp) or changed_by in (select id from _alvo);
delete from training_plans where id in (select id from _tp);
delete from meal_plan_meals where meal_plan_id::text in (select id::text from _mp union select meal_plan_id::text from _mp);
delete from meal_plans where id in (select id from _mp);

-- 4. Conta de login: cascata leva identities, sessions, refresh_tokens, completed_*, mfa etc.
delete from auth.users where id in (select id from _alvo);
