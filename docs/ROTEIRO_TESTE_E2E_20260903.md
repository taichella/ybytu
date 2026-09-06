# Roteiro de teste E2E — rodar assim que a Sessão 1 estiver aplicada (2026-09-03)

Checklist sequencial, uma etapa depende da anterior. Marque cada item — se algum falhar, pare
e registre onde travou antes de tentar contornar.

## 0. Pré-requisitos (confirmar antes de começar)

- [ ] Sessão 1 da nutricionista aplicada no banco (`UPDATE`/`INSERT` das respostas já rodados).
- [ ] Sessão 1 do personal aplicada no banco (`UPDATE` de `muscle_groups_ids` dos 7 casos +
      `UPDATE status`/promoção a `avoid` das 13 regras de `exercise_condition_proposals`,
      conforme `docs/SESSAO_1_PERSONAL_20260903.md`). Sem isso o teste roda contra o catálogo
      ainda não revisado — não invalida o teste técnico, mas qualquer badge/exclusão de
      exercício visto no passo 5 vai refletir o estado pré-revisão, não o aprovado.
- [ ] Badge deployado e confirmado com dado real (já feito em 2026-09-02 — só reconfirmar que
      segue no ar).
- [ ] **`apps/OnboardingPreLaunch.html` colado na página WordPress real** (deploy é manual, ver
      `[[project_wordpress_onboarding_deploy_manual]]`). **Bloqueador confirmado em 2026-09-03:**
      o arquivo local tem duas correções que ainda não foram coladas no WordPress —
      (1) as chamadas de geração de treino/nutrição passaram de paralelas pra sequenciais
      (nutrição primeiro) pra evitar colisão no rate limit de TPM do Groq quando as duas
      competem pelo mesmo orçamento; (2) o disparo de `ybytu-notify-plan-ready` e
      `ybytu-create-plan-share-token` deixou de ser condicionado a `generationFailed` do lado do
      client — esse gate já causou **zero notificações pro staff em 2 onboardings reais**
      (2026-08-26 e 2026-08-27) mesmo com o plano tendo sido gerado com sucesso no servidor
      (`project_staff_notification_never_fired_root_cause`). As duas correções estão prontas e
      testadas localmente, mas **a página ao vivo ainda roda a versão antiga com o bug** até
      alguém colar o HTML atualizado no WordPress. Testar sem colar reproduz o bug já corrigido.
      Confirmado por comparação byte-a-byte (`supabase functions download`) que as edge functions
      (`ybytu-generate-training-plan`, `ybytu-generate-meal-plan`, `whatsapp-webhook`,
      `ybytu-notify-plan-ready`, `ybytu-plan-review-reminder-cron`) **não** têm esse problema —
      o código em disco bate 100% com o deployado, sem gap. O único ponto de deploy manual
      pendente é este HTML.
- [ ] Conta de teste descartável criada pro onboarding — **nunca a conta pessoal da Taina**
      (ver `[[project_e2e_test_account_policy]]`), telefone e e-mail reais e acessíveis pra
      você conferir recebimento.
- [ ] Perfil do teste declara **`Sem Soja`** no onboarding. Não é escolha arbitrária: verificado
      em 2026-09-03 que o filtro do gerador (`ybytu_match_meals`) está **sincronizado sem
      divergência** com todo alérgeno já revisado — leite, ovo, glúten, castanha etc. já
      confirmados nunca escapam do filtro hoje. Os 42 ingredientes `unreviewed` em refeição
      ativa (Banana, Cacau, Peito de frango, Azeite...) não são plausivelmente nenhuma das 15
      restrições declaráveis — não existe hoje um caso real de "restrição declarada + refeição
      com esse alérgeno escapando". `Sem Soja` é a que tem superfície de teste real: soja
      aparece em vários alimentos já revisados, incluindo o `food_420` Whey (Bloco 1 da Sessão
      1, em disputa ativa no momento deste teste).

## 1. Onboarding (WordPress)

URL: `ybytu.app/onboarding-pre-lancamento/` (não confundir com o onboarding React de
pós-piloto — ver `[[project_two_onboardings_distinction]]`).

- [ ] Preencher o formulário completo com o perfil de teste, incluindo a restrição alimentar
      declarada no passo correspondente.
- [ ] Submeter.
- [ ] **Sucesso:** confirmação de envio na tela, sem erro de CORS/rede no console do navegador.

## 2. Geração do plano (nutrição + treino)

- [ ] Confirmar no banco (`profiles.current_meal_plan_id`/`current_training_plan_id`) que os
      dois planos foram criados pro usuário de teste.
- [ ] **Sucesso:** `plan_generation_status` autoritativo do servidor mostra sucesso nos dois
      (não confiar no timeout do client — já foi bug confirmado antes).
- [ ] **Verificação A (filtro por restrição declarada):** conferir que **nenhuma refeição do
      cardápio gerado tem `soy` em `meals.restriction_tags`** — confirma que o filtro que já
      existe (`ybytu_match_meals`) está funcionando pra essa restrição declarada.

      **Limite do que essa verificação prova, registrado antes de rodar:** zero divergência
      entre `food_restriction_tags` e `meals.restriction_tags` (checado em 2026-09-03) significa
      que o filtro é **consistente com o banco** — não que o banco está clinicamente **certo**.
      Se um alérgeno estiver faltando num alimento já revisado, o filtro propaga esse erro sem
      divergir de coisa nenhuma; ele não tem como saber que o dado está errado. O caso exato:
      se `soy` estivesse faltando em `food_420` (Whey) — que é literalmente a disputa aberta do
      Bloco 1 da Sessão 1 — um aluno com `Sem Soja` declarado receberia whey normalmente, e nada
      no filtro avisaria, porque o filtro estaria perfeitamente sincronizado com um dado
      errado. **Se a Verificação A passar, o que ela prova é que o encanamento funciona — a
      correção clínica do catálogo (o alérgeno certo estar registrado pro alimento certo) só a
      nutricionista fecha, revisão por revisão.** Não tratar esta verificação como validação de
      segurança alimentar, só de comportamento do código.
