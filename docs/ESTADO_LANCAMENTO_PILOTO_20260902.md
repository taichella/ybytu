# Estado do lançamento do piloto (2026-09-02)

Uma página, três colunas — o que falta e em quem está travado.

## Código (Claude resolve)

| Item | Status |
|---|---|
| Badge de alérgeno derivado | ✅ Deployado e validado com dado real na página pública (`/plano/:token`) |
| CORS `www.ybytu.app` | ✅ Já estava corrigido — `ybytu.app` e `www.ybytu.app` na allowlist |
| `/reset-password` | ✅ Já estava resolvido (21/08) — rota existe, fluxo completo, memória antiga estava desatualizada |
| `meal_type` sem CHECK constraint | ✅ Aplicada, zero violação, commitada |
| Dropdown `dessert` morto no editor | ✅ Removido, commitado |
| **Tela de staff (`/users/:id/plano`, `/dashboard`) travada** | 🔴 **Novo achado, não investigado.** Erro "Edge Function returned a non-2xx status code" + stats presos em "carregando". Suspeita forte: sessão expirada na aba de teste (a mesma function funciona perfeita via token público) — mas não confirmei, precisa de sessão de staff fresca pra descartar bug real. |
| `service_role` — quem usa fora do Supabase | 🟡 Rotação em si não quebra nada no código (chave gerida pela plataforma, propaga sozinha). Não consigo garantir que não existe uso hardcoded fora do Supabase. |

## Terceiro (Meta, OVH, Resend — fora do meu alcance de verificação)

| Item | Status |
|---|---|
| Domínio verificado no Resend | 🟡 **Inconclusivo.** O código já manda de `onboarding@send.ybytu.app` (não é mais o sandbox `resend.dev` — isso já foi corrigido em algum momento). Mas não consegui confirmar se o domínio está de fato *verificado* no Resend: a `RESEND_API_KEY` configurada é restrita a "só enviar e-mail", sem permissão de consultar `/domains`. Só o painel do Resend mostra isso — preciso que você confirme lá, ou eu posso propor um envio de teste se quiser confirmar por esse caminho. |
| Registros DNS pendentes na OVH | 🟡 Não consegui listar (dependia do endpoint de domínios do Resend, bloqueado pela chave restrita). Se você abrir o painel do Resend → Domains → `send.ybytu.app`, os registros TXT/DKIM/MX que faltarem aparecem lá prontos pra copiar. |
| Número WhatsApp fora de análise da Meta | ⏳ Você está checando |
| Domínio `ybytu.app` com HTTPS funcional na OVH | ⏳ Você está checando |

## Nutricionista

| Item | Status | Decisões |
|---|---|---|
| `docs/SESSAO_1_NUTRICIONISTA_20260902.md` | 🔴 **Bloqueia o cardápio hoje** — enviar e aguardar resposta | ~57 |
| Tudo o mais (Parte 1/2 restante, 190 `unreviewed` sem uso ativo, 7 receitas veganas, pedido de receitas novas, moqueca, auditoria de instruções) | 🟢 Sessão 2, não bloqueia lançamento | ~350+ |

## O que isso significa pra ordem de trabalho

1. **Agora:** você confirma WhatsApp/OVH (em paralelo) e decide sobre Resend/DNS; eu investigo a tela de staff travada se quiser que eu continue.
2. **Depois:** envia a Sessão 1 pra nutricionista.
3. **Só depois dos itens de terceiro resolvidos + Sessão 1 respondida:** teste E2E com usuário real — antes disso, qualquer falha pode ser infra, não produto, e não vai dizer nada útil.
