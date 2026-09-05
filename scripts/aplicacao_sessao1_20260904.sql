-- ============================================================================
-- APLICACAO DAS DECISOES DA SESSAO 1 -- nutricionista (57 decisoes) + personal
-- (20 decisoes). NAO EXECUTAR ainda -- preparado 2026-09-04, esperando as
-- respostas de docs/SESSAO_1_NUTRICIONISTA_20260902.md e
-- docs/SESSAO_1_PERSONAL_20260903.md chegarem.
--
-- DUAS TRANSACOES INDEPENDENTES (SECAO A e SECAO B), cada uma com seu proprio
-- BEGIN/COMMIT. Se a nutricionista responder primeiro, roda so a Secao A +
-- Verificacao C-A; o personal nao precisa estar pronto. Mesmo no sentido
-- inverso.
--
-- COMO PREENCHER: cada bloco abaixo cria uma tabela temporaria com uma linha
-- por decisao, coluna(s) de decisao comecando NULL/vazia. So editar os
-- VALUES -- nao mexer no resto do script. Cada bloco tem uma guarda (DO $$
-- ... RAISE EXCEPTION) que aborta SO A TRANSACAO DELE (A ou B) se alguma
-- decisao ficou sem preencher ou se algum valor digitado (token de alergeno,
-- slug de grupo muscular) nao existe na tabela de referencia -- nesse ultimo
-- caso a mensagem de erro cita o food_id/exercise_id e o valor invalido, nao
-- precisa caçar.
--
-- Nomes de coluna/tabela conferidos contra docs/export_nutricao_20260901/
-- schema.sql (nutricao, real) e docs/SCHEMA.md (resto, desatualizado desde
-- 2026-08-05 mas exercise_condition_proposals nao mudou desde entao -- ok
-- usar). Se algo aqui nao bater com o banco, o banco manda, nao este script.
-- ============================================================================


-- ############################################################################
-- SECAO A -- NUTRICIONISTA (docs/SESSAO_1_NUTRICIONISTA_20260902.md)
-- Roda sozinha, independente da Secao B.
-- ############################################################################

BEGIN;

-- ---- A0. Backup -- antes de qualquer mudanca. CREATE TABLE IF NOT EXISTS AS
-- so materializa o SELECT na primeira vez que roda -- se a secao for
-- reexecutada depois (ex: correcao de decisao), o backup continua sendo o
-- estado ANTES de qualquer mudanca desta sessao, nao o estado da ultima
-- tentativa.

CREATE TABLE IF NOT EXISTS foods_backup_20260904 AS
SELECT food_id, allergen_review_status, now() AS backed_up_at
FROM foods;

CREATE TABLE IF NOT EXISTS food_restriction_tags_backup_20260904 AS
SELECT food_id, token, now() AS backed_up_at
FROM food_restriction_tags;

-- ---- A1. Bloco 1 -- food_420 Whey, disputa sobre soy -------------------------
-- Pergunta: "o banco registra soy; confirma que o banco esta certo?"
-- Preencher: 'confirma_banco' (mantem soy) ou 'analise_externa_certa' (remove soy).

CREATE TEMP TABLE decisao_bloco1 (decisao text);
INSERT INTO decisao_bloco1 (decisao) VALUES (NULL); -- <<< PREENCHER

DO $$
BEGIN
  IF (SELECT decisao FROM decisao_bloco1) IS NULL THEN
    RAISE EXCEPTION 'Bloco 1 (food_420) sem decisao preenchida';
  END IF;
  IF (SELECT decisao FROM decisao_bloco1) NOT IN ('confirma_banco','analise_externa_certa') THEN
    RAISE EXCEPTION 'Bloco 1: decisao invalida, use confirma_banco ou analise_externa_certa';
  END IF;
END $$;

