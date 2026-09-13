-- CONFIRMADO em 2026-09-07 -- personal confirmou os 7 rotulos propostos
-- abaixo ("Confirma" pros 7, ver docs/SESSAO_1_PERSONAL_PARA_ENVIO_20260905.md,
-- secao "Extra: confirme os rotulos"). Nenhum valor mudou em relacao a
-- proposta original. CONFERIDO ao vivo 2026-09-13: nunca tinha sido
-- executado de fato (onboarding_physical_conditions ainda com so 7 linhas),
-- so o comentario dizia "confirmado" -- rodando agora.
--
-- Roda como SUA PROPRIA invocacao, SEPARADA de
-- scripts/aplicacao_sessao1_secao_b_personal_20260913.sql -- achado
-- 2026-09-13: `supabase db query --file` trata cada arquivo como uma unica
-- string multi-statement (semantica padrao do protocolo simples do Postgres)
-- -- um erro em QUALQUER statement da string pula TODO o resto sem tentar
-- rodar, entao dois BEGIN...COMMIT logicamente independentes no MESMO
-- arquivo nao sao seguros se um dos dois ainda pode falhar. Aqui nao ha essa
-- pendencia (rotulos ja confirmados, fonte ja conferida), mas o habito de
-- manter em arquivo proprio evita reintroduzir o risco depois. Ver
-- [[feedback_db_access_via_supabase_cli]].
--
-- Sem isso, 9 das 13 regras de caution/avoid que a Secao B decide ficam sem
-- nenhum aluno capaz de declarar a condicao correspondente -- ver
-- [[project_onboarding_physical_conditions_blocks_sessao1]].
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

-- Guarda automatica: 14 linhas, sort_order 0-13 sem buraco nem repeticao --
-- antes so tinha um SELECT comentado pra conferencia manual, sem nada que
-- abortasse se o INSERT tivesse inserido menos de 7 linhas (join silencioso
-- contra physical_conditions poderia ter sumido linha sem avisar).
do $$
declare total int; distintos int;
begin
  select count(*), count(distinct sort_order) into total, distintos from onboarding_physical_conditions;
  if total <> 14 then
    raise exception 'Esperado 14 linhas em onboarding_physical_conditions apos o INSERT, achou %', total;
  end if;
  if distintos <> 14 then
    raise exception 'sort_order tem repeticao -- % valores distintos pra % linhas', distintos, total;
  end if;
  if (select sort_order from onboarding_physical_conditions where physical_condition_id = 'other') <> 12 then
    raise exception 'Outra limitacao nao ficou em sort_order 12';
  end if;
  if (select sort_order from onboarding_physical_conditions where physical_condition_id = 'none') <> 13 then
    raise exception 'Nenhuma nao ficou em sort_order 13';
  end if;
end $$;

commit;
