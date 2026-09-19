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