-- delete-e-reinsere-por-decisao (nao so delete-condicional) pra ser
-- re-executavel nas duas direcoes: se rodar com 'analise_externa_certa' e
-- depois a nutricionista reverter pra 'confirma_banco', rodar de novo tem
-- que devolver o soy, nao so deixar de remover.
DELETE FROM food_restriction_tags WHERE food_id = 'food_420' AND token = 'soy';

INSERT INTO food_restriction_tags (food_id, token)
SELECT 'food_420', 'soy'
WHERE (SELECT decisao FROM decisao_bloco1) = 'confirma_banco'
ON CONFLICT DO NOTHING;

-- ---- A2. Bloco 2a -- piso minimo de proteina --------------------------------
-- NAO E MUDANCA DE BANCO. E um parametro usado em codigo (troca a categoria
-- "Refeicao Incompleta" de auditoria por corte de protein_g). Quando a
-- resposta chegar (10g/15g/20g/outro), atualizar o valor onde a auditoria de
-- proteina le esse piso -- nao existe coluna/config table pra isso hoje.
-- Deixado aqui so pra nao se perder na lista de pendencias, sem SQL.

-- ---- A3. Bloco 2b -- coco, tree_nuts ou nao ---------------------------------
-- IDs dos 7 alimentos de coco nao estavam listados no documento da sessao --
-- rodar o SELECT abaixo pra confirmar que sao exatamente 7 antes de editar
-- a decisao.

-- SELECT food_id, name_ptbr FROM foods WHERE name_ptbr ILIKE '%coco%' ORDER BY food_id;

CREATE TEMP TABLE decisao_bloco2b (decisao text);
INSERT INTO decisao_bloco2b (decisao) VALUES (NULL); -- <<< PREENCHER: 'manter' ou 'remover'

DO $$
BEGIN
  IF (SELECT decisao FROM decisao_bloco2b) IS NULL THEN
    RAISE EXCEPTION 'Bloco 2b (coco/tree_nuts) sem decisao preenchida';
  END IF;
  IF (SELECT decisao FROM decisao_bloco2b) NOT IN ('manter','remover') THEN
    RAISE EXCEPTION 'Bloco 2b: decisao invalida, use manter ou remover';
  END IF;
END $$;

INSERT INTO food_restriction_tags (food_id, token)
SELECT food_id, 'tree_nuts'
FROM foods
WHERE name_ptbr ILIKE '%coco%'
  AND (SELECT decisao FROM decisao_bloco2b) = 'manter'
ON CONFLICT DO NOTHING;

DELETE FROM food_restriction_tags
WHERE token = 'tree_nuts'
  AND food_id IN (SELECT food_id FROM foods WHERE name_ptbr ILIKE '%coco%')
  AND (SELECT decisao FROM decisao_bloco2b) = 'remover';

-- ---- A4. Bloco 3 -- 42 alimentos unreviewed ---------------------------------
-- decisao: 'sem_alergeno' -> allergen_review_status = reviewed_none
--          'contem'       -> allergen_review_status = reviewed_has_allergens
--                             + preencher alergenos (array de tokens, ex:
--                             ARRAY['gluten','milk'])

CREATE TEMP TABLE decisao_bloco3 (
  food_id text PRIMARY KEY,
  nome text,
  decisao text,       -- <<< PREENCHER: 'sem_alergeno' ou 'contem'
  alergenos text[]     -- <<< PREENCHER apenas se decisao = 'contem'
);

