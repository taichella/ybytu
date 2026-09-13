-- ============================================================================
-- SECAO B (PERSONAL) -- extraida de scripts/aplicacao_sessao1_20260904.sql
-- em 2026-09-13 pra rodar como arquivo/invocacao PROPRIA, separada da Secao A
-- (nutricao, que ainda aguarda a nutricionista).
--
-- MOTIVO DA EXTRACAO: testado ao vivo em 2026-09-13 -- `supabase db query
-- --file` (Management API, --linked) embrulha o ARQUIVO INTEIRO numa
-- transacao implicita por fora, mesmo quando o arquivo tem BEGIN/COMMIT
-- explicitos no meio. Um erro em QUALQUER ponto do arquivo derruba TUDO,
-- inclusive blocos que ja teriam commitado sozinhos se rodados em invocacoes
-- separadas. A Secao A ainda tem placeholder por preencher (aguardando
-- nutricionista) -- rodar o arquivo combinado hoje derrubaria a Secao B
-- (pronta) junto com a Secao A (nao pronta). Ver
-- [[feedback_db_access_via_supabase_cli]] pro teste que confirmou isso.
--
-- Todas as respostas do personal abaixo ja vieram preenchidas por Taina
-- (2026-09-13) -- nao sao chute nem preenchimento automatico.
-- ============================================================================

BEGIN;

-- ---- B0. Backup --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercises_muscle_groups_backup_20260904 AS
SELECT exercise_id, muscle_groups_ids, now() AS backed_up_at
FROM exercises
WHERE exercise_id IN ('ex_050','ex_078','ex_079','ex_054','ex_083','ex_194','ex_216','ex_013','ex_285');

CREATE TABLE IF NOT EXISTS exercise_condition_proposals_backup_20260904 AS
SELECT id, exercise_id, condition_slug, tipo, status, rule_id, reviewed_at, reviewed_by, now() AS backed_up_at
FROM exercise_condition_proposals;

-- ---- B1. 9 casos de muscle_groups_ids errado --------------------------------
-- 5 primeiros: confirmados como propostos (Cadeira flexora, Mesa flexora,
-- Stiff com barra, Kettlebell swing, Levantamento terra/Deadlift com barra
-- olimpica). Os 4 ultimos eram divergencia real -- resolvidos abaixo com o
-- valor que o personal deu, nao com nenhuma das duas opcoes originais:
--
-- Flexao de braco pegada fechada (ex_194 tinha [biceps,chest,triceps,
-- deltoids] sem core; ex_216 tinha [triceps,chest,deltoids,core] sem biceps
-- -- "nenhuma das duas" estava completa). Personal: triceps + peito + ombro
-- + core + biceps -- aplicada nos DOIS exercicios.
--
-- Wall ball (ex_013 tinha so [quadriceps]; ex_285 ja tinha [full_body],
-- correto). Personal: "a segunda versao, corpo inteiro" -- full_body nos
-- DOIS, corrigindo a duplicata que estava so com quadriceps.
--
-- CONFIRMADO 2026-09-13 (duvida legitima da Taina, verificada contra a fonte
-- antes de aplicar): docs/SESSAO_1_PERSONAL_20260903.md:60 descreve os 7
-- pares desta secao, SEM excecao, como "duas entradas no catalogo com o
-- mesmo nome; uma tem muscle_groups_ids completo, a outra esta faltando
-- musculo(s))" -- ou seja, mesmo padrao de duplicata acidental de catalogo
-- dos 5 primeiros, nao duas variacoes legitimas do movimento. A diferenca
-- dos 2 ultimos pros 5 primeiros e so que exigem julgamento clinico pra
-- saber QUAL valor e o correto, nao que sejam exercicios genuinamente
-- distintos. "Nenhuma das duas" rejeita explicitamente as DUAS respostas
-- pre-existentes (nao confirma uma e corrige a outra) -- aplicar o valor
-- corrigido nos dois exercise_id e a leitura certa, nao uma decisao
-- unilateral da IA. Resultado colateral conhecido, nao resolvido aqui: os
-- pares ficam com TODOS os campos revisados idênticos (mesmo nome, mesmo
-- muscle_groups_ids) -- consolidar/desativar a linha redundante e trabalho
-- separado, fora do escopo da Sessao 1 (ver
-- [[project_exercise_muscle_groups_duplicate_pattern]]).

CREATE TEMP TABLE decisao_muscle_groups (
  exercise_id text PRIMARY KEY,
  nome text,
  muscle_group_slugs text[]
);

