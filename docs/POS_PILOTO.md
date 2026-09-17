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