INSERT INTO decisao_bloco3 (food_id, nome, decisao, alergenos) VALUES
  ('food_079', 'Banana', NULL, NULL),
  ('food_367', 'Cacau em po (sem acucar)', NULL, NULL),
  ('food_163', 'Peito de frango grelhado', NULL, NULL),
  ('food_320', 'Azeite de oliva extravirgem', NULL, NULL),
  ('food_380', 'Molho de tomate caseiro', NULL, NULL),
  ('food_260', 'Tapioca (goma preparada)', NULL, NULL),
  ('food_088', 'Morango', NULL, NULL),
  ('food_270', 'Pure de abobora (preparado)', NULL, NULL),
  ('food_363', 'Mel de abelha', NULL, NULL),
  ('food_161', 'Grao-de-bico cozido', NULL, NULL),
  ('food_238', 'Bacon de peru', NULL, NULL),
  ('food_028', 'Abacate', NULL, NULL),
  ('food_497', 'Chia hidratada (Pudim de Chia base)', NULL, NULL),
  ('food_221', 'Peito de peru defumado', NULL, NULL),
  ('food_002', 'Batata doce cozida', NULL, NULL),
  ('food_405', 'Limonada sem acucar', NULL, NULL),
  ('food_489', 'Canela em po', NULL, NULL),
  ('food_487', 'Ervilha em conserva', NULL, NULL),
  ('food_395', 'Guacamole', NULL, NULL),
  ('food_383', 'Ketchup', NULL, NULL),
  ('food_430', 'Colageno hidrolisado', NULL, NULL),
  ('food_400', 'Cafe sem acucar', NULL, NULL),
  ('food_402', 'Agua de coco', NULL, NULL),
  ('food_418', 'Kombucha (tradicional)', NULL, NULL),
  ('food_464', 'Batata frita Fast-Food', NULL, NULL),
  ('food_470', 'Salgadinho de pacote (tipo chips de milho)', NULL, NULL),
  ('food_490', 'Curcuma (Acafrao-da-terra)', NULL, NULL),
  ('food_159', 'Feijao preto cozido', NULL, NULL),
  ('food_037', 'Alface', NULL, NULL),
  ('food_494', 'Extrato de baunilha', NULL, NULL),
  ('food_492', 'Oregano seco', NULL, NULL),
  ('food_350', 'Farinha de grao-de-bico', NULL, NULL),
  ('food_443', 'Hamburguer vegetal (tipo carne)', NULL, NULL),
  ('food_378', 'Acai com xarope de guarana', NULL, NULL),
  ('food_369', 'Geleia de morango', NULL, NULL),
  ('food_035', 'Aipo (Salsao)', NULL, NULL),
  ('food_498', 'Spirulina em po', NULL, NULL),
  ('food_081', 'Mamao', NULL, NULL),
  ('food_257', 'Biscoito de arroz', NULL, NULL),
  ('food_493', 'Gengibre em po', NULL, NULL),
  ('food_401', 'Cha verde sem acucar', NULL, NULL),
  ('food_346', 'Farinha de linhaca', NULL, NULL);

DO $$
DECLARE pendentes int; invalidos text;
BEGIN
  SELECT count(*) INTO pendentes FROM decisao_bloco3
  WHERE decisao IS NULL OR (decisao = 'contem' AND alergenos IS NULL);
  IF pendentes > 0 THEN
    RAISE EXCEPTION 'Bloco 3: % decisoes sem preencher', pendentes;
  END IF;

  IF (SELECT count(*) FROM decisao_bloco3 WHERE decisao NOT IN ('sem_alergeno','contem')) > 0 THEN
    RAISE EXCEPTION 'Bloco 3: decisao invalida, use sem_alergeno ou contem';
  END IF;

  -- valida cada token digitado contra restriction_tokens ANTES do INSERT,
  -- pra apontar food_id + token errado em vez de deixar a FK estourar num
  -- lote sem dizer qual linha falhou.
  SELECT string_agg(d.food_id || ':' || bad.token, ', ') INTO invalidos
  FROM decisao_bloco3 d
  CROSS JOIN LATERAL unnest(d.alergenos) AS bad(token)
  WHERE d.decisao = 'contem'
    AND NOT EXISTS (SELECT 1 FROM restriction_tokens rt WHERE rt.token = bad.token);
  IF invalidos IS NOT NULL THEN
    RAISE EXCEPTION 'Bloco 3: token(s) invalido(s) (nao existem em restriction_tokens): %', invalidos;
  END IF;
