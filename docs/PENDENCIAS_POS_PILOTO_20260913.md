# Pendências pós-piloto (2026-09-13)

Decisões tomadas nesta sessão que ficam **de propósito** fora do escopo do piloto — registradas
aqui pra quem for retomar não precisar redescobrir o raciocínio nem o tamanho real do trabalho.

---

## 1. Confirmação de e-mail no cadastro — decisão: continua DESLIGADA

**Estado hoje (confirmado ao vivo, 2026-09-13):** desligada. Os 9 cadastros reais em `auth.users`
têm `email_confirmed_at` entre 0,02 e 0,14 segundos depois de `created_at` em todos os casos — é o
banco confirmando automaticamente no mesmo INSERT, não alguém clicando link de e-mail.

**Por que decidimos deixar assim:** o WhatsApp final do onboarding (`redirectToWhatsApp()`, sempre
dispara mesmo em fail-soft de erro de geração) já é a validação real de que o contato é de
verdade — a pessoa precisa abrir o WhatsApp e mandar mensagem pra um número real pra receber o
plano. É uma validação mais forte que confirmação de e-mail pra este fluxo específico, e já existe.

**IMPORTANTE — ligar confirmação de e-mail NÃO é um toggle no painel do Supabase.** Testei contra
o código real de `apps/OnboardingPreLaunch.html` (linhas 483-513):

```js
const { data: signUpData } = await supabase.auth.signUp({...});
if (!signUpData?.session) {
  alert('Conta criada! Confirme seu e-mail para continuar.');
  return;
}
// profile, geração de plano e WhatsApp só rodam a partir daqui
```

Se alguém ligar a confirmação sem mudar mais nada:
- O plano **não é gerado** (o código de geração vem depois deste ponto).
- O WhatsApp **não dispara** (é a última linha do fluxo, nunca chega lá).
- O lead não tem como retomar depois de clicar no link do e-mail: as respostas do onboarding não
  são persistidas em lugar nenhum antes do `signUp()`, não existe tela de retomada pós-confirmação,
  e se ele tentar recomeçar do zero, a checagem de "e-mail já cadastrado" (linha 496) barra —
  *"Este e-mail já tem um perfil por aqui. Verifique seu WhatsApp ou fale com a gente."* Sem saída
  automática, só contato manual.

**O que precisa existir ANTES de ligar, se um dia decidirem fazer isso:**
1. Persistir as respostas do onboarding (ex: `localStorage` ou uma tabela de rascunho) **antes** de
   chamar `signUp()`, não depois.
2. Uma tela de verdade de "confirme seu e-mail" — não um `alert()` de navegador.
3. Um caminho de retomada: o clique no link de confirmação precisa levar de volta pro onboarding
   com as respostas recuperadas, completando profile + geração de plano + WhatsApp a partir daí.

Sem os 3, ligar a confirmação estranha metade dos leads num beco sem saída. Não é decisão de
configuração, é feature nova.

---

## 2. E-mail de fallback quando o WhatsApp falhar no envio do plano

**Contexto:** os templates `04-entrega-do-plano.html` (aluno) e `09-plano-aluno-a-validar.html`
(profissional) — hoje só referência de design em `ybytu-pwa-admin/emails/` — ficam de fora do
piloto porque os dois canais (WhatsApp pro aluno via `ybytu-send-user-whatsapp`, WhatsApp pro
profissional via `ybytu-notify-plan-ready`) já cobrem a mesma entrega hoje. Construir um canal de
e-mail paralelo rodando sempre seria redundância pura.

**Mas o WhatsApp já quebrou de verdade, duas vezes, por causa fora do nosso código:** número
bloqueado com display name "Em análise" durante revisão da Meta, e depois erro 131042 (dado fiscal
+ timezone de billing). As duas vezes a entrega parou sem ninguém notar até investigação manual.

**Decisão tomada:** não construir o canal paralelo agora. Volume do piloto é pequeno o bastante pra
o staff perceber falha olhando `whatsapp_notifications`/`failedWhatsappNotifications` (já expostos
em `ybytu-admin-users`) — visibilidade já existe, só não é automática.

**Ideia registrada pra quando o volume justificar:** e-mail de fallback disparado **só quando
`sendWhatsAppTemplate` falhar** (não em paralelo sempre) — ataca especificamente os dois incidentes
já documentados, com muito menos trabalho que construir os dois templates completos como canal
permanente. Ainda não dimensionado em detalhe — quando for a hora, cabe decidir se usa
`04-entrega-do-plano.html`/`09-plano-aluno-a-validar.html` como estão ou uma versão mais curta só
pra fallback.

---

## 3. Duplicação de templates de e-mail — resolvida, registrar o porquê

`ybytu-pwa-admin/emails/` é a pasta oficial (a galeria de preview `Emails.dc.html` referencia os
arquivos com caminho relativo, só resolve com a pasta ali do lado). A cópia em `ybytu/emails/` foi
removida (commit `54ec53be`). Nenhum dos 10 templates é lido por function nenhuma hoje — são
referência de design até que a Pendência 2 (ou outra frente de e-mail) entre em construção, momento
em que a escolha entre inline-no-`.ts` vs. tabela de templates se resolve.