- [ ] **Verificação B (badge nunca em silêncio):** olhar os ingredientes de cada refeição do
      cardápio contra a lista dos 42 `unreviewed` (`docs/SESSAO_1_NUTRICIONISTA_20260902.md`,
      Bloco 3) — se alguma refeição do plano usa um deles, ela **precisa** mostrar o badge
      `Alérgenos não verificados` no passo 5, mesmo não tendo relação com soja. Isso é o que
      prova que o sistema nunca finge saber o que não sabe, independente da restrição
      declarada.

## 3. WhatsApp — notificação de staff (onboarding recebido)

- [ ] Confirmar recebimento da mensagem no número de staff configurado
      (`PHONE_ADMIN_NUTRI`/`PHONE_ADMIN_TRAINER`, conforme o template).
- [ ] Verificar em `whatsapp_notifications` que o registro tem `delivery_status` preenchido
      (não só `status='sent'` — `sent` só confirma que a Meta aceitou, `delivery_status` é
      quem confirma entrega real, via o webhook HMAC que testamos em 2026-09-01).
- [ ] **Sucesso:** mensagem chega no WhatsApp real do staff, `delivery_status` bate.

## 4. E-mail de onboarding pro aluno

- [ ] Confirmar recebimento no e-mail de teste (checar também pasta de spam).
- [ ] Conferir o remetente: deve ser `onboarding@send.ybytu.app` (domínio verificado no Resend,
      confirmado 2026-09-02) — se vier de `resend.dev` ou não chegar, o domínio não está mais
      verificado e é bloqueador, não segue o teste.
- [ ] **Sucesso:** e-mail chega, remetente correto, link/conteúdo íntegro.

## 5. Dashboard — fila de revisão profissional

- [ ] Logar como staff (`contato+nutri@ybytu.app` ou `contato+personal@ybytu.app`, contas
      permanentes de teste — ver `[[project_staff_test_accounts_personal_nutri]]`).
- [ ] Confirmar que o usuário de teste aparece na fila de planos aguardando parecer
      (`Campaign.jsx`, seção "Planos aguardando validação").
- [ ] Abrir `/users/:id/plano`, confirmar que carrega sem erro (esse é o ponto que estava
      travado numa sessão antiga por token expirado — confirmar que é isso mesmo, testando com
      sessão fresca).
- [ ] **Verificar os badges de alérgeno com dado real** (o ponto central deste teste): cada
      refeição do cardápio gerado deve mostrar o estado certo — `Contém: X` pros ingredientes
      já revisados com alérgeno, `Traços de glúten possíveis` pros de contaminação cruzada,
      `Alérgenos não verificados` pros que ainda não foram tocados pela Sessão 1, e nenhum
      badge pros confirmados sem alérgeno. Prestar atenção especial: **nenhuma refeição com o
      ingrediente da restrição declarada no passo 1 deveria estar no cardápio pra começo de
      conversa** — mas se algum ingrediente relacionado aparecer via contaminação cruzada ou
      não-verificado, o badge tem que estar visível e correto.
- [ ] Registrar parecer profissional (treino + nutrição) — confirmar que o botão de
      aprovar/enviar funciona.
- [ ] **Sucesso:** fila mostra o usuário, plano carrega, badges corretos, parecer registrável.

## 6. PDF

- [ ] Gerar/baixar o PDF do plano (`Salvar PDF` na tela do plano).
- [ ] Conferir que os badges de alérgeno aparecem no PDF também (mesmo componente,
      `UserPlan.jsx`, mas confirmar — impressão tem CSS própria, `.chip`/`.meal-allergen`
      precisam sobreviver ao `@media print`).
- [ ] **Sucesso:** PDF legível, sem corte de conteúdo, badges visíveis.

## 7. WhatsApp — plano pronto (pro aluno)

- [ ] Depois do parecer registrado, confirmar que o aluno recebe a notificação de plano pronto
      (template `WHATSAPP_TEMPLATE_USER_PLAN_READY`).
- [ ] Verificar `whatsapp_notifications` de novo pra esse envio específico.
- [ ] **Sucesso:** mensagem chega no WhatsApp de teste do aluno.

## 8. Página pública do aluno (`/plano/:token`)

- [ ] Abrir o link recebido (WhatsApp ou e-mail) **num navegador sem sessão de staff** — testa
      o caminho real do aluno, não o caminho de quem já está logado.
- [ ] Confirmar que a página carrega com `noindex`/sem cache (já implementado).
- [ ] **Reconferir os badges aqui, no contexto de aluno de verdade** — é a mesma function
      (`ybytu-get-plan-payload`) mas vale confirmar que não há diferença de comportamento entre
      staff e público.
- [ ] Testar num celular real (não só emulação de viewport — a ferramenta de screenshot mobile
      falhou na sessão anterior, isso aqui é a confirmação real que faltou).
- [ ] **Sucesso:** plano completo, legível, badges corretos, nada quebrado em mobile real.

## O que falha o teste inteiro (parar e reportar, não seguir)

- Qualquer ingrediente da restrição declarada aparecendo sem nenhum badge (nem `Contém`, nem
  `Alérgenos não verificados`) — isso seria voltar ao fail-open original.
- E-mail saindo de domínio errado ou não chegando.
- Badge divergente entre dashboard (staff) e página pública (aluno) — indicaria bug na function
  compartilhada, não só de UI.
- Erro de CORS/autenticação em qualquer etapa do onboarding.
