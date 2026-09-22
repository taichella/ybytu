# Rollback — piloto

Passos de reversão pra mudanças de banco/infra feitas durante o piloto que têm efeito real em
produção. Cada entrada: o que reverter, e por quê pode ser necessário.

## 2026-09-17 — Orquestração de geração pós-onboarding + retry automático

**O que foi adicionado:**
- Colunas `profiles.plan_generation_started_at` (timestamptz) e `profiles.plan_generation_attempts`
  (integer, default 0).
- CHECK constraint `profiles_plan_generation_status_check` ampliada pra aceitar `'generating'`
  além de `'pending'/'ok'/'failed'` (migration `20260917151500` — achado testando ao vivo: a
  reivindicação atômica falhava com "violates check constraint" até isso ser corrigido).
- Cron `ybytu-onboarding-retry-15min` (a cada 15 min), chamando `ybytu-onboarding-retry-cron`.
- Functions `ybytu-onboarding-complete`, `ybytu-onboarding-retry-cron`,
  `_shared/onboardingOrchestration.ts`.
- `OnboardingPreLaunch.html` passou a chamar `ybytu-onboarding-complete` em vez de orquestrar
  meal → training diretamente no navegador.

**Se precisar reverter (ex: o retry automático está causando geração dobrada, ou o cron está
sobrecarregando o Groq):**

1. Desativar só o cron, sem mexer em código (mais seguro, reversível na hora):
   ```sql
   SELECT cron.unschedule('ybytu-onboarding-retry-15min');
   ```
2. Se precisar reverter o widget también: `git revert` do commit que trocou
   `OnboardingPreLaunch.html` pra chamar `ybytu-onboarding-complete`, republicar o HTML anterior no
   WordPress (fonte de verdade é sempre o commit, não o que está colado lá — ver
   `docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md`). Isso volta a orquestração pro
   navegador (reintroduz o bug original: fechar a aba entre meal e training perde o segundo).
3. As colunas novas (`plan_generation_started_at`, `plan_generation_attempts`) são aditivas e
   não quebram nada se ficarem sem uso — não é necessário fazer `DROP COLUMN` só por reverter o
   cron/function. Só remova se tiver certeza de que nenhum código as lê mais:
   ```sql
   ALTER TABLE profiles DROP COLUMN IF EXISTS plan_generation_started_at;
   ALTER TABLE profiles DROP COLUMN IF EXISTS plan_generation_attempts;
   ```
4. `ybytu-admin-retry-plan-generation` passou a zerar `plan_generation_attempts` e delegar a
   `ybytu-onboarding-complete` -- se reverter o passo 2, reverta este arquivo junto (o botão
   "Refazer" do FailedPlans deixaria de funcionar sozinho, apontando pra uma function que não
   existe mais).

## 2026-09-19 — `exercises.load_type` + validação de carga + limpeza de cargas indevidas

**O que foi feito em produção:**
- Migration `20260919180000` aplicada: coluna `exercises.load_type text NOT NULL DEFAULT 'weighted'` com CHECK
  (`bodyweight`|`weighted`|`machine`|`band`), backfill dos 298 exercícios (240 por regra de equipamento, 58 ambíguos
  com sugestão provisória do personal em `docs/CLASSIFICACAO_LOAD_TYPE.md`). Registrada no histórico com
  `migration repair --status applied` (`db push` não roda: 26 entradas antigas só-remotas).
- Functions `ybytu-admin-trainings` e `ybytu-submit-plan-review` passaram a validar carga >= 0 antes de qualquer escrita.
- UPDATE em 2 linhas de `training_plan_exercises` (plano de TESTE da Gisele, `tr_ai_0e9a64d9`): `load_kg` -1 e 3 viraram null.

**Reverter a coluna (só se algo que a lê quebrar; nenhuma function a lê até a interface ser publicada):**
```sql
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_load_type_check;
ALTER TABLE exercises DROP COLUMN IF EXISTS load_type;
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260919180000';
```
Depois de a interface passar a ler `load_type`, reverter a coluna exige reverter a interface junto (`git revert` do
commit que a introduziu), senão a tela de carga e o PDF quebram.

**Reverter só o backfill de um exercício** (ex.: o personal discordou de uma classificação): não é rollback, é
correção -- `UPDATE exercises SET load_type = '<valor>' WHERE exercise_id = '<id>';`.

