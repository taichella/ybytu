# ybytu

## Scripts

- `bash scripts/detect-silent-revert.sh <ref-base> <ref-pr>` — antes de mergear uma PR, avisa se ela remove uma linha que `ref-base` também mudou depois que a PR divergiu (ex: `bash scripts/detect-silent-revert.sh origin/main origin/nome-da-branch`).
- `cd apps/ybytu-dashboard && npx vite --config vite.preview.config.js` — renderiza uma tela do dashboard com dados de fixture, sem precisar de login de staff (bloqueado localmente por CORS); abra `/preview/index.html?screen=exercises` (adicione telas novas em `preview/main.jsx`).
