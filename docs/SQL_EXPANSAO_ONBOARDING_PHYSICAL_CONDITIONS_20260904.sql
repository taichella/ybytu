-- NAO EXECUTAR ainda -- preparado 2026-09-04, aguardando confirmacao dos
-- rotulos pt-BR na Sessao 1 do personal (docs/SESSAO_1_PERSONAL_20260903.md).
--
-- Expande a pergunta de onboarding "Possui alguma dor ou limitacao fisica?"
-- de 7 para 14 opcoes, adicionando as 7 condicoes que ja existem em
-- physical_conditions (vocabulario completo, 16 linhas) mas nunca tiveram
-- linha correspondente em onboarding_physical_conditions (o que a tela le).
-- Sem isso, ninguem consegue declarar essas condicoes -- as 7 regras de
-- caution/avoid da IA para elas (cotovelo, punho, quadril, virilha,
-- posterior de coxa/isquiotibial, assoalho pelvico, problemas articulares
-- graves -- 218/323 avisos) nunca disparam pra nenhum aluno real hoje.
--
-- Zero mudanca de codigo necessaria: OnboardingPreLaunch.html le esta
-- tabela via `select('*').order('sort_order')` de forma generica, sem
-- logica presa as 7 opcoes atuais (confirmado em codigo, 2026-09-03/04).
--
-- Rotulos pt-BR: proposta da Taina, "Posterior de coxa" no lugar de
-- "Isquiotibial" (mais claro pra leigo) -- CONFIRMAR com o personal antes
-- de rodar (ver Sessao 1). name_en/name_fr reaproveitados de
-- physical_conditions para consistencia com o resto do catalogo.
--
-- Ordem: sort_order 5-11 pros 7 novos (agrupados por regiao do corpo --
-- nao ha criterio anatomico/frequencia herdado dos 7 atuais, que seguem
-- so ordem de insercao original, ver migration
-- 20260807100000_add_sort_order_onboarding_tables.sql). "Outra limitacao"
-- e "Nenhuma" empurrados de 5/6 para 12/13, preservando serem as ultimas
-- opcoes da lista.

begin;

insert into onboarding_physical_conditions
  (physical_condition_id, name_ptbr, name_en, name_fr, main_physical_conditions_ids, sort_order)
select
  pc.physical_condition_id,
  v.name_ptbr,
  pc.name_en,
  pc.name_fr,
  pc.id::text,
  v.sort_order
from (values
  ('elbow_pain',           'Cotovelo',                        5),
  ('wrist_pain',           'Punho',                           6),
  ('hip_pain',             'Quadril',                         7),
  ('groin_pain',           'Virilha',                         8),
  ('hamstring_injury',     'Posterior de coxa',                9),
  ('joint_problems_severe','Problemas articulares graves',    10),
  ('pelvic_floor_issues',  'Assoalho pélvico',                 11)
) as v(physical_condition_id, name_ptbr, sort_order)
join physical_conditions pc on pc.physical_condition_id = v.physical_condition_id;

update onboarding_physical_conditions set sort_order = 12 where physical_condition_id = 'other';
update onboarding_physical_conditions set sort_order = 13 where physical_condition_id = 'none';

-- Conferir antes de commitar: 14 linhas, sort_order 0-13 sem buraco nem
-- repeticao, "Outra limitacao"/"Nenhuma" nas duas ultimas posicoes.
-- select physical_condition_id, name_ptbr, sort_order
-- from onboarding_physical_conditions order by sort_order;

commit;