**Restaurar as 2 cargas indevidas** (só pra reproduzir o achado; o valor -1 é inválido e a validação nova o rejeita):
```sql
UPDATE training_plan_exercises SET sets_detail = (SELECT jsonb_agg(jsonb_set(s,'{load_kg}','-1'::jsonb) ORDER BY (s->>'set_number')::int) FROM jsonb_array_elements(sets_detail) s)
WHERE id = 'c1a431ac-982d-41a4-b77c-2e759af29862';   -- Flexão de braço com pegada fechada, 3 séries, era -1 kg
UPDATE training_plan_exercises SET sets_detail = (SELECT jsonb_agg(jsonb_set(s,'{load_kg}','3'::jsonb) ORDER BY (s->>'set_number')::int) FROM jsonb_array_elements(sets_detail) s)
WHERE id = 'ad83e41e-4032-4164-abd0-ec40a2935aff';   -- Good morning com peso corporal, 3 séries, era 3 kg
```

## 2026-09-21 — Correções de catálogo/gerador e limpeza dos alunos de teste

### Equipamento de 5 exercícios (aplicado)
`scripts/correcao_equipamentos_exercicios_20260921.sql` tem o UPDATE e o rollback (valores antigos de
ex_132, ex_113, ex_129, ex_170, ex_223). Nenhum plano usava esses exercícios no momento da troca.

### Gerador: avoid vale para o par de mesmo nome (deployado)
Commit `e8e27192` (`filterAvoidedIncludingSiblings`). Reverter: `git revert e8e27192` e
`scripts/deploy-functions.sh ybytu-generate-training-plan`. Efeito de reverter: os 5 irmãos sem avoid
(ex_236, 083, 103, 191, 013) voltam a poder entrar no plano de gestante.

### Orquestração: assinatura NULL/desconhecida grava 'failed' (deployado)
Commit `5e04168a`. Reverter: `git revert 5e04168a` + deploy de `ybytu-onboarding-complete` e
`ybytu-onboarding-retry-cron`. Efeito de reverter: perfil com `subscription_type_id` NULL volta a receber
`ok` sem plano nenhum gerado.

### Limpeza dos alunos de teste (EXECUTADA em 2026-09-21 21:44 +02:00, opção (a))
Removidas 11 contas de `auth.users` (10 alunos de teste + `contato+teste_ui_staff_20260919@ybytu.app`, staff revogado
sem perfil), 10 perfis, 20 planos de treino `tr_ai_` (17 de alunos + 3 órfãos de 04/09, 404 exercícios), 10 planos
de nutrição `mp_ai_` (200 refeições), 8 tokens `/plano/<token>`, 5 pareceres, 29 linhas de `whatsapp_notifications`,
sessões e refresh tokens. Ficaram as 3 contas da equipe (mymba.studio@gmail.com, contato+personal@ybytu.app,
contato+nutri@ybytu.app), os 7 moldes `tr_201..207` (179 linhas) e os 300 planos de nutrição do catálogo, sem alteração
(conferido por hash). Ficaram 19 linhas antigas de `whatsapp_notifications` com `user_id` nulo (envios de teste ao
+33766338362 anteriores a 29/08; nenhuma tela de aluno as conta).

**Backup (contém HASH DE SENHA de `auth.users`; apagar quando o piloto estabilizar):**
`C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_20260921_214330.json` — 597 KB, gerado em 2026-09-21 21:43 +02:00 via
`supabase db query --linked` (11 contas, 23 tabelas, 818 linhas). Fica **fora do repo** de propósito; nunca commitar,
nunca enviar por e-mail/chat. Apagar o arquivo quando o piloto estabilizar (depois do primeiro aluno real
funcionando ponta a ponta e do ponto de restauração `piloto-v1.0` existir). O backup anterior (subconjunto, 10 contas)
foi apagado por estar contido neste.

