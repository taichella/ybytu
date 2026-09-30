# Pós-piloto

Itens conscientemente adiados pra depois do piloto — não são bugs esquecidos,
são decisões de escopo registradas aqui pra não se perderem.

## Templates de e-mail (emails/) — revisão contra dado fabricado antes de ligar

9 dos 10 templates criados pelo Antigravity (`emails/01,02,04-10`, ver
`emails/README.md`) ainda não estão ligados a nenhuma function — são só design.
**Antes de ligar qualquer um deles**, repita a revisão que foi feita no `03`
(`03-plano-em-preparacao.html`, achado 2026-09-17): ele tinha uma barra de
progresso com percentual fixo ("Em andamento 65%") e um checklist ✓/⏳/○ que
não vinha de estado real nenhum — igual pra todo mundo, sempre. Mesmo padrão
de `docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md`. Foi removido e
substituído por uma lista de próximos passos sem estado nem percentual.

Checklist por template antes de ligar a uma function:
- [ ] Todo número/percentual/data visível tem uma variável real por trás, ou é texto fixo do design copiado sem revisão?
- [ ] Toda variável `{{ }}` do template tem uma coluna/consulta real de onde vir hoje? Se não tiver dado, a function deve recusar o envio e logar — nunca mandar `{{ variavel }}` literal pro destinatário (regra já aplicada no `03`, ver `ybytu-send-onboarding-email/index.ts`).
- [ ] Todo link/botão aponta pra uma URL que existe de verdade no produto? (`03` tinha um `{{ tracking_link }}` pra uma área logada que nunca existiu — removido.)
- [ ] O template foi embutido como string no `index.ts` da function (não lido do disco em runtime — `Deno.readTextFile` de asset bundlado deu 500 em produção, 2026-09-17), com um `scripts/check-<function>-templates.sh` no padrão de `scripts/check-email-templates.sh` chamado por `scripts/deploy-functions.sh`?

Templates pendentes dessa revisão: `01-confirmacao-conta`, `02-boas-vindas`,
`04-entrega-do-plano`, `05-desafio-15-dias`, `06-esqueci-senha`,
`07-senha-atualizada`, `08-convite-profissional`, `09-plano-aluno-a-validar`,
`10-plano-aluno-validado`.

## Dashboard (apps/ybytu-dashboard) — achados da revisão Antigravity 2026-09-17

Relatório completo salvo em `docs/REVISAO_ANTIGRAVITY_DASHBOARD_20260917.md`.
Itens já corrigidos nesta rodada (Login.jsx, UserPlan.jsx, UserDetail.jsx,
Users.jsx, UserPlanPage.jsx, apiClient.js, FailedPlans.jsx, App.jsx) não estão
listados aqui. Itens adiados pra pós-piloto:

