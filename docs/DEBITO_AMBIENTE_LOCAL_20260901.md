# Débito: não existe ambiente local funcional neste projeto (2026-09-01)

Registrado durante a validação da PR do Jules (CSS de impressão, `index.css`), mas o
problema é estrutural do projeto, não da PR.

## O que não funciona

**1. Login local do dashboard é bloqueado por CORS.** `supabase/functions/_shared/cors.ts`
tem uma allowlist fixa (`ybytu.app`, `www.ybytu.app`, `pro.ybytu.app`, `dashboard.ybytu.app`)
sem nenhuma entrada `http://localhost:*`. O login chama `ybytu-whoami` pra confirmar papel
de staff; sem CORS liberado, essa chamada falha e a tela mostra "Acesso negado" — em
qualquer porta local, com qualquer conta, mesmo com o dashboard rodando perfeitamente via
`npm run dev`.

**2. O fallback óbvio (rodar o Supabase local) também não está de pé.** `docker ps` retorna
que o Docker Desktop não está rodando. Levantar Supabase local exige subir o Docker
primeiro — não testado se o resto da stack local (migrations, seeds, secrets) está
configurado depois disso, porque nem chegou a esse ponto.

## Consequência

**Toda validação de mudança de frontend até hoje foi feita direto em produção** — seja
lendo/injetando CSS numa aba logada de `pro.ybytu.app`, seja publicando e testando depois.
Não existe hoje um caminho de "testar antes de expor pra usuário real" para o dashboard.
Isso é candidato real a por que bugs de UI/renderização aparecem tarde: a única forma de
ver o efeito real de uma mudança é ela já estar na frente de alguém.

## Débito relacionado, mesma sessão

**Diálogo nativo de impressão do Chrome bloqueia automação.** Tentei confirmar visualmente
o efeito de uma mudança de CSS de impressão via `Page.captureScreenshot` depois de clicar
em "Salvar PDF" — o diálogo nativo do SO trava o CDP (mesma classe de bloqueio que
`alert()`/modais nativos). `Page.printToPDF` do CDP resolveria isso (gera o PDF
programaticamente, sem abrir diálogo, permitindo inspecionar o resultado sem depender de
clique humano) — não implementado agora, fica registrado para quando fizer sentido investir
nisso.

## O que dá pra fazer sobre o CORS (não decidido, só registrado)

Uma allowlist com `http://localhost:*` (ou uma lista fixa de portas comuns de dev) resolve
o item 1 sem abrir CORS geral (`*`) — mas essa decisão é do time, não foi tomada aqui.