END $$;

UPDATE foods f
SET allergen_review_status = CASE d.decisao
  WHEN 'sem_alergeno' THEN 'reviewed_none'
  WHEN 'contem' THEN 'reviewed_has_allergens'
END
FROM decisao_bloco3 d
WHERE f.food_id = d.food_id;

DELETE FROM food_restriction_tags
WHERE food_id IN (SELECT food_id FROM decisao_bloco3);

INSERT INTO food_restriction_tags (food_id, token)
SELECT food_id, unnest(alergenos)
FROM decisao_bloco3
WHERE decisao = 'contem'
ON CONFLICT DO NOTHING;

-- ---- A5. Bloco 4 -- 12 alimentos com alergeno em disputa --------------------
-- decisao: 'confirma_banco'      -> mantem os tokens listados em tokens_banco
--          'analise_externa_certa' -> remove os tokens listados em tokens_remover
-- (tokens_banco/tokens_remover ja vem preenchidos do documento, nao sao
-- digitados por voce -- so a coluna decisao precisa de preenchimento.)

CREATE TEMP TABLE decisao_bloco4 (
  food_id text PRIMARY KEY,
  nome text,
  tokens_banco text[],
  tokens_remover text[],
  decisao text  -- <<< PREENCHER: 'confirma_banco' ou 'analise_externa_certa'
);

INSERT INTO decisao_bloco4 (food_id, nome, tokens_banco, tokens_remover, decisao) VALUES
  ('food_220', 'Presunto cozido',              ARRAY['pork'],                          ARRAY['pork'],          NULL),
  ('food_251', 'Pao de hamburguer',            ARRAY['gluten','sesame','wheat'],       ARRAY['sesame'],        NULL),
  ('food_269', 'Pure de batata (preparado)',   ARRAY['milk'],                          ARRAY['milk'],          NULL),
  ('food_279', 'Massa de panqueca (simples)',  ARRAY['egg','gluten','milk','wheat'],   ARRAY['egg','milk'],    NULL),
  ('food_393', 'Creme de ricota',              ARRAY['milk'],                          ARRAY['milk'],          NULL),
  ('food_013', 'Granola tradicional',          ARRAY['gluten','nuts'],                 ARRAY['nuts'],          NULL),
  ('food_245', 'Pao de queijo',                ARRAY['egg','milk'],                    ARRAY['egg'],           NULL),
  ('food_262', 'Cuscuz marroquino (cozido)',   ARRAY['gluten','wheat'],                ARRAY['gluten','wheat'],NULL),
  ('food_345', 'Farinha de rosca',             ARRAY['gluten','wheat'],                ARRAY['gluten','wheat'],NULL),
  ('food_397', 'Tahine (Pasta de gergelim)',   ARRAY['sesame'],                        ARRAY['sesame'],        NULL),
  ('food_446', 'Nuggets vegetais',             ARRAY['gluten','soy','wheat'],          ARRAY['soy'],           NULL),
  ('food_458', 'Maionese vegana',              ARRAY['soy'],                           ARRAY['soy'],           NULL);

DO $$
DECLARE pendentes int;
BEGIN
  SELECT count(*) INTO pendentes FROM decisao_bloco4 WHERE decisao IS NULL;
  IF pendentes > 0 THEN
    RAISE EXCEPTION 'Bloco 4: % decisoes sem preencher', pendentes;
  END IF;
  IF (SELECT count(*) FROM decisao_bloco4 WHERE decisao NOT IN ('confirma_banco','analise_externa_certa')) > 0 THEN
    RAISE EXCEPTION 'Bloco 4: decisao invalida, use confirma_banco ou analise_externa_certa';
  END IF;
END $$;

