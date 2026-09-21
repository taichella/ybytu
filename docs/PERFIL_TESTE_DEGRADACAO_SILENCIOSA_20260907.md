# Perfil de teste reutilizável — degradação silenciosa de slot

Conta descartável (política: [[project_e2e_test_account_policy]]), criada 2026-09-07 pra exercitar
ao vivo pela primeira vez a correção de [[project_silent_slot_degradation_finding]] — nunca tinha
sido acionada com geração real antes disso. **Desativada (banida), não apagada** — decisão da
Taina 2026-09-07: reconstruir esse cenário do zero (achar a combinação nível+ambiente+condição que
zera o pool de um slot) deu trabalho real, vale manter pronto pra reuso.

## Credenciais

- Email: `teste.degradacao.silenciosa+20260907@ybytu.app`
- Auth user id: `aa00f8dd-e2c0-4fea-90e3-e0713eb08eea`
- Status: `banned_until = 2100-01-01` (login bloqueado, dado preservado)
- Plano gerado no teste: `training_plan_id = tr_ai_30e50cb2` (`is_active = false`, nunca foi pra
  revisão de propósito)

## A combinação que aciona o caso

**Nível iniciante + ambiente "Casa (sem equipamento)" (bodyweight puro) + condição de saúde
"Gravidez" (`pregnancy`) + objetivo Emagrecimento + 4 dias/semana.**

Por quê funciona, especificamente:
- Nível=beginner + ambiente=home_no_equipment restringe o pool a exercícios
  `exercise_equipments_ids <@ ARRAY['none_bodyweight']` de nível iniciante — o catálogo mais raso
  que existe.
- `ex_194` ("Flexão de braço com pegada fechada") é o **único** exercício desse pool inteiro que
  cobre `biceps_brachii` — e já tem `avoid_health_conditions_ids = ['pregnancy']` **confirmado**
  (curado, não é regra de IA/Sessão 1 — independente de qualquer coisa em aberto no catálogo).
- Objetivo Emagrecimento + 4 dias usa o molde `tr_204`, cujos slots de dia 1/3 (`biceps_brachii`
  isolado) e outros ficam sem candidato nenhum depois do `avoid` — 5 slots pulados no total no
  teste (dias 1, 3 e 4).

**Por que essa combinação e não outra**: casos óbvios como promover a regra 12 (assoalho pélvico) a
`avoid` foram simulados antes (ver `docs/SESSAO_1_PERSONAL_20260903.md`, seção "sobra treino
suficiente") e **não** esvaziam nenhum grupo muscular mesmo no pior caso — não serviriam pra este
teste. A combinação acima funciona porque mira um músculo com exatamente 1 exercício elegível no
pool mais raso do catálogo, não uma condição com muitas regras.

## Reuso 2026-09-08: também serviu pra validar o fix do dedupe

O mesmo perfil (pool raro o bastante pra forçar repetição) expôs, no primeiro teste, um bug
separado na dedupe (ver commit `ad8afe5`): o mesmo `exercise_id` repetia até 3x no mesmo dia sem
aviso. Reativei a conta, gerei de novo pós-fix (`tr_ai_77fe15a9`) e confirmei: dias 1 e 3 (pool
mais raso) caem de 3x pra 2x o mesmo exercício com aviso visível; dias 2 e 4 perdem a repetição por
completo; nenhum dia fura o piso de 3 exercícios reais. Reconfirma o valor de manter esse perfil
pronto — serviu pra dois achados reais em dois dias diferentes.

## Como reproduzir / reusar

1. Reativar a conta (remover o ban): `UPDATE auth.users SET banned_until = NULL WHERE id = 'aa00f8dd-e2c0-4fea-90e3-e0713eb08eea';`
2. Login normal (email/senha, a senha foi definida no signup original — se perdida, resetar via
   fluxo padrão) OU chamar a function de geração via `isInternalServiceCall` se o
   `INTERNAL_FUNCTION_SECRET` estiver disponível.
3. O perfil já está configurado com a combinação acima — só invocar
   `ybytu-generate-training-plan` de novo gera um novo plano no mesmo cenário (idempotente: molde,
   condição e ambiente não mudam).
4. Depois de usar, banir de novo (`banned_until` no futuro) — não apagar, não deixar ativo à toa.

## Mesma regra pra outras contas de teste achadas no banco (2026-09-07)

Duas outras contas descartáveis, órfãs de sessões anteriores, foram **desativadas** (não
apagadas) na mesma limpeza, mesmo critério:

- `auditoria.treino.31ago@ybytu.app` (`70ddc1f8-f6d4-4db0-97a8-83b520516f49`) — perfil
  "Auditoria TesteTreino31Ago", usado na auditoria de 2026-08-31
  ([[project_silent_slot_degradation_finding]] cita esse profile).
- `auditoria.retry.31ago@ybytu.app` (`c1de7398-af65-4b70-9d57-c5badedd30de`) — perfil
  "Auditoria TesteRetry31Ago", mesma auditoria.

**Achado à parte, não resolvido**: existe uma conta `mymba.studio@gmail.com`
(`7d3b7923-e07b-4dfe-a847-b3cf5520fec2`, criada 2026-07-30) sem nenhuma linha em `profiles` —
signup órfão, nem teste identificado nem aluno real. Não tocada nesta limpeza por falta de
contexto — verificar com a Taina antes de decidir o que fazer com ela.

## Mais duas contas de teste desativadas (2026-09-21)

Por pedido da Taina (contas dela, de teste), `auth.users.banned_until = 2100-01-01`, dado preservado,
mesmo método das anteriores:

- `tainachella@gmail.com` — perfil "Marina Santos" (`c6cc13af-9f3b-4aa0-a6fd-b16ae048d8ea`, criada 2026-09-04)
- `taina.chella@althero.fr` — perfil "Marcia Pontes" (`efdfc64c-bcfe-4eea-ac45-4cf59b9c23cb`, criada 2026-09-06)

Reverter: `UPDATE auth.users SET banned_until = NULL WHERE id IN (...)`.

Sinal usado pra reconhecer conta de teste: o `whatsapp_phone` (+33766338362) é o mesmo em Marina,
Marcia, Gisele Nascimento, Ana Silva e Rayan Road (nova, `8669a6af-...`, criada 2026-09-17).
A Rayan Road **não** foi desativada nem tocada: investigação só de leitura, decisão pendente com a Taina.