INSERT INTO decisao_muscle_groups (exercise_id, nome, muscle_group_slugs) VALUES
  ('ex_050', 'Cadeira flexora',                        ARRAY['hamstrings','glutes']),
  ('ex_078', 'Mesa flexora',                            ARRAY['hamstrings','glutes','core','stabilizers']),
  ('ex_079', 'Stiff com barra',                         ARRAY['glutes','hamstrings']),
  ('ex_054', 'Kettlebell swing',                        ARRAY['hamstrings','glutes','quadriceps','core']),
  ('ex_083', 'Deadlift com barra olimpica (Levantamento terra)', ARRAY['glutes','posterior_chain']),
  ('ex_194', 'Flexao de braco pegada fechada (opcao A)', ARRAY['triceps_brachii','chest','deltoids','core','biceps_brachii']),
  ('ex_216', 'Flexao de braco pegada fechada (opcao B)', ARRAY['triceps_brachii','chest','deltoids','core','biceps_brachii']),
  ('ex_013', 'Wall ball (opcao A)',                      ARRAY['full_body']),
  ('ex_285', 'Wall ball (opcao B)',                      ARRAY['full_body']);

DO $$
DECLARE invalidos text; pendentes int;
BEGIN
  SELECT count(*) INTO pendentes FROM decisao_muscle_groups WHERE muscle_group_slugs IS NULL;
  IF pendentes > 0 THEN
    RAISE EXCEPTION 'B1: % linhas sem muscle_group_slugs preenchido', pendentes;
  END IF;

  SELECT string_agg(d.exercise_id || ':' || bad.slug, ', ') INTO invalidos
  FROM decisao_muscle_groups d
  CROSS JOIN LATERAL unnest(d.muscle_group_slugs) AS bad(slug)
  WHERE NOT EXISTS (SELECT 1 FROM muscle_groups mg WHERE mg.muscle_group_id = bad.slug);
  IF invalidos IS NOT NULL THEN
    RAISE EXCEPTION 'B1: slug(s) de muscle_group invalido(s) (nao existem em muscle_groups.muscle_group_id): %', invalidos;
  END IF;
END $$;

-- BUG EXECUTADO E CORRIGIDO 2026-09-13: esta linha usava `mg.id` (uuid, PK de
-- muscle_groups) em vez de `mg.muscle_group_id` (slug texto) -- errado,
-- porque exercises.muscle_groups_ids guarda SLUG, nao uuid (confirmado
-- contra buildPlanPayload.ts e contra o valor real pre-existente de
-- ex_013/ex_285, ["quadriceps"]/["full_body"], texto puro). Bug copiado
-- verbatim do script original (aplicacao_sessao1_20260904.sql), nunca
-- reauditado antes de rodar. Os 9 exercicios desta secao ficaram com array
-- de uuid por alguns minutos ate o hotfix
-- (scripts/hotfix_muscle_groups_ids_uuid_bug_20260913.sql, executado e
-- verificado na sequencia) corrigir pra slug. Linha abaixo mantida com o
-- bug pra registro fiel do que rodou -- NAO copiar este UPDATE de novo sem
-- trocar mg.id por mg.muscle_group_id.
UPDATE exercises e
SET muscle_groups_ids = (
  SELECT array_agg(mg.id)
  FROM muscle_groups mg
  WHERE mg.muscle_group_id = ANY (d.muscle_group_slugs)
)
FROM decisao_muscle_groups d
WHERE e.exercise_id = d.exercise_id;

