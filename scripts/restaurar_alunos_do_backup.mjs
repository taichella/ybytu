// Gera o SQL que restaura as linhas de um backup feito antes de
// scripts/limpeza_alunos_teste_20260921.sql.
//
// Uso:  node scripts/restaurar_alunos_do_backup.mjs <backup.json> > restore.sql
//       npx supabase db query --linked -f restore.sql
//
// O SQL insere na ordem das FKs (planos -> auth -> profiles -> vinculos), so nas
// colunas NAO geradas (auth.users.confirmed_at, auth.identities.email), com
// ON CONFLICT DO NOTHING: rodar duas vezes nao duplica nem sobrescreve nada.
// O backup contem hashes de senha (auth.users): mantenha fora do repo.
import fs from 'node:fs'

const file = process.argv[2]
if (!file) { console.error('uso: node restaurar_alunos_do_backup.mjs <backup.json>'); process.exit(1) }
const { tabelas } = JSON.parse(fs.readFileSync(file, 'utf8'))

const ORDEM = [
  'public.training_plans', 'public.training_plan_exercises', 'public.training_plan_exercises_history',
  'public.meal_plans', 'public.meal_plan_meals',
  'auth.users', 'auth.identities', 'auth.sessions', 'auth.refresh_tokens', 'auth.mfa_factors', 'auth.one_time_tokens',
  'public.staff', 'public.staff_roles',
  'public.profiles', 'public.user_training_profiles', 'public.user_meal_profiles',
  'public.user_training_plans', 'public.user_meal_plans', 'public.plan_share_tokens', 'public.plan_reviews',
  'public.completed_meals', 'public.completed_workouts', 'public.whatsapp_notifications',
]
const faltando = Object.keys(tabelas).filter((t) => !ORDEM.includes(t))
if (faltando.length) { console.error('tabelas no backup fora da ordem de restauracao:', faltando); process.exit(1) }

const json = JSON.stringify(tabelas)
if (json.includes('$bkjson$')) { console.error('backup contem o delimitador $bkjson$'); process.exit(1) }
const lista = ORDEM.map((t, i) => `(${i + 1}, '${t.split('.')[0]}', '${t.split('.')[1]}')`).join(',\n    ')

console.log(`-- restaurar ${file} (${Object.values(tabelas).reduce((n, r) => n + r.length, 0)} linhas em ${Object.keys(tabelas).length} tabelas)
do $restore$
declare
  d jsonb := $bkjson$${json}$bkjson$::jsonb;
  t record;
  cols text;
begin
  for t in select * from (values
    ${lista}
  ) v(ord, sch, tbl) order by ord loop
    select string_agg(quote_ident(column_name), ',' order by ordinal_position) into cols
      from information_schema.columns
      where table_schema = t.sch and table_name = t.tbl and is_generated = 'NEVER';
    execute format(
      'insert into %I.%I (%s) overriding system value select %s from jsonb_populate_recordset(null::%I.%I, $1) on conflict do nothing',
      t.sch, t.tbl, cols, cols, t.sch, t.tbl)
      using coalesce(d -> (t.sch || '.' || t.tbl), '[]'::jsonb);
  end loop;
end $restore$;`)
