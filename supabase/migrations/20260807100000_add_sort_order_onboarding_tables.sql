-- Taina quer poder reordenar as opções mostradas no onboarding (hoje a ordem
-- é a ordem crua do banco, sem coluna dedicada). Adiciona sort_order nas 11
-- tabelas de catálogo usadas pelo onboarding (OnboardingPreLaunch.html) e
-- popula com a ordem ATUAL de cada tabela (ORDER BY ctid == ordem física,
-- que é o que um `select *` sem ORDER BY já retornava na prática) -- assim
-- a mudança não reordena nada sozinha. Reordenar depois é via UPDATE manual
-- (SQL sob demanda); telinha de admin pra isso é debt, só quando o dashboard
-- de catálogos pequenos existir (ver [[project_dashboard_pro_admin_screens]]).
do $$
declare
  t text;
  tables text[] := array[
    'goals', 'genders', 'activity_levels', 'health_conditions',
    'onboarding_physical_conditions', 'onboarding_muscle_groups',
    'exercise_environment', 'onboarding_exercise_equipments',
    'exercise_levels', 'dietary_preferences', 'dietary_restrictions'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I add column if not exists sort_order integer', t);
    execute format(
      'update %I set sort_order = sub.rn from (select ctid, row_number() over (order by ctid) - 1 as rn from %I) sub where %I.ctid = sub.ctid',
      t, t, t
    );
    execute format('alter table %I alter column sort_order set default 0', t);
  end loop;
end $$;