-- ---- B2. 12 das 13 regras de caution/avoid (regra 7 pendente, ver abaixo) ---
-- Personal (2026-09-13): TODAS as 12 como 'caution' (mantem como esta),
-- incluindo a Regra 8 (linha 8, knee_pain/R1, "Joelho: agachamento/avanco
-- com carga") que ele classificou como Aviso -- ver
-- [[feedback_never_fill_sessao1_placeholders]]. Nenhum novo_texto pedido em
-- nenhuma linha.
--
-- REGRA 7 (joint_problems_severe, R12, afeta 40 exercicios) continua DE
-- PROPOSITO fora da lista -- pendente da mesma separacao staff/aluno pra
-- caution_warnings que o personal pediu na Sessao 1 original (ver
-- docs/DEBITO_AVISO_STAFF_ONLY_CAUTION_20260906.md), nao decidida ainda.

CREATE TEMP TABLE decisao_cautions (
  linha int PRIMARY KEY,
  condition_slug text,
  rule_id text,
  afeta_esperado int,
  decisao text,
  novo_texto text
);

INSERT INTO decisao_cautions (linha, condition_slug, rule_id, afeta_esperado, decisao, novo_texto) VALUES
  (1,  'ankle_pain',            'R2',  19, 'caution', NULL),
  (2,  'ankle_pain',            'R3',  16, 'caution', NULL),
  (3,  'elbow_pain',            'R5',  35, 'caution', NULL),
  (4,  'groin_pain',            'R9',   8, 'caution', NULL),
  (5,  'hamstring_injury',      'R8',  22, 'caution', NULL),
  (6,  'hip_pain',              'R10', 17, 'caution', NULL),
  -- (7, 'joint_problems_severe', 'R12', 40, ...) -- PENDENTE, ver comentario acima. Nao incluir aqui ate decidir.
  (8,  'knee_pain',             'R1',  15, 'caution', NULL), -- Regra 8: Aviso
  (9,  'knee_pain',             'R2',  15, 'caution', NULL),
  (10, 'lumbar_pain',           'R4',  30, 'caution', NULL),
  (11, 'neck_pain',             'R7',  10, 'caution', NULL),
  (12, 'pelvic_floor_issues',   'R11', 64, 'caution', NULL),
  (13, 'wrist_pain',            'R6',  32, 'caution', NULL);

DO $$
DECLARE pendentes int;
BEGIN
  SELECT count(*) INTO pendentes FROM decisao_cautions WHERE decisao IS NULL;
  IF pendentes > 0 THEN
    RAISE EXCEPTION 'Cautions: % linhas sem decisao preenchida', pendentes;
  END IF;
  IF (SELECT count(*) FROM decisao_cautions WHERE decisao NOT IN ('caution','avoid')) > 0 THEN
    RAISE EXCEPTION 'Cautions: decisao invalida, use caution ou avoid';
  END IF;
END $$;

-- conferencia de contagem contra o documento ANTES de aplicar qualquer UPDATE
-- -- por (condition_slug, rule_id), identificador estavel que nao muda com
-- edicao de texto.
DO $$
DECLARE r record; real_count int;
BEGIN
  FOR r IN SELECT * FROM decisao_cautions LOOP
    SELECT count(*) INTO real_count
    FROM exercise_condition_proposals p
    WHERE p.condition_slug = r.condition_slug
      AND p.rule_id = r.rule_id;
    IF real_count <> r.afeta_esperado THEN
      RAISE EXCEPTION 'Linha %: esperado % exercicios pra %/%, banco tem % -- confirme antes de aplicar',
        r.linha, r.afeta_esperado, r.condition_slug, r.rule_id, real_count;
    END IF;
  END LOOP;
END $$;

-- IMPORTANTE: NAO seta status='reviewed'. exercise_effective_cautions (a view
-- que o gerador le pra excluir exercicio de quem tem 'avoid') so inclui
-- linhas de exercise_condition_proposals com status='ai_suggested' -- ver
-- pg_get_viewdef, confirmado 2026-09-05. Se o UPDATE mudasse o status, a
-- linha desapareceria da view por completo, silenciosamente cancelando a
-- regra inteira pro gerador. reviewed_at/reviewed_by continuam gravados como
-- trilha de auditoria.
UPDATE exercise_condition_proposals p
SET tipo = d.decisao,
    reviewed_at = now(),
    reviewed_by = 'personal_sessao1_20260913'
FROM decisao_cautions d
WHERE p.condition_slug = d.condition_slug
  AND p.rule_id = d.rule_id;

-- Texto novo -- nenhuma linha pediu, mas mantido pra re-execucao futura
-- consistente com o resto da familia de scripts (novo_texto sempre NULL
-- aqui, este UPDATE e um no-op nesta rodada).
UPDATE exercise_condition_proposals p
SET clinical_reason = d.novo_texto
FROM decisao_cautions d
WHERE p.condition_slug = d.condition_slug
  AND p.rule_id = d.rule_id
  AND d.novo_texto IS NOT NULL;

-- ---- B3. Rotulos das 7 opcoes novas de onboarding ---------------------------
-- NAO esta neste arquivo -- e docs/SQL_EXPANSAO_ONBOARDING_PHYSICAL_
-- CONDITIONS_20260904.sql, rotulos ja confirmados pelo personal (todos os 7
-- como propostos, incluindo "Posterior de coxa"). Roda como SUA PROPRIA
-- invocacao, separada desta -- mesmo motivo do cabecalho acima (tabela
-- diferente, sem overlap de dado, mas AINDA ASSIM nao deve entrar no mesmo
-- arquivo por causa do embrulho de transacao implicito).

COMMIT;

-- ---- C-B. VERIFICACAO POS-APLICACAO (personal) ------------------------------
-- Rodar depois do COMMIT acima, em invocacao separada (mesmo motivo).

-- C-B1. As promocoes pra 'avoid' esvaziam algum pool por nivel?
SELECT
  e.exercise_level_id,
  count(*) FILTER (WHERE ecp.tipo IS DISTINCT FROM 'avoid') AS exercicios_sobrando_pior_caso
FROM exercises e
LEFT JOIN exercise_effective_cautions ecp
  ON ecp.exercise_id = e.exercise_id AND ecp.tipo = 'avoid'
GROUP BY e.exercise_level_id
ORDER BY exercicios_sobrando_pior_caso ASC;
-- Nesta rodada nao deveria haver NENHUMA promocao pra 'avoid' (todas as 12
-- decisoes sao 'caution') -- esta query deveria voltar contagens iguais a
-- antes, so pra registro/comparacao.

-- C-B2. Quantas propostas de fato mudaram de caution pra avoid.
SELECT
  (SELECT count(*) FROM exercise_condition_proposals_backup_20260904 WHERE tipo = 'avoid') AS avoid_antes,
  (SELECT count(*) FROM exercise_condition_proposals WHERE tipo = 'avoid') AS avoid_depois;
-- Esperado: os dois numeros IGUAIS -- nenhuma linha virou avoid nesta rodada.

-- C-B3. Quem JA TEM, no plano ativo, um exercicio que uma regra promovida
-- nesta sessao tornou exclusao. Nesta rodada deveria vir SEMPRE vazia (nada
-- foi promovido a avoid) -- mantido mesmo assim por seguranca/re-execucao
-- futura, caso uma proxima rodada promova alguma regra.

CREATE TEMP TABLE regra_label (rule_id text, condition_slug text, label text);
INSERT INTO regra_label (rule_id, condition_slug, label) VALUES
  ('R2', 'ankle_pain',            'Regra 1 -- Tornozelo: impacto ao aterrissar'),
  ('R3', 'ankle_pain',            'Regra 2 -- Tornozelo: plantiflexao repetida'),
  ('R5', 'elbow_pain',            'Regra 3 -- Cotovelo: flexao/extensao com carga'),
  ('R9', 'groin_pain',            'Regra 4 -- Virilha: abducao/aducao com carga'),
  ('R8', 'hamstring_injury',      'Regra 5 -- Posterior de coxa: dobradica de quadril'),
  ('R10','hip_pain',              'Regra 6 -- Quadril: flexao de quadril com carga'),
  ('R12','joint_problems_severe', 'Regra 7 -- Problemas articulares graves: impacto/compressao'),
  ('R1', 'knee_pain',             'Regra 8 -- Joelho: agachamento/avanco com carga'),
  ('R2', 'knee_pain',             'Regra 9 -- Joelho: impacto ao aterrissar'),
  ('R4', 'lumbar_pain',           'Regra 10 -- Lombar: carga na coluna com flexao'),
  ('R7', 'neck_pain',             'Regra 11 -- Pescoco: empurrar peso acima da cabeca'),
  ('R11','pelvic_floor_issues',   'Regra 12 -- Assoalho pelvico: carga pesada/impacto'),
  ('R6', 'wrist_pain',            'Regra 13 -- Punho: extensao forcada com peso do corpo');

CREATE TEMP TABLE exposto_avoid AS
WITH user_condition AS (
  SELECT
    p.id AS user_id, p.full_name, p.current_training_plan_id,
    hc.health_condition_id AS condition_slug,
    hc.name_ptbr AS condicao_declarada
  FROM profiles p
  JOIN health_conditions hc ON hc.id = ANY(p.health_conditions_ids)
  WHERE p.current_training_plan_id IS NOT NULL
    AND hc.health_condition_id NOT IN ('none', 'other')

  UNION ALL

  SELECT
    p.id, p.full_name, p.current_training_plan_id,
    slug, opc.name_ptbr
  FROM profiles p
  JOIN onboarding_physical_conditions opc ON opc.id = ANY(p.physical_conditions_ids)
  JOIN physical_conditions pc ON pc.id::text = opc.main_physical_conditions_ids
  JOIN physical_condition_exercise_slugs br ON br.physical_condition_id = pc.physical_condition_id
  CROSS JOIN LATERAL unnest(br.exercise_condition_slugs) AS slug
  WHERE p.current_training_plan_id IS NOT NULL
)
SELECT DISTINCT
  uc.full_name       AS aluno,
  uc.condicao_declarada AS condicao,
  e.name_ptbr         AS exercicio_afetado,
  tpe.day_number      AS dia_do_plano,
  rl.label            AS regra_que_mudou
FROM user_condition uc
JOIN decisao_cautions d ON d.condition_slug = uc.condition_slug AND d.decisao = 'avoid'
JOIN regra_label rl ON rl.rule_id = d.rule_id AND rl.condition_slug = d.condition_slug
JOIN exercise_condition_proposals p ON p.condition_slug = d.condition_slug AND p.rule_id = d.rule_id
JOIN training_plans tp ON tp.id = uc.current_training_plan_id
JOIN training_plan_exercises tpe ON tpe.training_plan_id = tp.training_plan_id AND tpe.exercise_id = p.exercise_id
JOIN exercises e ON e.exercise_id = tpe.exercise_id;

SELECT * FROM exposto_avoid ORDER BY aluno, dia_do_plano;
-- Esperado: vazia (nenhuma linha foi promovida a avoid nesta rodada).
