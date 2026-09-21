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

### Limpeza dos alunos de teste (script pronto, ver status abaixo)
**Status: NÃO executada até a escolha da opção (a) pela Taina.**

Backup (fora do repo, contém hash de senha): `C:\Users\tahch\ybytu-backups\alunos_pre_limpeza_20260921_212736.json`
(563 KB, gerado em 2026-09-21 21:27 +02:00 via `supabase db query --linked`; 10 contas, 21 tabelas, 728 linhas
com auth.*, `_meta` no início do arquivo). O `supabase db dump` não rodou: precisa do Docker Desktop, que estava desligado.

Executar: `npx supabase db query --linked -f scripts/limpeza_alunos_teste_20260921.sql`
(uma transação; aborta sozinha se o alvo não for exatamente as 10 contas de hoje, se incluir conta da
equipe, ou se algum aluno estiver ligado a molde/catálogo).

**Restaurar** (recria contas com a mesma senha, perfis, planos, tokens `/plano/<token>`, pareceres e log de WhatsApp):
```bash
node scripts/restaurar_alunos_do_backup.mjs "C:/Users/tahch/ybytu-backups/alunos_pre_limpeza_20260921_212736.json" > restore.sql
npx supabase db query --linked -f restore.sql
```
O SQL é idempotente (`ON CONFLICT DO NOTHING`), insere na ordem das FKs e pula colunas geradas.
**Ensaio feito em 2026-09-21** (apagar + restaurar + comparar dentro de uma transação abortada por erro forçado,
nada persistiu): todas as contagens e os hashes de `auth.users`, `profiles` e dos exercícios dos planos voltaram
idênticos ao estado anterior; hashes de moldes, catálogo de refeições e exercícios não mudaram em nenhum momento.
Depois de restaurar, os links `/plano/<token>` voltam a funcionar (tokens dentro do prazo de 90 dias).

**Se optar por banir em vez de apagar (b):** `UPDATE auth.users SET banned_until = '2100-01-01' ...`,
`UPDATE plan_share_tokens SET revoked_at = now() ...`, `UPDATE training_plans/meal_plans SET is_active = false ...`.
Reverter: `banned_until = NULL`, `revoked_at = NULL`, `is_active = true`.
