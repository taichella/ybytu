# Débito — separar aviso de cautela por público (staff vs. aluno)

**Gatilho:** resposta do personal na Sessão 1 sobre a regra 7 (joint_problems_severe, R12):
não retirar nenhum exercício, mas o aviso deveria ir só pro staff, não pro aluno. O sistema não
consegue fazer isso hoje — tratado como pendente em `scripts/aplicacao_sessao1_20260904.sql`.

## Tamanho: pequeno — é replicar um padrão que já existe, não construir do zero

O mecanismo de audiência (staff vs. aluno) já existe de ponta a ponta, construído pro
`skipped_slots` em 2026-09-04 ([[project_silent_slot_degradation_finding]]):
`buildPlanPayload(supabase, userId, audience)`, com `ybytu-get-plan-for-staff` passando `'staff'`
e `ybytu-get-plan-payload` (tela do aluno) usando o default `'student'`. Aplicar o mesmo padrão a
`caution_warnings` não abre nenhuma infraestrutura nova — só replica a forma já validada.

**O que muda, arquivo por arquivo:**

1. **`ybytu-generate-training-plan/index.ts`** — `CAUTION_MESSAGES` (hoje `Record<condition,
   string>`, 20 condições) vira `Record<condition, { staff: string; aluno: string }>`. A
   construção de `cautionWarnings` (por volta da linha 1190) passa a gravar `mensagem_staff` e
   `mensagem_aluno` em vez de `mensagem` — mesma forma que `skippedSlotsPayload` já grava hoje
   (linha ~1148).
2. **`buildPlanPayload.ts`** — a leitura de `caution_warnings` (linha ~291) troca `warning.mensagem`
   por `audience === 'staff' ? warning.mensagem_staff : warning.mensagem_aluno` — mesma lógica que
   já existe pra `skippedNoteByDay` algumas linhas abaixo, só copiada pro bloco de cima.
3. **Compatibilidade com planos já gerados**: `training_plans.caution_warnings` de planos antigos
   tem a forma velha (`{condition, mensagem, exercise_ids}`, sem `mensagem_staff/mensagem_aluno`).
   A leitura em (2) precisa de um fallback (`warning.mensagem_staff ?? warning.mensagem`) pra não
   quebrar planos existentes — não precisa de migration nem de backfill, é JSONB solto dentro da
   coluna, o fallback resolve na leitura.
4. **UI (dashboard e tela do aluno)**: nenhuma mudança — as duas telas já renderizam
   `adapted_note_ptbr` genericamente, sem saber se o texto veio de staff ou aluno; o texto
   diferente já chega pronto do payload, igual acontece hoje com `skipped_note_ptbr`.

**O que não muda:** nenhuma tabela nova, nenhuma migration, nenhum novo parâmetro de function —
tudo trafega dentro da mesma coluna `training_plans.caution_warnings` (JSONB) e do mesmo parâmetro
`audience` que já existe.

**Estimativa:** poucas horas de implementação + teste com um perfil real (mesmo padrão de teste
usado no `skipped_slots` — `BEGIN...ROLLBACK` pra validar a query, depois teste e2e com conta
descartável antes de considerar resolvido). Não é um projeto — é o mesmo trabalho já feito uma vez
esta semana, na mesma classe de dado.

## Enquanto não for feito

Regra 7 fica sem decisão aplicada (nem `caution` nem `avoid`) — ver comentário em
`scripts/aplicacao_sessao1_20260904.sql`, Seção B2. Isso significa: os 40 exercícios da regra 7
continuam no estado atual (o que já era antes desta sessão), e nenhum aluno com
`joint_problems_severe` recebe aviso novo — nem pro staff, nem pra ele — até isso ser decidido.
