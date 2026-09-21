-- Limpeza dos alunos de TESTE antes do primeiro aluno real (2026-09-21, opcao (a) escolhida pela Taina).
--
-- Alvo: TODA conta de auth.users exceto as 3 da equipe (mymba.studio@gmail.com,
-- contato+personal@ybytu.app, contato+nutri@ybytu.app) = 10 alunos de teste + a conta
-- contato+teste_ui_staff_20260919@ybytu.app (papel staff revogado, sem perfil) = 11 contas.
-- Tambem apaga todos os planos tr_ai_ / mp_ai_ (dos alunos e os 3 tr_ai_ de 04/09 sem dono).
-- Multi-statement = 1 transacao implicita: ou apaga tudo, ou nada.
--
-- Backup ANTES de rodar: C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_*.json (o mais recente)
-- Restaurar: node scripts/restaurar_alunos_do_backup.mjs <backup.json> > restore.sql
--            npx supabase db query --linked -f restore.sql

create temp table _alvo on commit drop as
  select id from auth.users
  where email not in ('mymba.studio@gmail.com','contato+personal@ybytu.app','contato+nutri@ybytu.app');

-- Salvaguarda: se apareceu conta nova (aluno real) desde o backup, aborta sem apagar nada.
-- As 3 da equipe nunca entram (filtro acima); aqui conferimos que continuam la e ativas.
do $guard$
begin
  if (select count(*) from _alvo) <> 11 then
    raise exception 'ABORTADO: alvo tem % contas, esperado 11 (conta nova desde o backup?)', (select count(*) from _alvo);
  end if;
  if (select count(*) from auth.users u where u.email in ('mymba.studio@gmail.com','contato+personal@ybytu.app','contato+nutri@ybytu.app')
        and u.id in (select user_id from staff where revoked_at is null)) <> 3 then
    raise exception 'ABORTADO: as 3 contas da equipe nao estao todas ativas em staff';
  end if;
  if exists (select 1 from _alvo a join staff s on s.user_id = a.id where s.revoked_at is null) then
    raise exception 'ABORTADO: alvo inclui staff ATIVO';
  end if;
  if exists (select 1 from profiles where id not in (select id from _alvo)) then
    raise exception 'ABORTADO: existe perfil de conta fora do alvo';
  end if;
end $guard$;

-- Planos gerados por/para aluno: prefixo tr_ai_ / mp_ai_ (created_by_ai sozinho NAO basta: o
-- catalogo mp_201..mp_300 tambem e marcado como IA). Moldes tr_201..207 e catalogo mp_001..300
-- nunca entram. Como nenhum perfil fora do alvo existe (guarda acima), todo tr_ai_/mp_ai_ e
-- de aluno de teste ou orfao.
create temp table _tp on commit drop as
  select id, training_plan_id from training_plans where training_plan_id like 'tr_ai_%';
create temp table _mp on commit drop as
  select id, meal_plan_id from meal_plans where meal_plan_id like 'mp_ai_%';

do $guard2$
begin
  if exists (select 1 from user_training_plans l where l.training_plan_id not in (select id from _tp)) then
    raise exception 'ABORTADO: aluno ligado a plano de treino fora do prefixo tr_ai_ (molde?)';
  end if;
  if exists (select 1 from user_meal_plans l where l.meal_plan_id not in (select id from _mp)) then
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

-- 3. Planos (o trigger que bloqueia apagar plano em uso so olha profiles, ja apagado no passo 2).
delete from training_plan_exercises where training_plan_id in (select training_plan_id from _tp);
delete from training_plan_exercises_history
  where training_plan_id in (select training_plan_id from _tp) or changed_by in (select id from _alvo);
delete from training_plans where id in (select id from _tp);
delete from meal_plan_meals where meal_plan_id::text in (select id::text from _mp union select meal_plan_id::text from _mp);
delete from meal_plans where id in (select id from _mp);

-- 4. Papel/linha de staff da conta staff revogada. staff_roles.granted_by (NO ACTION) aponta
--    para a propria conta (auto-concedido), entao staff_roles e staff saem ANTES de auth.users.
delete from staff_roles where user_id in (select id from _alvo);
delete from staff where user_id in (select id from _alvo);

-- 5. Conta de login: cascata leva identities, sessions, refresh_tokens, completed_*, mfa etc.
delete from auth.users where id in (select id from _alvo);