-- delete-e-reinsere-por-decisao em vez de so delete condicional (mesmo
-- motivo do A1): reparte tokens_banco em [ficam] e [tokens_remover], apaga
-- so os tokens_banco (nunca mexe em outro token que o alimento tenha por
-- algum outro motivo) e reinsere so o subconjunto certo pra decisao atual.
-- Rodar de novo com decisao trocada sempre converge pro estado certo, nas
-- duas direcoes -- nao precisa reverter pelo backup antes de reaplicar.
DELETE FROM food_restriction_tags frt
USING decisao_bloco4 d
WHERE frt.food_id = d.food_id
  AND frt.token = ANY (d.tokens_banco);

INSERT INTO food_restriction_tags (food_id, token)
SELECT d.food_id, t
FROM decisao_bloco4 d
CROSS JOIN LATERAL unnest(
  CASE WHEN d.decisao = 'confirma_banco'
       THEN d.tokens_banco
       ELSE (SELECT array_agg(x) FROM unnest(d.tokens_banco) x WHERE x <> ALL (d.tokens_remover))
  END
) AS t
ON CONFLICT DO NOTHING;

-- allergen_review_status recalculado de forma deterministica a partir do
-- estado real de food_restriction_tags apos a mudanca acima, nao por um
-- SET condicional -- fica certo independente de quantas vezes rodar.
UPDATE foods f
SET allergen_review_status = CASE
  WHEN EXISTS (SELECT 1 FROM food_restriction_tags frt WHERE frt.food_id = f.food_id)
  THEN 'reviewed_has_allergens'
  ELSE 'reviewed_none'
END
FROM decisao_bloco4 d
WHERE f.food_id = d.food_id;

-- ---- A6. Reconciliacao -- meals.restriction_tags NAO e derivado ao vivo -----
-- de food_restriction_tags (confirmado em codigo: e coluna propria, populada
-- por carga anterior, lida direto pelo gerador em
-- ybytu-generate-meal-plan/index.ts:660). Sem este passo, A1/A3/A4/A5 mudam
-- food_restriction_tags mas o filtro do gerador continua enxergando o valor
-- antigo. Recalcula pra TODAS as refeicoes ativas a partir dos ingredientes.

UPDATE meals m
SET restriction_tags = COALESCE((
  SELECT array_agg(DISTINCT frt.token)
  FROM jsonb_array_elements(m.ingredients_json) elem
  JOIN food_restriction_tags frt ON frt.food_id = elem->>'id'
), '{}'::text[])
WHERE m.is_active = true;

COMMIT;

-- ---- C-A. VERIFICACAO POS-APLICACAO (nutricionista) -------------------------
-- Rodar depois do COMMIT da Secao A. Nao depende da Secao B.

-- C-A1. Quantos foods saíram de 'unreviewed'
SELECT
  (SELECT count(*) FROM foods_backup_20260904 WHERE allergen_review_status = 'unreviewed') AS unreviewed_antes,
  (SELECT count(*) FROM foods WHERE allergen_review_status = 'unreviewed') AS unreviewed_depois;

-- C-A2. Quantas refeicoes ativas deixaram de ter ingrediente unreviewed
--       (proxy de "destravou": antes tinha pelo menos 1 ingrediente ainda
--       unreviewed, depois nao tem nenhum)
WITH antes AS (
  SELECT m.meal_id
  FROM meals m
  JOIN LATERAL jsonb_array_elements(m.ingredients_json) elem ON true
  JOIN foods_backup_20260904 fb ON fb.food_id = elem->>'id'
  WHERE m.is_active = true AND fb.allergen_review_status = 'unreviewed'
  GROUP BY m.meal_id
),
depois AS (
  SELECT m.meal_id
  FROM meals m
  JOIN LATERAL jsonb_array_elements(m.ingredients_json) elem ON true
  JOIN foods f ON f.food_id = elem->>'id'
  WHERE m.is_active = true AND f.allergen_review_status = 'unreviewed'
  GROUP BY m.meal_id
)
SELECT
  (SELECT count(*) FROM antes) AS refeicoes_com_unreviewed_antes,
  (SELECT count(*) FROM depois) AS refeicoes_com_unreviewed_depois,
  (SELECT count(*) FROM antes WHERE meal_id NOT IN (SELECT meal_id FROM depois)) AS refeicoes_destravadas;

