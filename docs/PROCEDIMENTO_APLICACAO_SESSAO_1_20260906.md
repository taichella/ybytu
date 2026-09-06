# Procedimento — aplicar as respostas da Sessão 1

Uma página, pra seguir quando a nutricionista e/ou o personal responderem. Não peça pra
implementação executar isso por você — é um script SQL que você preenche e roda (`npx supabase db
query --linked --file scripts/aplicacao_sessao1_20260904.sql`), ou peça pra rodar depois de
preenchido. As duas seções (A = nutricionista, B = personal) são transações independentes — se só
uma resposta chegou, rode só a seção dela.

## 0. Antes de começar

- Confirme que está rodando contra o banco linkado certo (`jwjfmvkfzelbdvyqetyb`), não local.
- Abra `scripts/aplicacao_sessao1_20260904.sql` — ele já tem a estrutura pronta, você só preenche
  os `VALUES` marcados `<<< PREENCHER`.
- Cada seção faz backup automático (`*_backup_20260904`) antes de mudar qualquer coisa — não
  precisa fazer backup manual.

## Passo 1 — Seção A (nutricionista), se a resposta dela chegou

1. Preencha os `VALUES` de cada bloco de decisão em Seção A com o que ela respondeu em
   `docs/SESSAO_1_NUTRICIONISTA_PARA_ENVIO_20260905.md` (57 decisões).
2. Rode a Seção A (`BEGIN` até o `COMMIT` dela). Se algum valor não bater com o que a guarda
   espera (token de alérgeno inválido, decisão vazia), o script para sozinho com `RAISE EXCEPTION`
   citando o `food_id` — corrija e rode de novo, é seguro repetir.
3. Rode a verificação **C-A** (logo depois do `COMMIT` da Seção A).

**O que checar em C-A:**
- **C-A1** (unreviewed antes/depois): o número depois deve ser menor que antes, na medida das
  decisões que reclassificaram alimentos. Se for igual, nada mudou — confira se preencheu direito.
- **C-A2** (refeições destravadas): quantas refeições ativas deixaram de ter ingrediente
  `unreviewed`. Número esperado, não crítico — é só visibilidade.
- **C-A3** (cobertura zerada): **se esta query devolver alguma linha**, uma combinação
  preferência-alimentar × tipo-de-refeição ficou sem nenhuma opção ativa depois das mudanças de
  hoje.
  - **O que fazer:** compare a linha contra `docs/PEDIDO_RECEITAS_NUTRICIONISTA_LACUNAS_COBERTURA_20260901.md`.
    - Se já é um gap conhecido lá (não mudou hoje): registre que continua, não é novidade, siga em
      frente.
    - Se é novo (não estava na lista antes): **pare antes de considerar a Seção A concluída** —
      volte pra nutricionista com a combinação específica, ela precisa saber que a decisão dela
      zerou uma opção pra algum aluno, antes de você seguir.

## Passo 2 — Seção B (personal), se a resposta dele chegou

1. Preencha `decisao_muscle_groups` (9 exercícios) com os slugs confirmados/corrigidos.
2. Preencha `decisao_cautions` (13 regras): `decisao` = `'caution'` (mantém) ou `'avoid'`
   (promove a exclusão).
   - **Se ele pedir "ajustar o texto do aviso" em alguma regra:** preencha também `novo_texto`
     nessa mesma linha, com o texto novo. Não precisa de passo separado — o script já aplica o
     texto novo automaticamente, só nas linhas onde `novo_texto` não ficou `NULL`. Confirme que a
     linha ficou registrada corretamente na verificação **C-B2** (ver abaixo) antes de considerar
     resolvido.
3. Rode a Seção B. As guardas conferem contagem contra o "Afeta" do documento antes de aplicar —
   se não bater, para sozinho citando a regra e o número esperado vs. real.
4. Rode as verificações **C-B1**, **C-B2**, **C-B3** (nesta ordem, todas depois do `COMMIT` da
   Seção B).

