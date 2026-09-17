# emails/

10 templates de e-mail transacional criados pelo Antigravity (commit `9e04f9a1`,
2026-09-13, "integra as 7 PRs do Antigravity"). Recuperados em 2026-09-17 depois de
uma remoção acidental (`54ec53be`, 14s depois de criados — tentativa de tirar uma
duplicata que apagou a cópia errada; a outra cópia sobreviveu, sem versionamento,
em `C:\ybytu-pwa-admin\emails\`, que continua existindo como referência visual,
mas não é mais fonte da verdade — ver comentário no topo de cada arquivo lá).

**Nenhum destes 9 tem function ligada ainda — são só design.** Só o `03` está em
produção hoje, revisado e ligado a `ybytu-send-onboarding-email` (ver tabela).

## ⚠️ Antes de ligar qualquer um destes a uma function

Revise contra **dado fabricado** — texto ou número que parece vir de um estado real
mas na verdade é fixo, igual pra todo mundo. Foi exatamente o defeito achado e
corrigido no `03` (barra de progresso "Em andamento 65%" com checklist ✓/⏳/○ que
não vinha de lugar nenhum, mesmo padrão do
`docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md`). Perguntas a fazer pra
cada template antes de ligar:
- Todo número/percentual/data que aparece tem uma variável real por trás, ou é texto fixo do design?
- Toda variável `{{ }}` tem uma coluna/consulta real de onde vir? Se não tiver dado, a function deve **recusar o envio e logar**, nunca mandar `{{ variavel }}` literal pro destinatário (regra já aplicada no `03`).
- O link/botão aponta pra uma URL que existe de verdade no produto? (`03` tinha um `{{ tracking_link }}` pra uma área logada que nunca existiu — removido.)

## Templates

| # | Arquivo | Pra que serve | Destinatário | Variáveis | Ligado a function? |
|---|---|---|---|---|---|
| 01 | `01-confirmacao-conta.html` | Confirma e-mail pra ativar a conta (double opt-in) | Aluno | `name`, `code`, `confirmation_link` | Não |
| 02 | `02-boas-vindas.html` | Onboarding pós-confirmação de e-mail | Aluno | `name`, `app_link` | Não |
| 03 | `03-plano-em-preparacao.html` | Avisa que o plano está sendo montado/revisado | Aluno | `name` | **Sim** — `ybytu-send-onboarding-email` |
| 04 | `04-entrega-do-plano.html` | Entrega do link do plano pronto/validado | Aluno | `name`, `plan_title`, `plan_link`, `primary_goal`, `training_frequency`, `meals_count` | Não |
| 05 | `05-desafio-15-dias.html` | Engajamento — explica o desafio de 15 dias | Aluno | `name`, `challenge_link` | Não |
| 06 | `06-esqueci-senha.html` | Link de redefinição de senha | Aluno/staff | `name`, `reset_link` | Não |
| 07 | `07-senha-atualizada.html` | Confirma troca de senha bem-sucedida | Aluno/staff | `name`, `login_link`, `device_info`, `timestamp`, `account_recovery_link` | Não |
| 08 | `08-convite-profissional.html` | Convite de acesso ao painel profissional (expira em 48h) | Staff novo | `name`, `role_label`, `invite_link` | Não |
| 09 | `09-plano-aluno-a-validar.html` | Avisa profissional que tem plano de aluno esperando parecer | Staff (personal/nutri) | `reviewer_name`, `student_name`, `student_goal`, `pending_module`, `sla_remaining`, `review_link` | Não |
| 10 | `10-plano-aluno-validado.html` | Confirma pro profissional que o parecer foi publicado | Staff (personal/nutri) | `reviewer_name`, `student_name`, `validated_module`, `publication_date`, `dashboard_link` | Não |

## Convenção

- Fonte da verdade é este diretório (`C:\ybytu\emails\`), versionado.
- Quando um template for ligado a uma function, ele é **embutido como string** no
  `index.ts` da function (não lido do disco em runtime — `Deno.readTextFile` de um
  asset bundlado deu 500 em produção, 2026-09-17). Ver
  `supabase/functions/ybytu-send-onboarding-email/index.ts` como referência
  (marcadores `TEMPLATE_HTML_START`/`END`) e crie/atualize um
  `scripts/check-<function>-templates.sh` no mesmo padrão de
  `scripts/check-email-templates.sh`, chamado por `scripts/deploy-functions.sh`
  antes do deploy — garante que a fonte versionada e o que vai pra produção nunca
  divergem em silêncio.