-- C-A3. Combinacoes preferencia alimentar x tipo de refeicao sem NENHUMA
--       refeicao ativa depois das mudancas (cobertura zerada) -- checa se
--       alguma remocao/adicao de restriction_tag esvaziou uma combinacao que
--       antes tinha opcao.
SELECT
  dp.dietary_preference_id,
  mt.meal_type_id,
  count(m.meal_id) FILTER (WHERE m.is_active) AS refeicoes_ativas
FROM dietary_preferences dp
CROSS JOIN meal_types mt
LEFT JOIN meals m
  ON m.dietary_preference = dp.dietary_preference_id
 AND m.meal_type = mt.meal_type_id
GROUP BY dp.dietary_preference_id, mt.meal_type_id
HAVING count(m.meal_id) FILTER (WHERE m.is_active) = 0
ORDER BY dp.dietary_preference_id, mt.meal_type_id;
-- linhas aqui = combinacao sem cobertura. Comparar contra
-- docs/PEDIDO_RECEITAS_NUTRICIONISTA_LACUNAS_COBERTURA_20260901.md pra ver
-- se e gap ja conhecido (nao mudou) ou novo (as mudancas de hoje pioraram).


-- ############################################################################
-- SECAO B -- PERSONAL (docs/SESSAO_1_PERSONAL_20260903.md)
-- Roda sozinha, independente da Secao A.
-- ############################################################################

BEGIN;

-- ---- B0. Backup --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercises_muscle_groups_backup_20260904 AS
SELECT exercise_id, muscle_groups_ids, now() AS backed_up_at
FROM exercises
WHERE exercise_id IN ('ex_050','ex_078','ex_079','ex_054','ex_083','ex_194','ex_216','ex_013','ex_285');

CREATE TABLE IF NOT EXISTS exercise_condition_proposals_backup_20260904 AS
SELECT id, exercise_id, condition_slug, tipo, status, rule_id, reviewed_at, reviewed_by, now() AS backed_up_at
FROM exercise_condition_proposals;

-- ---- B1. 7 casos de muscle_groups_ids errado --------------------------------
-- muscle_group_slugs: lista de muscle_group_id (texto, ex: 'hamstrings') que
-- deveria valer pra esse exercise_id. Os 5 primeiros ja vem pre-preenchidos
-- com o valor proposto no documento (copia incompleta, padrao claro) -- so
-- ajustar se o personal corrigir. Os 4 ultimos (ex_194/ex_216, ex_013/ex_285)
-- ficam NULL de proposito -- sao divergencia de opiniao, nao copy-paste.

CREATE TEMP TABLE decisao_muscle_groups (
  exercise_id text PRIMARY KEY,
  nome text,
  muscle_group_slugs text[]  -- <<< PREENCHER (NULL = nao mexer nesse exercise_id)
);

INSERT INTO decisao_muscle_groups (exercise_id, nome, muscle_group_slugs) VALUES
  ('ex_050', 'Cadeira flexora',                        ARRAY['hamstrings','glutes']),
  ('ex_078', 'Mesa flexora',                            ARRAY['hamstrings','glutes','core','stabilizers']),
  ('ex_079', 'Stiff com barra',                         ARRAY['glutes','hamstrings']),
  ('ex_054', 'Kettlebell swing',                        ARRAY['hamstrings','glutes','quadriceps','core']),
  ('ex_083', 'Deadlift com barra olimpica',             ARRAY['glutes','posterior_chain']),
  ('ex_194', 'Flexao de braco pegada fechada (opcao A)', NULL), -- <<< PREENCHER se necessario
  ('ex_216', 'Flexao de braco pegada fechada (opcao B)', NULL), -- <<< PREENCHER se necessario
  ('ex_013', 'Wall ball (opcao A)',                      NULL), -- <<< PREENCHER se necessario
  ('ex_285', 'Wall ball (opcao B)',                      NULL); -- <<< PREENCHER se necessario

