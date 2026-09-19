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

Achado 2026-09-19 (caso Gisele): o catálogo tem **19 pares de exercícios com o mesmo nome e exercise_id diferente**. O par ex_194/ex_216 ("Flexão de braço com pegada fechada") caiu duas vezes no mesmo dia de um plano ativo. Causa raiz e correção provisória estão em `supabase/functions/ybytu-generate-training-plan/exerciseNames.ts`: o gerador **colapsa o pool por nome, mantendo o menor exercise_id** e unindo os músculos do par. Isso protege planos NOVOS; a fusão definitiva no catálogo continua pendente e depende do personal.

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