**O que checar em C-B1 (pool esvaziado por nível):**
- Se algum `exercise_level_id` aparecer com `exercicios_sobrando_pior_caso = 0`: **pare**. Isso
  significa que, no pior caso (aluno com todas as condições que geram exclusão), aquele nível
  ficou sem nenhum exercício seguro sobrando — o gerador cairia no "pula o slot" do
  [[project_silent_slot_degradation_finding]] pra qualquer aluno nessa situação. Antes de seguir,
  cruze manualmente com ambiente/equipamento (a query não filtra por isso, é só o primeiro sinal)
  — pode ser um falso alarme (o nível ainda tem opção quando combinado com equipamento certo) ou
  pode ser real. Se for real, volte pro personal: ele precisa saber que a promoção dele esvaziou
  um nível antes de você deixar como está.

**O que checar em C-B2 (contagem antes/depois de avoid):** deve bater com o número de regras que
o personal marcou `'avoid'`. Serve só de conferência — se não bater, algo no preenchimento saiu
errado, revise `decisao_cautions` antes de seguir.

**O que checar em C-B3 (alunos já expostos) — o mais importante:**
- **Se a lista vier vazia:** ninguém está com o plano ativo contendo um exercício que virou
  exclusão hoje. Nada a fazer, siga em frente.
- **Se vier com QUALQUER linha:** **pare tudo antes do próximo passo deste procedimento.** Isso
  significa um aluno tem, no plano ativo dele agora, um exercício que o personal acabou de
  classificar como contraindicado pra condição que esse aluno declarou. A decisão de produto já
  registrada no script (2026-09-05) é: **este script não troca nada sozinho** — trocar
  automaticamente seria o mesmo erro do fallback alfabético do gerador
  ([[project_silent_slot_degradation_finding]]), decisão clínica virando decisão de código. Mande
  a lista pro personal exatamente como ela sai (aluno, condição, exercício, dia, regra — já
  formatada pra ele ler sem SQL) e espere a decisão dele caso a caso antes de continuar qualquer
  outra coisa, incluindo convidar novos alunos piloto.

## Passo 3 — B3 (rótulos das 7 opções novas de onboarding), independente do resto

Não está no script principal. É `docs/SQL_EXPANSAO_ONBOARDING_PHYSICAL_CONDITIONS_20260904.sql`,
já pronto com os 7 `INSERT`s — só precisa dos rótulos confirmados pelo personal (a linha
"Posterior de coxa" estava em disputa, confirme o texto final antes de rodar). Sem overlap de
tabela com a Seção B, pode rodar em qualquer ordem em relação a ela.

## Se as duas seções já rodaram e nada nas verificações travou

Tecnicamente pronto para convidar o primeiro aluno piloto real (ver
[[project_e2e_test_account_policy]] — não usar sua conta pessoal pra isso). Antes de convidar,
role o `docs/ROTEIRO_TESTE_E2E_20260903.md` uma vez com uma conta de teste descartável pra
confirmar que o fluxo ponta-a-ponta ainda funciona depois das mudanças de hoje — o script muda
dados que o gerador lê (`exercise_condition_proposals`, `food_restriction_tags`), vale confirmar
com um plano gerado de verdade, não só com as queries de verificação.

## Se algo travar e você não tiver certeza do que fazer

Toda seção roda dentro de `BEGIN...COMMIT` — se parou antes do `COMMIT` (por uma guarda ou por
você interromper), nada foi alterado, pode fechar e voltar depois sem risco. Se já passou do
`COMMIT` e algo pareceu errado só depois, os backups (`foods_backup_20260904`,
`food_restriction_tags_backup_20260904`, `exercises_muscle_groups_backup_20260904`,
`exercise_condition_proposals_backup_20260904`) têm o estado de antes — não reverta na mão, volte
com essa dúvida específica antes de tentar consertar.