-- sem guarda de "tudo preenchido" aqui de proposito: os 4 ultimos podem ficar
-- NULL legitimamente (personal pode confirmar o valor ja existente e nao
-- pedir mudanca nenhuma). So valida os slugs que FORAM preenchidos.

DO $$
DECLARE invalidos text;
BEGIN
  SELECT string_agg(d.exercise_id || ':' || bad.slug, ', ') INTO invalidos
  FROM decisao_muscle_groups d
  CROSS JOIN LATERAL unnest(d.muscle_group_slugs) AS bad(slug)
  WHERE d.muscle_group_slugs IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM muscle_groups mg WHERE mg.muscle_group_id = bad.slug);
  IF invalidos IS NOT NULL THEN
    RAISE EXCEPTION 'B1: slug(s) de muscle_group invalido(s) (nao existem em muscle_groups.muscle_group_id): %', invalidos;
  END IF;
END $$;

UPDATE exercises e
SET muscle_groups_ids = (
  SELECT array_agg(mg.id)
  FROM muscle_groups mg
  WHERE mg.muscle_group_id = ANY (d.muscle_group_slugs)
)
FROM decisao_muscle_groups d
WHERE e.exercise_id = d.exercise_id
  AND d.muscle_group_slugs IS NOT NULL;

-- ---- B2. 13 regras de caution/avoid -----------------------------------------
-- decisao: 'caution' (mantem como esta) ou 'avoid' (promove a exclusao).
-- Casamento por condition_slug + trecho do clinical_reason (nao ha rule_id
-- exato registrado no documento da sessao) -- a guarda abaixo verifica ANTES
-- do UPDATE que o numero de linhas afetadas bate com a coluna "Afeta" do
-- documento; se nao bater, aborta em vez de aplicar errado.

-- Correcao 2026-09-05: casamento por rule_id + condition_slug, nao mais por
-- trecho de clinical_reason. Dois motivos: (1) rule_id existe de verdade na
-- tabela e mapeia 1:1 com as 13 linhas (confirmado contra o banco -- ex:
-- ankle_pain+R2=19 linhas, ankle_pain+R3=16 linhas, bate exato com o "Afeta"
-- do documento); (2) casamento por texto quebraria se alguem usar o campo
-- novo_texto abaixo pra reescrever o clinical_reason -- a segunda vez que o
-- script rodasse, o ILIKE do texto antigo nao acharia mais a linha. rule_id
-- nao muda nunca, entao o script continua re-executavel depois de editar
-- texto.
CREATE TEMP TABLE decisao_cautions (
  linha int PRIMARY KEY,
  condition_slug text,
  rule_id text,            -- identificador estavel, nao muda mesmo se o texto mudar
  afeta_esperado int,      -- "Afeta" do documento, pra conferencia
  decisao text,            -- <<< PREENCHER: 'caution' ou 'avoid'
  novo_texto text          -- <<< PREENCHER SO SE ele pedir "Ajustar o texto do aviso"
                           --     nesta regra. Deixe NULL nas que ele so confirmar/promover.
);

