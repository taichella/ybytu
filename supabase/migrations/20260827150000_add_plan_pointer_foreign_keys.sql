-- Achado 2026-08-27: profiles.current_training_plan_id/current_meal_plan_id
-- nunca tiveram FK -- um plano deletado (refeições removidas via limpeza de
-- catálogo, cascateando pra meal_plans; treino removido separadamente pela
-- tela /trainings) deixa o ponteiro no perfil apontando pro vazio, sem o
-- Postgres nunca avisar. Achado no caso real do Rayan Road
-- (418eb3fa-4786-43e3-829a-baa84ea8da2e): plan_generation_status='failed'
-- mas current_training_plan_id/current_meal_plan_id preenchidos com ids que
-- não existem em nenhuma tabela -- só foi possível descobrir com uma query
-- manual de reconciliação. Varredura em TODOS os profiles confirmou que só
-- o Rayan estava quebrado (não é generalizado), e as tabelas de vínculo
-- (user_training_plans/user_meal_plans) não tinham nenhuma linha órfã.

-- Zera o ponteiro quebrado do Rayan ANTES de criar a FK -- ele vai ser
-- regenerado na sequência (fix separado, fora desta migration).
update profiles set current_training_plan_id = null
  where id = '418eb3fa-4786-43e3-829a-baa84ea8da2e'
    and current_training_plan_id = 'f3c53024-1c52-4345-9994-63b75d4d033f';
update profiles set current_meal_plan_id = null
  where id = '418eb3fa-4786-43e3-829a-baa84ea8da2e'
    and current_meal_plan_id = 'c7c778b3-2ddf-45c6-9b89-49481d3de375';

-- ON DELETE SET NULL (não CASCADE): perder o plano nunca deve apagar o
-- profile do aluno -- só desatribui o plano, deixando "Sem plano" visível
-- em vez de um ponteiro morto silencioso.
alter table profiles
  add constraint profiles_current_training_plan_id_fkey
    foreign key (current_training_plan_id) references training_plans(id) on delete set null;
alter table profiles
  add constraint profiles_current_meal_plan_id_fkey
    foreign key (current_meal_plan_id) references meal_plans(id) on delete set null;

-- Mesma lacuna nas tabelas de vínculo (histórico de atribuições) -- essas
-- SIM fazem sentido com CASCADE: a linha de vínculo não tem significado sem
-- o plano que ela referencia.
alter table user_training_plans
  add constraint user_training_plans_training_plan_id_fkey
    foreign key (training_plan_id) references training_plans(id) on delete cascade;
alter table user_meal_plans
  add constraint user_meal_plans_meal_plan_id_fkey
    foreign key (meal_plan_id) references meal_plans(id) on delete cascade;
