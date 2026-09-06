# Débito: alerta de "Outra limitação" via parâmetro `fullName` do template WhatsApp

**Status: implementado e deployado em 2026-09-04** (`ybytu-notify-onboarding-received/index.ts`).
Ver `docs/SESSAO_1_PERSONAL_20260903.md` e a conversa de 2026-09-04 sobre a lacuna de captura de
`onboarding_physical_conditions`.

## O que é

Todo WhatsApp saído do sistema é obrigatoriamente por template pré-aprovado da Meta (HSM) —
não existe envio de texto livre business-initiated (`_shared/whatsapp.ts:6-7`). Criar um
template novo só pra este alerta leva dias de aprovação na Meta, não é opção de curto prazo.

**Solução escolhida:** quando o aluno marcar "Outra limitação" no onboarding, o parâmetro
`fullName` já enviado pro template `ybytu_staff_new_onboarding` (hoje só o nome, ex: "Maria
Silva") passa a levar um sufixo de alerta, ex: `"Maria Silva — ⚠️ limitação física não listada,
contatar"`. A Meta não valida o conteúdo do parâmetro, só o formato — funciona sem template novo,
sem coluna nova, sem tela nova.

## Por que isso é um contorno, não um padrão

Esse parâmetro tem nome `fullName` porque o template foi desenhado pra carregar só um nome.
Usá-lo pra carregar duas informações (nome + alerta) funciona hoje, mas:
- Quem for editar o template no futuro (mudar o texto ao redor do `{{1}}` na Meta) pode não saber
  que esse campo carrega mais que um nome, e reformular de um jeito que quebra ou esconde o
  alerta.
- Quem for ler `whatsapp_notifications` ou os logs esperando um nome de aluno vai ver uma string
  estranha sem contexto, se não souber desse detalhe.

**Não replicar esse padrão pra outros alertas.** Quando houver folga pra passar um template novo
pela aprovação da Meta (um `ybytu_staff_unclassified_condition` dedicado, com o próprio texto do
alerta fixo e só o nome do aluno como parâmetro), a solução certa é essa — o parâmetro `fullName`
volta a carregar só o nome.

## Quando implementar

Vai em `ybytu-notify-onboarding-received/index.ts`: hoje o `select` de `profiles` (linha ~41-45)
não busca `physical_conditions_ids`, precisa incluir; depois checar se o array contém o id de
`onboarding_physical_conditions` com `physical_condition_id='other'` e montar o `fullName`
condicionalmente antes de chamar `sendWhatsAppTemplate`. Estimado ~30-45 min (código + deploy +
teste manual do envio) — ver custo completo na conversa de 2026-09-04.
