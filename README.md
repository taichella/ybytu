# ybytu

## Scripts

- `bash scripts/detect-silent-revert.sh <ref-base> <ref-pr>` — antes de mergear uma PR, avisa se ela remove uma linha que `ref-base` também mudou depois que a PR divergiu (ex: `bash scripts/detect-silent-revert.sh origin/main origin/nome-da-branch`).
- `bash scripts/deploy-functions.sh <nome-da-function>` — **use no lugar de** `npx supabase functions deploy`, nunca antes dele. Recusa o deploy se a function (ou `_shared/`) tiver mudança não commitada, ou se o commit atual ainda não chegou no remoto — só então roda o deploy de verdade. Sem argumento, aplica a mesma checagem a `supabase/functions/` inteiro (deploy de todas). Existe porque `supabase functions deploy` manda o que está em disco sem nunca olhar pro git: dois geradores de plano e o webhook do WhatsApp ficaram dias rodando em produção sem existir no repositório até uma varredura manual achar (2026-09-06). Bypass de emergência (documentar o motivo, não usar em silêncio): `ALLOW_DIRTY_DEPLOY=1 bash scripts/deploy-functions.sh <nome>`.
- `cd apps/ybytu-dashboard && npx vite --config vite.preview.config.js` — renderiza uma tela do dashboard com dados de fixture, sem precisar de login de staff (bloqueado localmente por CORS); abra `/preview/index.html?screen=exercises` (adicione telas novas em `preview/main.jsx`).
