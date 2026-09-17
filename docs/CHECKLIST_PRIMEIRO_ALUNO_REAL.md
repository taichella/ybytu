# Checklist do primeiro aluno real

*Revisado 2026-09-17 — item 0 fechado (era suspeita, agora confirmado), resto sem mudança.*

Uma página. Confira nesta ordem depois que a primeira pessoa de verdade completar o onboarding com
um plano que vai ser usado (não teste, não Marina/E2E). Cada item diz onde olhar, o que deveria ter
acontecido, e o que indicaria problema.

---

**Item 0 (botão do profissional) fechado, não é mais item de verificação.** Confirmado no painel da
Meta (WhatsApp Manager → `ybytu_staff_plan_ready`): a base do botão é `https://pro.ybytu.app/review/`,
rota que existe e funciona — nunca foi `/validar/`, era só comentário desatualizado no código
(corrigido). Nenhuma ação pendente aqui.

---

## 1. O aluno recebeu o WhatsApp inicial?

**Onde olhar:** o próprio celular do aluno (ou, do seu lado, `whatsapp_notifications` no banco,
filtrando pelo `user_id` dele).
**Deveria ter acontecido:** mensagem de confirmação logo após o onboarding, redirecionando pro
WhatsApp com "Olá! Sou [nome] e acabei de finalizar meu perfil...".
**Indica problema:** se não chegou nada, o onboarding pode ter parado antes do redirect (ver
item 2) — não é falha do WhatsApp em si, o redirect é a última linha do fluxo.

## 2. O perfil e o plano foram gerados?

**Onde olhar:** `/users` → busque o nome do aluno → `/users/:id`.
**Deveria ter acontecido:** perfil existe, com telefone/e-mail reais (card "Conta & Assinatura").
Status de geração do plano = `ok` (não aparece em `/campaign/failed-plans`).
**Indica problema:** aluno some da busca (perfil não foi criado — provável falha no `signUp` ou na
escrita do perfil) ou aparece em `/campaign/failed-plans` (geração falhou — usar "Refazer" na
própria tela).

## 3. O plano em si está completo?

**Onde olhar:** `/users/:id/plano`.
**Deveria ter acontecido:** treino e nutrição preenchidos, dias da semana batendo com o que o aluno
pediu, sem card vazio.
**Indica problema:** dia de treino faltando exercício ("slot pulado" — aparece um aviso amarelo no
card do dia, isso é esperado ocasionalmente, não é bug, é o sistema recusando preencher errado); se
`ai_filled_slots = 0` e `deterministic_fallback_slots > 0` pro dia inteiro, é sinal de degradação da
IA (Gemini/Groq fora do ar ou cota estourada) — visível como badge na tela.

## 4. Os alergênicos aparecem certos?

**Onde olhar:** cada card de refeição em `/users/:id/plano`.
**Deveria ter acontecido:** a maioria das refeições mostra alergênico real ("Contém: leite", etc.)
ou nada (confirmado sem alergênico) — não mais "Alergênicos não verificados" na maioria dos casos
(hoje só ~18% do catálogo ainda cai nessa categoria, ver `docs/ENCERRAMENTO_SESSAO1_20260913.md`).
**Indica problema:** aluno com alergia declarada recebendo refeição que contém o alergênico dele —
isso seria falha grave na exclusão da RPC de geração, pare e investigue na hora, não é comportamento
esperado em hipótese nenhuma.

## 5. O(s) profissional(is) foram avisados?

**Onde olhar:** WhatsApp do personal e/ou nutricionista (o mesmo número recebe os dois avisos hoje,
ver nota em `ybytu-notify-plan-ready/index.ts`).
**Deveria ter acontecido:** mensagem de "parecer pendente" chegou, com o botão (ver item 0).
**Indica problema:** não chegou nada — checar `PHONE_ADMIN_TRAINER`/`PHONE_ADMIN_NUTRI` configurados
e `whatsapp_notifications` (status `failed` com o erro da Meta). O cron de lembrete (12h) reenvia
sozinho se a primeira falhar, mas não espere passivamente na primeira vez.

## 6. O parecer foi registrado?

**Onde olhar:** `/users/:id` → aba de plano, ou `/review/:id` direto.
**Deveria ter acontecido:** personal e nutricionista conseguem abrir a tela, ver o plano, e submeter
parecer (aprovado ou "precisa de ajuste"). Depois dos dois pareceres, o aluno recebe o WhatsApp
final de "plano pronto".
**Indica problema:** parecer não salva, role não aparece pro staff certo (checar `staff_roles` do
profissional), ou o aluno nunca recebe a mensagem final mesmo com os dois pareceres dados — nesse
caso, checar se `ybytu-send-user-whatsapp` disparou (log em `whatsapp_notifications`).

---

**Se tudo isso passou:** o fluxo funcionou de ponta a ponta com gente de verdade, pode considerar o
piloto tecnicamente validado pro primeiro caso. Guarde este checklist pros próximos alunos também —
não precisa repetir tudo depois que uns 3-5 passarem sem problema.
