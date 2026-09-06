# Não existe guard de rota no client (2026-09-01)

Achado validando a PR de filtro de navegação por papel (`Sidebar.jsx`/`MobileNav.jsx`,
mergeada em 2026-09-01). Registrado porque essa PR muda a leitura de quem olha de fora
sem mudar o comportamento real — e essa distinção precisa ficar explícita em algum lugar.

## O que existe e o que não existe

**Existe:** o menu (Sidebar/MobileNav) agora esconde itens que o papel logado não deveria
ver — admin vê tudo, personal só o módulo de treino (+ usuários/campanha, sempre
visíveis), nutricionista só o módulo de nutrição. Isso é renderização condicional pura,
`roles.includes('admin') || ...`, papel vindo de `ybytu-whoami` via `StaffContext`.

**Não existe:** nenhum componente de guard de rota no client. Busquei
`ProtectedRoute`/`RequireRole`/qualquer coisa equivalente no roteador
(`apps/ybytu-dashboard/src`) — não há nada que impeça um usuário autenticado de navegar
direto pra uma URL fora do seu papel. Um personal trainer que digite (ou tenha salvo)
`/subscriptions` chega na tela normalmente — o React Router não pergunta se ele pode
estar ali.

## Por que isso não vaza dado hoje

Porque a barreira real é do lado do servidor. Cada edge function de admin resolve o
staff a partir do token (`resolveStaffFromRequest`) e exige o papel certo antes de
devolver qualquer coisa — ex: `ybytu-admin-users/index.ts:24`,
`requireRole(auth.staff, 'admin') || requireRole(auth.staff, 'personal') || requireRole(auth.staff, 'nutricionista')`.
A tela de `/subscriptions` até renderiza pro personal, mas a chamada que busca os dados
reais é recusada pelo servidor — o personal vê um esqueleto de tela vazio/com erro, não
o conteúdo.

## O risco real

**Hoje, nenhum.** A PR de filtro de menu não piora nem melhora esse ponto — ela só torna
o menu mais parecido com controle de acesso pra quem olha de fora, o que é exatamente o
risco: alguém (dev novo, auditoria, o próprio Jules numa PR futura) pode olhar pro menu
filtrado e assumir que aquilo É a barreira, e parar de reforçar `requireRole` numa edge
function nova assumindo que "o menu já esconde". Se isso acontecer, aí sim vaza dado.

## O que falta (não implementado agora, só registrado)

Um guard de rota no client (`ProtectedRoute` ou equivalente, checando `staff.roles`
antes de renderizar a página, com redirect ou tela de "sem permissão" em vez de deixar
renderizar e falhar na busca de dados) resolveria a experiência — hoje o personal vê uma
tela quebrada em vez de um "você não tem acesso" claro. É melhoria de UX/robustez, não
correção de vulnerabilidade: o dado já está protegido pelo servidor independente disso.