INSERT INTO decisao_cautions (linha, condition_slug, rule_id, afeta_esperado, decisao, novo_texto) VALUES
  (1,  'ankle_pain',            'R2',  19, NULL, NULL),
  (2,  'ankle_pain',            'R3',  16, NULL, NULL),
  (3,  'elbow_pain',            'R5',  35, NULL, NULL),
  (4,  'groin_pain',            'R9',   8, NULL, NULL),
  (5,  'hamstring_injury',      'R8',  22, NULL, NULL),
  (6,  'hip_pain',              'R10', 17, NULL, NULL),
  (7,  'joint_problems_severe', 'R12', 40, NULL, NULL), -- comece por aqui, ver doc
  (8,  'knee_pain',             'R1',  15, NULL, NULL),
  (9,  'knee_pain',             'R2',  15, NULL, NULL),
  (10, 'lumbar_pain',           'R4',  30, NULL, NULL),
  (11, 'neck_pain',             'R7',  10, NULL, NULL),
  (12, 'pelvic_floor_issues',   'R11', 64, NULL, NULL),
  (13, 'wrist_pain',            'R6',  32, NULL, NULL);

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
-- -- agora por (condition_slug, rule_id), mesmo casamento estavel do UPDATE
-- abaixo. Serve pra pegar erro de digitacao no rule_id, nao mais pra validar
-- que o texto ainda existe (rule_id nao muda com edicao de texto).
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
-- linha desapareceria da view por completo (nao viraria avoid nem
-- continuaria caution -- sumiria), silenciosamente cancelando a regra
-- inteira pro gerador, seja qual fosse a decisao. reviewed_at/reviewed_by
-- continuam gravados como trilha de auditoria (rodar
-- "WHERE reviewed_at IS NOT NULL" pra achar o que ja foi revisado, nunca
-- comparar status pra isso).
UPDATE exercise_condition_proposals p
SET tipo = d.decisao,
    reviewed_at = now(),
    reviewed_by = 'personal_sessao1_20260904'
FROM decisao_cautions d
WHERE p.condition_slug = d.condition_slug
  AND p.rule_id = d.rule_id;

-- Texto novo, so onde ele pediu ajuste (novo_texto preenchido). Roda depois
-- do UPDATE acima, sem conflito -- e o mesmo casamento estavel.
UPDATE exercise_condition_proposals p
SET clinical_reason = d.novo_texto
FROM decisao_cautions d
WHERE p.condition_slug = d.condition_slug
  AND p.rule_id = d.rule_id
  AND d.novo_texto IS NOT NULL;

-- ---- B3. Rotulos das 7 opcoes novas de onboarding ---------------------------
-- NAO esta neste script. E docs/SQL_EXPANSAO_ONBOARDING_PHYSICAL_CONDITIONS_
-- 20260904.sql, ja pronto com os 7 INSERTs -- so precisa dos rotulos
-- confirmados (linha "Posterior de coxa" em disputa) pra rodar, e roda
-- independente deste aqui (tabela diferente, sem overlap).

COMMIT;

-- ---- C-B. VERIFICACAO POS-APLICACAO (personal) ------------------------------
-- Rodar depois do COMMIT da Secao B. Nao depende da Secao A.

-- C-B1. As promocoes pra 'avoid' esvaziam algum pool por nivel? Reaproveita a
--       logica que ja validou a linha 12 isolada no documento da sessao, mas
--       roda pra QUALQUER linha promovida, nao so a 12.
SELECT
  e.exercise_level_id,
  count(*) FILTER (WHERE ecp.tipo IS DISTINCT FROM 'avoid') AS exercicios_sobrando_pior_caso
FROM exercises e
LEFT JOIN exercise_effective_cautions ecp
  ON ecp.exercise_id = e.exercise_id AND ecp.tipo = 'avoid'
GROUP BY e.exercise_level_id
ORDER BY exercicios_sobrando_pior_caso ASC;
-- leitura: nivel com menor numero aqui e o mais restrito depois da sessao.
-- se algum vier 0, ha combinacao nivel-only sem exercicio -- cruzar com
-- ambiente/equipamento antes de alarmar (essa query nao filtra por isso,
-- e so o primeiro sinal).

-- C-B2. Quantas propostas de fato mudaram de caution pra avoid.
SELECT
  (SELECT count(*) FROM exercise_condition_proposals_backup_20260904 WHERE tipo = 'avoid') AS avoid_antes,
  (SELECT count(*) FROM exercise_condition_proposals WHERE tipo = 'avoid') AS avoid_depois;
