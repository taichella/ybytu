-- Reforço além da FK (20260827150000): a FK evita ponteiro morto (ON DELETE
-- SET NULL), mas ainda DEIXARIA o delete acontecer e desatribuir o plano do
-- aluno sem ninguém perceber. O risco real não é a UI do dashboard (não
-- existe botão de deletar plano em /trainings nem /meal-plans — checado, só
-- tem list/create/update/set_active) — é SQL direto rodado fora do app
-- (Studio, ou uma sessão anterior do Claude limpando "rascunhos IA" sem
-- saber que um deles já é o plano ATUAL de um aluno real, caso do Rayan
-- Road). Um trigger bloqueia isso na origem, qualquer que seja o caminho.
create or replace function block_delete_assigned_training_plan()
returns trigger as $$
begin
  if exists (select 1 from profiles where current_training_plan_id = old.id) then
    raise exception 'Não é possível deletar training_plan % — ainda é o plano atual de pelo menos um aluno (profiles.current_training_plan_id). Reatribua outro plano ao aluno antes de deletar este.', old.training_plan_id;
  end if;
  return old;
end;
$$ language plpgsql;

create trigger trg_block_delete_assigned_training_plan
  before delete on training_plans
  for each row execute function block_delete_assigned_training_plan();

create or replace function block_delete_assigned_meal_plan()
returns trigger as $$
begin
  if exists (select 1 from profiles where current_meal_plan_id = old.id) then
    raise exception 'Não é possível deletar meal_plan % — ainda é o plano atual de pelo menos um aluno (profiles.current_meal_plan_id). Reatribua outro plano ao aluno antes de deletar este.', old.meal_plan_id;
  end if;
  return old;
end;
$$ language plpgsql;

create trigger trg_block_delete_assigned_meal_plan
  before delete on meal_plans
  for each row execute function block_delete_assigned_meal_plan();
