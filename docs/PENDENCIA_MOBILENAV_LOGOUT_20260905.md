# Pendência: logout inalcançável no mobile (não urgente)

Achado 2026-09-05, comparando `designs/MobileNav.dc.html` contra `MobileNav.jsx`.

## O que é

O menu de navegação mobile (`MobileNav.jsx`) tem 4 itens — Início, Treino (admin/personal),
Nutrição (admin/nutricionista), Usuários. O mockup tem um 5º item, **"Mais"**, que não existe na
implementação — nem o item de menu, nem a tela que ele levaria (`designs/Mais.dc.html` também não
tem componente nem rota, mesma situação de `Notificacoes.dc.html`).

Hoje `/account` só é alcançável pelo Sidebar (desktop) — que fica escondido via CSS em viewport
mobile. **Resultado prático: qualquer staff usando o dashboard pelo celular não tem nenhum jeito
de chegar em `/account`, e é lá que mora o único botão de logout do app inteiro.**

## Por que não bloqueia a Sessão 1

Verificado explicitamente: os dois papéis que respondem a Sessão 1 (personal, nutricionista) têm
acesso mobile às telas que importam pro trabalho deles — "Treino" cobre `/exercises`,
`/trainings`, `/training-creator`; "Nutrição" cobre `/foods`, `/meals`, `/meal-plans`. A revisão
em si acontece fora do dashboard (os documentos de sessão enviados por WhatsApp/e-mail, pensados
pra abrir no celular sem precisar logar em nada). Nenhum dos dois precisa de `/account` pra
completar a Sessão 1.

## Por que ainda é bug real

Se algum staff usar um celular compartilhado, precisar trocar de conta, ou simplesmente quiser
sair da sessão no próprio aparelho, não tem como — precisaria editar a URL manualmente
(`/account`) pra alcançar o botão. Não é hipotético: é a única forma de logout do produto inteiro,
inacessível numa plataforma inteira (mobile).

## Prioridade

Não urgente — não bloqueia o piloto nem a Sessão 1. Fica registrado pra entrar quando alguém
mexer no `MobileNav.jsx`/`Mais.dc.html` (que também não tem implementação — mesma decisão
pendente de Notificações: construir "Mais" de verdade, ou resolver o caso mínimo — só o link de
logout acessível de algum jeito no mobile, sem precisar da tela inteira do mockup).
