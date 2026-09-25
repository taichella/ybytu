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