**Restaurar** (recria contas com a mesma senha, perfis, planos, tokens `/plano/<token>`, pareceres, log de WhatsApp e a
linha de staff revogada):
```bash
node scripts/restaurar_alunos_do_backup.mjs "C:/Users/tahch/ybytu-backups/alunos_pre_limpeza_20260921_214330.json" > restore.sql
npx supabase db query --linked -f restore.sql
```
O SQL é idempotente (`ON CONFLICT DO NOTHING`), insere na ordem das FKs e pula colunas geradas. **Ensaiado antes de
executar** (apagar + restaurar + comparar numa transação abortada por erro forçado): contagens e hashes de `auth.users`,
`profiles`, `staff_roles` e exercícios dos planos voltaram idênticos (0 divergências). Depois de restaurar, os links
`/plano/<token>` voltam a funcionar (tokens têm validade de 90 dias). O script de remoção ficou em
`scripts/limpeza_alunos_teste_20260921.sql` (com guardas: aborta se o alvo não for exatamente 11 contas, se a equipe
não estiver ativa, se sobrar perfil fora do alvo ou se aluno estiver ligado a molde/catálogo); não rode de novo sem
revisar o `<> 11`.

### ex_113 e ex_129: load_type machine (aplicado 2026-09-21)
Antes `bodyweight`, agora `machine` (são "na máquina"). Nenhum plano usava. Rollback:
`UPDATE exercises SET load_type = 'bodyweight' WHERE exercise_id IN ('ex_113','ex_129');`
(também em `scripts/correcao_equipamentos_exercicios_20260921.sql`).

### Backup do banco inteiro (ponto de restauração piloto-v1.0)
Estado em 2026-09-21: o backup diário automático do Supabase **não aparece ativo** (`supabase backups list` devolve
`backups: []`, `pitr_enabled: false`); o plano não é legível pela CLI, confirmar em Dashboard > Settings > Database >
Backups. `supabase db dump --linked` exige Docker Desktop LIGADO (sem ele falha ao subir o container do pg_dump; com
`--dry-run` a autenticação da CLI resolve sem senha). Para o piloto-v1.0: ligar o Docker e gerar schema + dados
(`--data-only --schema public,auth`) + roles, arquivados fora do repo.

**Decisão 2026-09-21:** continuar no plano Free durante o piloto, com backup automático próprio (não o da Supabase).
Ver `docs/BACKUP.md` — proposta pronta (GitHub Action diária, criptografada com `age`, R2 privado, retenção
7 diários + 4 semanais), ainda **não agendada** (falta a Taina criar os secrets e uma rodada manual de teste).

### whatsapp_notifications órfãs removidas (2026-09-22)
As 19 linhas com `user_id` nulo (envios de teste ao +33766338362, anteriores a 29/08, já órfãs desde a
limpeza de 21/09 — todas as linhas com `user_id` preenchido já tinham sido removidas junto com as contas)
foram apagadas. `SELECT count(*) FROM whatsapp_notifications WHERE user_id IS NULL`: 19 antes, 0 depois;
tabela inteira: 19 antes, 0 depois. Sem rollback: não há campo que preserve o texto original fora do
backup `alunos_pre_limpeza_20260921_214330.json`, que já continha estas 19 linhas.

## 2026-09-22 — MVP: fix do PDF, 3 contas de teste limpas, conta de demonstração criada

**PDF (deployado, commit 8551eb57):** `@media print` em `UserPlan.jsx` agora zera `box-shadow` também em
`.card/.day/.meal/.pcard/.mini/.stat/.diag`, não só `.doc`. Medido no mesmo plano antes/depois: 2,88 MB → 1,13 MB
(imagens rasterizadas de sombra: 1,79 MB → 0,10 MB). Rollback: reverter o commit, ou remover a linha
`.card, .day, .meal, .pcard, .mini, .stat, .diag { box-shadow: none !important; }` perto da linha 468.

**Limpeza (executada 2026-09-22 18:44, `scripts/limpeza_alunos_teste_mvp_20260922.sql`):** removidas as 3 contas de
teste do dia (`tainachella@gmail.com`, `loyedo4524@kingdais.com` "Teste A Aluno", `komofe3268@art2mart.com`
"Teste B Aluno"), 3 planos de treino + 3 de nutrição, 3 tokens, 9 notificações WhatsApp. Backup:
`C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_20260922_184456.json` (108 KB, hash de senha, apagar quando o piloto
estabilizar — ver regra na seção de 2026-09-21 acima). Restaurar: mesmo `restaurar_alunos_do_backup.mjs`. Ficam 3
contas no Auth (equipe) + a conta de demonstração criada depois desta limpeza (WhatsApp real da Taina, **não** faz
parte de nenhum backup/limpeza de teste — é a conta real de demonstração pro cliente).
