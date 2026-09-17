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