- **`meta.cycle_days` é uma constante fixa, não dado do aluno** —
  `CYCLE_DAYS = 15` em `supabase/functions/_shared/buildPlanPayload.ts` ("não
  há campo de duração de desafio no schema"). O eyebrow "Desafio X dias" foi
  removido do topo do `UserPlan.jsx` pro piloto (sempre seria "15" pra todo
  mundo, indistinguível de dado real). Se um dia existir duração de
  desafio/ciclo real por aluno, esse é o lugar a mudar — e o eyebrow pode
  voltar.
- **Não existe modelo de atribuição staff↔aluno** — `ybytu-get-plan-for-staff`
  (`resolveStaffFromRequest`) deixa qualquer staff ativo (personal, nutri ou
  admin) ver o plano de qualquer aluno, sem checar se aquele profissional é o
  responsável por aquele aluno especificamente. Não é um bug de código — é a
  ausência de um conceito no schema (não há tabela de atribuição
  staff→aluno). Registrar aqui em vez de construir agora: exige decisão de
  produto (como atribuições são criadas? manual? automática por
  disponibilidade?) antes de qualquer RLS/checagem de posse fazer sentido.
- **`Dashboard.jsx`: 6 cards reais vs. 5 skeletons de loading** — `cards`
  (linha ~56) tem 6 itens, o skeleton (`Array.from({ length: 5 })`, linha
  ~210) mostra 5 blocos enquanto carrega. Puramente visual (pisca de 5→6 ao
  terminar o carregamento), baixa severidade.
- **`UserPlan.jsx` recebe props que não usa / `UserDetail.jsx` usa
  `useContext(StaffContext)` direto** — o padrão já estabelecido no projeto é
  o hook `useStaff()` (`src/lib/staffContextCore.js`). Não bloqueia nada hoje
  (o contexto exportado é compatível), é debt de consistência.
- **`tabStyle` em `UserDetail.jsx`** — função inline recriada a cada render;
  sem impacto de performance perceptível no tamanho de dado atual, mas vale
  memoizar numa limpeza futura.

## Catálogo de exercícios — 19 pares duplicados por nome (fusão com o personal)

Achado 2026-09-19 (caso aluna de teste GN): o catálogo tem **19 pares de exercícios com o mesmo nome e exercise_id diferente**. O par ex_194/ex_216 ("Flexão de braço com pegada fechada") caiu duas vezes no mesmo dia de um plano ativo. Causa raiz e correção provisória estão em `supabase/functions/ybytu-generate-training-plan/exerciseNames.ts`: o gerador **colapsa o pool por nome, mantendo o menor exercise_id** e unindo os músculos do par. Isso protege planos NOVOS; a fusão definitiva no catálogo continua pendente e depende do personal.

**O que o personal precisa decidir, par a par:** (1) é mesmo o mesmo movimento? (2) qual registro sobrevive (o gerador hoje mantém o de menor id); (3) qual texto de instrução/vídeo/músculos/nível vale, principalmente onde a coluna "difere em" não está vazia. Depois da decisão: reapontar `training_plan_exercises.exercise_id` do registro descartado para o mantido e remover o descartado.

**Atenção ao nível:** em 4 pares o nível difere (cadeira flexora, mesa flexora, stiff com barra, supino declinado com barra). O colapso mantém o menor id independentemente do nível; se o personal decidir que são exercícios de níveis diferentes, o par não é duplicata e a regra do gerador precisa de exceção.

| Exercício | ids (A / B) | Difere em | Usos em planos (A / B) | Músculos A | Músculos B |
|---|---|---|---|---|---|
| Agachamento isométrico (cadeirinha) | ex_018 / ex_058 | — | 28 / 0 | core, glutes, hamstrings, quadriceps | core, glutes, hamstrings, quadriceps |
| Agachamento livre | ex_001 / ex_045 | vídeo | 181 / 1 | core, glutes, hamstrings, quadriceps | core, glutes, hamstrings, quadriceps |
| Avanço com halteres | ex_026 / ex_048 | vídeo | 0 / 0 | core, glutes, hamstrings, quadriceps | core, glutes, hamstrings, quadriceps |
| Bird dog | ex_137 / ex_236 | músculos, equipamento, vídeo | 0 / 5 | core, erector_spinae, glutes, stabilizers | core, erector_spinae, glutes |
| Cadeira flexora | ex_050 / ex_081 | nível | 0 / 0 | glutes, hamstrings | glutes, hamstrings |
| Deadlift com barra olímpica | ex_055 / ex_083 | — | 0 / 0 | glutes, posterior_chain | glutes, posterior_chain |
| Face pull com elástico | ex_166 / ex_255 | vídeo | 1 / 0 | deltoids, rhomboids, trapezius | deltoids, rhomboids, trapezius |
| Flexão de braço com pegada fechada | ex_194 / ex_216 | — | 57 / 5 | biceps_brachii, chest, core, deltoids, triceps_brachii | biceps_brachii, chest, core, deltoids, triceps_brachii |
| Good morning com peso corporal | ex_074 / ex_237 | músculos | 0 / 11 | core, glutes, hamstrings | back, erector_spinae, glutes, hamstrings |
| Kettlebell swing | ex_054 / ex_082 | — | 0 / 2 | core, glutes, hamstrings, quadriceps | core, glutes, hamstrings, quadriceps |
| Mesa flexora | ex_078 / ex_087 | nível | 10 / 58 | core, glutes, hamstrings, stabilizers | core, glutes, hamstrings, stabilizers |
| Prancha com miniband | ex_110 / ex_140 | — | 1 / 0 | core, erector_spinae, glutes, rectus_abdominis | core, erector_spinae, glutes, rectus_abdominis |
| Prancha frontal | ex_107 / ex_135 | — | 27 / 2 | core, erector_spinae, glutes, rectus_abdominis | core, erector_spinae, glutes, rectus_abdominis |
| Prancha lateral | ex_108 / ex_136 | — | 0 / 1 | core, glutes, obliques | core, glutes, obliques |
| Pular corda | ex_103 / ex_267 | músculos | 0 / 1 | calves, core, hamstrings | calves, core, deltoids, full_body |
| Stiff com barra | ex_071 / ex_079 | nível | 0 / 2 | glutes, hamstrings | glutes, hamstrings |
| Stiff com halteres | ex_066 / ex_075 | músculos | 0 / 0 | glutes, hamstrings | core, erector_spinae, glutes, hamstrings |
| Supino declinado com barra | ex_184 / ex_191 | nível | 0 / 0 | deltoids, pectoralis_major, triceps_brachii | deltoids, pectoralis_major, triceps_brachii |
| Wall ball | ex_013 / ex_285 | vídeo | 0 / 0 | full_body | full_body |

"Usos" = linhas em `training_plan_exercises` (todos os planos, inclusive moldes e planos inativos). Levantamento por consulta ao banco em 2026-09-19; as colunas "músculos" mostram só o que está cadastrado, sem julgar qual está certo.

### Pares com **cautelas/avoid divergentes** (segurança — o personal precisa reconciliar)

Em **8 dos 19 pares** os dois registros do mesmo movimento têm flags de segurança diferentes em `exercise_effective_cautions` (medido em 2026-09-19). O mesmo movimento não pode ser seguro num cadastro e contraindicado no outro; um dos dois está errado.

| Exercício | ids (A / B) | Só em A | Só em B |
|---|---|---|---|
| Bird dog | ex_137 / ex_236 | avoid pregnancy + 6 cautelas | — |
| Cadeira flexora | ex_050 / ex_081 | — | caution hamstring_injury |
| Deadlift com barra olímpica | ex_055 / ex_083 | avoid pregnancy + 8 cautelas | — |
| Pular corda | ex_103 / ex_267 | — | avoid pregnancy + 8 cautelas |
| Stiff com barra | ex_071 / ex_079 | caution hamstring_injury | — |
| Stiff com halteres | ex_066 / ex_075 | caution knee_pain | — |
| Supino declinado com barra | ex_184 / ex_191 | avoid pregnancy + 9 cautelas | — |
| Wall ball | ex_013 / ex_285 | — | avoid pregnancy + 5 cautelas |

Como o gerador se comporta enquanto isso (`exerciseNames.ts`): o `avoid` continua sendo aplicado **antes** do colapso, registro a registro (comportamento inalterado); entre duplicatas que sobraram seguras, o colapso mantém a que tem **mais cautelas para as condições do aluno** e só desempata pelo menor id. Não cria segurança nova: não corrige um `avoid` que falta num dos registros (ex.: gestante ainda pode receber o registro sem `avoid pregnancy` de Pular corda ou Wall ball). Só a fusão com decisão do personal fecha isso.

## Classificação clínica de condições de saúde por especialidade (Personal vs Nutricionista)

Registrado em 2026-09-19: no componente `UserLimitationsList.jsx` (cards de parecer em `UserDetail.jsx`), as condições de saúde declaradas pelo aluno no onboarding são separadas entre Treino e Nutrição por UUID da tabela `health_conditions`.
Por decisão de precaução clínica, as seguintes condições foram classificadas provisoriamente e aguardam validação técnica com os respectivos profissionais (especialmente com a nutricionista):

- **Ansiedade** (`ba4bd85c-6569-40ac-a467-d94f19eb8e1d` / `anxiety`): Provisoriamente em `['training', 'nutrition']`. Medicações psicotrópicas / ansiolíticos frequentemente interferem no apetite, metabolismo basal e peso corporal. A nutricionista deve avaliar se deseja manter visível em seu card ou se deve ser restrita ao treino.
- **Depressão** (`ba1eb16d-6a89-40e3-8f61-071cfd7bf2a9` / `depression`): Provisoriamente em `['training', 'nutrition']`. Semelhante à ansiedade, fármacos antidepressivos têm impacto clínico direto em apetite, motilidade gastrointestinal e oscilação ponderal. Requer validação da nutricionista.
- **Asma** (`10a8b1c6-3602-481b-923b-0cf6277b9bea` / `asthma`): Atualmente em `['training']`. Requer confirmação se a nutricionista precisa visualizar casos de asma (ex.: interação de sulfitos/aditivos ou broncoespasmo induzido por refluxo/alimentos).
- **Problemas de Equilíbrio** (`b805a72f-d11c-41a8-8b03-b4e4ebf8983b` / `balance_issues`): Atualmente em `['training']`. Requer confirmação da nutricionista se há relevância metabólica/vestibular (ex.: labirintopatias associadas a sódio/cafeína/glicemia).

## Ambiente "Ar livre" (outdoors) — DESATIVADO, não removido (2026-09-25)

A opção saiu do onboarding mas continua na tabela e no código, pronta pra voltar.
Migration `supabase/migrations/20260925120000_exercise_environment_is_active.sql`.

- `exercise_environment.is_active` (boolean, default true); `outdoors` = false. Nenhum DELETE.
  No momento da desativação: 0 perfis e 0 `training_plans` usavam `outdoors`.
- Os dois onboardings (widget `OnboardingPreLaunch.html` e `ybytu-app` `Onboarding.js`) leem a
  tabela com a chave pública: a policy única `exercise_environment_read_active` (anon +
  authenticated, `USING (is_active)`) esconde a linha inativa — nenhum dos dois precisou de
  mudança de código. As functions (service_role) continuam enxergando a linha: o rótulo de um
  perfil antigo ainda aparece e o construtor de treino só mostra `outdoors` no seletor de
  ambiente se um molde já o tiver marcado.
- Gerador (`ybytu-generate-training-plan`): perfil com ambiente **inativo**, **inexistente** ou
  **nulo** não gera plano — grava `plan_generation_status='failed'` com a causa em
  `plan_generation_error` (`environment_inactive` / `environment_not_found` /
  `environment_missing`). Antes disso os três casos caíam em silêncio em
  `home_no_equipment` (plano de peso corporal pra quem treina na academia).
- A regra de equipamento de `outdoors` (= peso do corpo, igual a casa sem equipamento)
  continua em `supabase/functions/_shared/exerciseEnvironment.ts`.

**Reativar** (sem deploy):
```sql
UPDATE exercise_environment SET is_active = true WHERE exercise_environment_id = 'outdoors';
```
Se reativar, decidir também se a tag de ambiente do card de exercícios deve mostrar
"Ar livre": hoje `CARD_ENVIRONMENTS` (mesmo arquivo) lista só os 3 ambientes ativos.

## `environment_tag` / `environment_label_ptbr` em ybytu-admin-exercises — remover

Desde 2026-09-25 as telas (Exercícios lista/grade e card de inserir do construtor) usam
`environments` / `environments_label_ptbr` (todos os ambientes em que o exercício cabe). Os
campos antigos de tag única ficaram na resposta só por compatibilidade; **nenhuma tela os lê**
(conferido por busca em `apps/ybytu-dashboard/src` e `apps/ybytu-app/src`). Remover de
`withEnvironmentTag` (e `environmentTagForEquipment` / `ENVIRONMENT_TAG_LABEL_PTBR` de
`_shared/exerciseEnvironment.ts`, se nada mais os usar) depois do piloto.

## Dashboard — dívidas da revisão somente-leitura de 2026-09-25

Achados do revisor (leitura de código) deixados conscientemente pra depois do piloto:

- **Props órfãs de `UserPlan.jsx`**: `editable` e `onSaveLoads` não são passadas por nenhum
  chamador (`UserPlanPage.jsx`, `SharedPlan.jsx`) — o botão "Salvar cargas", os inputs de carga
  e `handleSaveLoads` nunca aparecem. Edição de carga hoje é só pelo construtor
  (`TrainingPlanCreator`). Em 2026-09-25 `handleSaveLoads` ganhou mensagem de erro visível
  (antes só mudava estado interno), mas o caminho inteiro deve ser removido — ou religado de
  propósito — depois do piloto.
- **Duplicação de helpers**: `COVER_GRADIENTS` em `MealPlans.jsx` e `Trainings.jsx`;
  `GOAL_LABELS` em `UserDetail.jsx` e `UserPlan.jsx`; `initials()` em `Account.jsx`,
  `ExerciseThumb.jsx`, `More.jsx`, `Sidebar.jsx`, `UserPlan.jsx` (+ variantes inline em
  `UserDetail.jsx` e `Users.jsx`). Mover pra `src/lib/`.
- **Botões fixos em 360px**: a toolbar do documento (`UserPlan.jsx`, `.toolbar` position:fixed
  no canto superior direito) e o "Voltar" de `UserPlanPage.jsx` (fixed, canto superior esquerdo)
  podem cobrir o topo do documento em telas estreitas; revisar posição/empilhamento.
- **Usuários — controles escondidos pra religar**: os 4 filtros (assinatura, objetivo,
  onboarding, adesão) e os botões Exportar/Convidar foram escondidos em 2026-09-25 porque não
  faziam nada. Assinatura, objetivo e onboarding são filtráveis com dado que a lista já tem;
  adesão depende de rastreio de treino/refeição concluído, que não existe.

## PDF: ramo de 4 polegadas do `handlePrint` é código morto — remover (2026-09-25)

`UserPlan.jsx` `handlePrint()` injeta, em tela ≤680px, `@page { size: 4in 11in; margin: 0.25in }`
+ `.doc { zoom: 1.25 }` num `<style>` no `<head>`. O `@page { size:letter; margin:0 }` do próprio
componente vem depois (no `<style>` dentro do `<body>`) e vence: o PDF do celular sai **Letter**
(medido: MediaBox 612×792 pt). Só o `zoom: 1.25` tem efeito. Resultado medido no PDF real:
todas as colunas legíveis (96/96 células, fonte efetiva 15,6px no celular, 12,5px no computador).

**Não ativar** esse ramo sem refazer o documento: forçando a página de 4in (style no fim do
body), a tabela de exercícios perde Reps/Descanso e a seção de refeições também corta
(Calorias, legenda de macros). Remover o `@page` de 4in do `handlePrint` e decidir se o
`zoom: 1.25` no celular fica (hoje ajuda a legibilidade).

## Duração do plano e campanha "Desafio 15 dias" (2026-09-25)

- `CAMPAIGN_CYCLE_DAYS = 15` (`_shared/buildPlanPayload.ts`, antes `CYCLE_DAYS`) é a duração da
  **campanha**, não do plano. Não existe campo de duração em `training_plans`/`meal_plans`
  (só dias por semana e minutos por sessão). O documento agora diz "Calendário da campanha
  Desafio 15 dias". **Pré-requisito pra qualquer plano fora da campanha** (mensal, pós-piloto):
  criar um campo real de duração e o calendário ler dele — senão o 15 vira dado fabricado.
- **Link do plano vale 90 dias** (`plan_share_tokens.expires_at`), a campanha 15: depois do dia
  15 o aluno vê um calendário vencido. Decidir o que a página mostra quando a campanha termina
  (esconder o calendário, mostrar "campanha encerrada", renovar ciclo...).

## Rate limit nos endpoints públicos — não existe (2026-09-25)

Nenhuma function existente limita requisições por IP, usuário ou token. As únicas com limite são
as novas de OTP do app do aluno (`ybytu-auth-request-otp` / `-verify-otp`, ainda não deployadas).
Por prioridade:

1. **Link do plano** (`ybytu-get-plan-payload`, `/plano/<token>`): autentica só pelo token na URL.
   Adivinhar token não é o risco (43 caracteres aleatórios), e sim abuso: cada chamada monta o
   payload inteiro (várias consultas) e grava `last_accessed_at` — dá pra martelar o banco com
   um único link vazado. Limitar por token e por IP; considerar cache curto do payload.
2. **Geração de plano** (`ybytu-onboarding-complete`, `ybytu-generate-training-plan`,
   `ybytu-generate-meal-plan`, `verify_jwt=false` + JWT conferido no código): qualquer usuário
   logado dispara geração com IA (custo por chamada, Groq) quantas vezes quiser. Limitar por
   usuário (ex.: N gerações/dia) — e signup aberto significa que "usuário logado" é qualquer um.
3. **`ybytu-notify-plan-ready` / `ybytu-send-user-whatsapp`**: aceitam usuário logado ou chamada
   interna; envio de WhatsApp tem custo e reputação do número — limitar por destinatário.
4. **`whatsapp-webhook`**: POST já exige assinatura HMAC (`WHATSAPP_APP_SECRET`); rate limit aqui
   é defesa em profundidade, prioridade menor.

## Histórico do git: limpeza opcional depois de tornar o repositório privado

O repositório foi público de 2026-07-01 a (data em que for privado). O histórico ainda contém:
o token antigo de verificação do webhook do WhatsApp (commit `201f30ca` — **rotacionado em
<data da rotação>**, então o valor antigo não vale mais), dados pessoais removidos dos arquivos
atuais em 2026-09-25 (telefone, e-mails, nomes, UUIDs de conta) e `apps/ybytu-app/node_modules`
(commit `07c0f61b`, removido do versionamento em `b09016a6`; o pack tem ~150 MB por causa dele).
**Opcional**, só depois de privado: `git filter-repo` pra reescrever o histórico. É destrutivo —
muda todos os hashes de commit, exige force-push e que toda cópia (inclusive a de outros agentes)
seja clonada de novo; tags e referências a commits em docs (ex.: `201f30ca`) ficam inválidas.
Privar sozinho não apaga o que já foi público (caches/arquivos externos), por isso a rotação do
token vem antes e não depende desta limpeza.

## Trabalho não commitado não tem rede de proteção (2026-09-27)

O worktree é compartilhado entre agentes e a Taina. Em 2026-09-26/27 o agente do app do aluno renomeou `student` →
`user` e apagou com `Remove-Item` as pastas antigas (`apps/ybytu-student-pwa`, `supabase/functions/ybytu-get-student-plan`,
`scripts/check-student-pwa-sync.mjs`, `apps/ybytu-dashboard/src/components/student`). Nada se perdeu porque as versões
novas existiam — mas nenhuma daquelas pastas tinha **um único commit** (conferido em todas as branches): se o conteúdo
novo estivesse errado, não haveria como recuperar o antigo pelo git. `git checkout`/`Remove-Item`/`git clean` sobre
arquivo nunca commitado é irreversível.

Regras que valem pra qualquer agente neste repo:
- Commitar (mesmo em branch própria, mesmo "WIP") antes de qualquer remoção, renomeação em massa ou `git checkout`
  de arquivo — o commit é a rede; a branch pode ser descartada depois.
- Antes de `git checkout -- <arquivo>` ou `git clean`, rodar `git status` e avisar quem mais pode ter mudanças ali
  (foi o caso do `App.jsx` em 2026-09-25: confirmado antes que não havia trabalho não commitado de outro agente).
- Commit sempre com caminho explícito (`git commit -- <arquivos>`): no worktree compartilhado, `git commit -a`
  ou sem caminho leva mudança de outro agente junto (já aconteceu em 2026-09-19).

## Secrets obsoletos no Supabase (investigado 2026-09-27, nada removido)

- `SALVY_API_KEY`: nenhuma referência no código (functions de produção = git, conferido por `check-stale-deploys`).
  Obsoleto desde a migração pra Meta Cloud API. Pode ser removido.
- `GEMINI_API_KEY`: nenhuma referência no código — só comentários históricos da migração pra Groq (2026-08-27).
  Pode ser removido; revogar também a chave no Google AI Studio.
- `STAFF_PHONE_DEDUPE_DISABLED`: valor atual `false` (conferido pelo digest, sem ler o secret). O código só desliga o
  dedupe com `'true'` exato, então hoje o dedupe está ativo: `PHONE_ADMIN_TRAINER` e `PHONE_ADMIN_NUTRI` são o mesmo
  número, e o profissional recebe 1 mensagem por aluno (não 2). Remover o secret não muda nada (ausente = dedupe
  ligado). O toggle e o comentário em `ybytu-notify-plan-ready` podem sair quando entrar a nutri real, com número próprio.

## CORS: tirar as origens antigas depois da virada do onboarding (2026-09-27)

Em 2026-09-27 entraram `https://onboarding.ybytu.app` (onboarding saindo do WordPress, `apps/ybytu-onboarding`) e
`https://me.ybytu.app` (PWA do aluno) em `ALLOWED_ORIGINS` (`supabase/functions/_shared/cors.ts`). Só commit, sem
deploy geral: cada function pega a lista nova no próprio deploy (as 4 de onboarding quando o projeto novo for testado
no domínio; as 3 do PWA na entrega do PWA). Redeployar as ~30 de uma vez foi descartado — o deploy manda o disco
local, e qualquer diferença entre produção e `main` iria junto sem ninguém ver.

Depois da virada (widget do WordPress desligado), num commit à parte:
- tirar `https://ybytu.app` e `https://www.ybytu.app` (origem do widget congelado);
- tirar `https://dashboard.ybytu.app` (o painel já está em `pro.ybytu.app`; o próprio `cors.ts` já dizia que sai).
Antes de remover, conferir que nada ainda chama as functions dessas origens (logs das functions / Referer).

## Recuperação de senha do aluno não existe (2026-09-27)

O onboarding cria a conta com uma senha aleatória (`crypto.randomUUID()`), que não é guardada nem mostrada: **o aluno
nunca soube a senha**. A rota `/reset-password` existe, mas só no painel dos profissionais (`pro.ybytu.app`,
`ForgotPassword.jsx` → `redirectTo: ${origin}/reset-password`): é o fluxo do staff, e um aluno que caísse ali acabaria
no painel. Não há entrada de recuperação no onboarding nem no app do aluno, então hoje o aluno não tem nenhum caminho
próprio pra entrar na conta. Isso não afeta o piloto (o plano chega por link com token,
`/plano/<token>`, sem login), mas precisa estar resolvido antes de qualquer tela que exija login do aluno — o PWA em
`me.ybytu.app` usa OTP por e-mail (`ybytu-auth-request-otp` / `-verify-otp`), o que pode tornar a senha desnecessária;
decidir se o reset de senha ainda faz sentido ou se o login do aluno fica só por OTP. Na mesma decisão, revisar
Auth → URL Configuration (Site URL / Redirect URLs) para os domínios novos (`onboarding.ybytu.app`, `me.ybytu.app`),
sem tirar `https://pro.ybytu.app/reset-password` (o reset do staff depende dela).

## Regra do check-stale-deploys: reconhecimento de `_shared/` não é atalho (2026-09-27)

O `scripts/stale-shared-ack.txt` reconhece mudança em `_shared/` **por arquivo e por hash do conteúdo** — nunca por nome
de function nem "todo `_shared/`". Mudança em `_shared/` sem deploy continua sendo aviso real (Caso 9: `buildPlanPayload.ts`
sem deploy do `get-plan-payload` = produção rodando versão velha): só reconhecer mudança comprovadamente inofensiva, com o
motivo escrito e `except=` pras functions que precisam do deploy. Se o ruído incomodar, a resposta é deployar, não afrouxar
a regra. Detalhes no README (seção do check) e no cabeçalho do próprio arquivo.

## Chaves de API do Supabase: as antigas (`anon` / `service_role`) saem até o fim de 2026 (investigado 2026-09-30, nada trocado)

A Supabase marca as chaves JWT antigas como "Deprecated". A documentação diz "by the end of 2026"; o cronograma público
(discussion #29260) diz "Late 2026, TBC — your app will break". **Não há dia marcado**; conferir a data no painel
(Settings → API Keys) e nos e-mails mensais de aviso.

Estado medido (somente leitura, sem ler nenhuma chave secreta):

- Chaves antigas **ainda ligadas**: a `anon` JWT (emitida 2026-03-19) responde 200 na API.
- Existe **1 chave publishable** (`default`) e pelo menos 1 chave secret (`SUPABASE_SECRET_KEYS` existe no runtime).
- **O que é público já usa a chave nova**: dashboard, onboarding, PWA (bundles publicados conferidos) e o widget do
  WordPress (`apps/OnboardingPreLaunch.html`). Único lugar com a `anon` antiga: `apps/ybytu-app/src/lib/supabase.js`
  (app pós-piloto, fixa no código).
- **Functions**: 33 functions + `_shared` leem `SUPABASE_SERVICE_ROLE_KEY`; 1 lê `SUPABASE_ANON_KEY`
  (`ybytu-auth-verify-otp`). No runtime deste projeto, `SUPABASE_ANON_KEY` **já é a chave publishable** (digest do
  secret = sha256 da publishable), ao contrário do que a documentação diz. `SUPABASE_SERVICE_ROLE_KEY` **também já é
  a chave secret nova** (`default`) — **provado em 2026-09-30** por comparação de hash (digest do secret = sha256 da
  secret nova: verdadeiro; = sha256 da `service_role` JWT antiga: falso), imprimindo só verdadeiro/falso, sem exibir
  nem gravar valor. Nenhuma function depende da `service_role` antiga.
- Fora das functions nada depende da chave de serviço: os 2 crons que chamam functions usam o
  `INTERNAL_FUNCTION_SECRET` (vault), o backup do GitHub usa `SUPABASE_DB_URL`, não há database webhooks.

Ordem segura quando for fazer:

1. ~~Provar o formato de `SUPABASE_SERVICE_ROLE_KEY` no runtime~~ — **feito em 2026-09-30: é a secret nova**, então
   não é preciso trocar o código das functions para ler `SUPABASE_SECRET_KEYS`.
2. Tirar a `anon` antiga de `apps/ybytu-app` (ou confirmar que o app não está publicado).
3. No painel, conferir "last used" das chaves antigas; se zerado, **desativar** as antigas (é reversível: dá para
   religar na hora se algo quebrar). Testar login de staff, login do aluno por código, onboarding e um cron.
4. Só depois disso fazer a rotação da chave secret que está pendente (criar uma nova, confirmar que o runtime das
   functions passou a usar a nova, apagar a velha). Desativar as antigas já invalida a `service_role` JWT.

## Mesmo telefone em mais de um perfil: decidir antes de abrir para aluno real (medido 2026-09-30, nada implementado)

Estado medido (somente leitura):

- **Nada impede** o mesmo `profiles.whatsapp_phone` em vários perfis: não há índice único, constraint nem trigger sobre
  a coluna, e nem o onboarding nem as functions conferem se o número já existe. A única unicidade é a do e-mail
  (`auth.users`); `auth.users.phone` não é usado (0 linhas preenchidas).
- Hoje: 4 perfis, 2 telefones distintos, **os 2 aparecem em 2 perfis cada** (contas de teste da Taina, de propósito —
  é o único jeito de testar com um número só). **Não bloquear nem apagar durante o piloto.**
- Login por WhatsApp (`find_user_by_identifier` + busca de reserva em `ybytu-auth-request-otp` / `-verify-otp`): com
  telefone repetido, entra **no perfil mais recente** (`ORDER BY created_at DESC`, commit `930145c1`). Isso é atalho de
  teste: com aluno real, o perfil mais antigo fica sem acesso por WhatsApp, em silêncio (só entra por e-mail).

Opções para a virada:

1. **Bloquear no cadastro** — simples, mas barra o caso legítimo de um casal/família que divide o mesmo WhatsApp, e a
   mensagem de erro revela que o número já tem conta.
2. **Permitir e avisar o staff** — não barra ninguém, mas sozinho não resolve o login: continua caindo em um perfil só.
3. **Tratar no login** — o código vai para o WhatsApp; depois de validado, se o número tiver mais de um perfil, o app
   mostra a lista ("Entrar como: Ana / João") e a pessoa escolhe.

**Recomendação: 3, com o aviso da 2 como complemento** (uma marca "telefone compartilhado" no painel, só informativa).
Quem divide o WhatsApp já divide o fator de login, então a escolha de conta depois do código não abre nada que o
número compartilhado já não abrisse; e quem quiser acesso separado entra por e-mail. Ao implementar: trocar o
desempate por `created_at` pela escolha de conta, e só listar os perfis **depois** do código validado (antes disso a
resposta continua cega). Isso só entra na virada para cliente real — até lá o comportamento atual fica como está.
