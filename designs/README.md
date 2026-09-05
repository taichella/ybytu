# Designs — referência de layout, não parte do build

Esta pasta guarda os mockups `*.dc.html` do dashboard — fonte da verdade de layout pra qualquer
tela que já tenha um mockup correspondente. Antes de implementar ou revisar uma tela, comparar
contra o arquivo daqui, linha a linha, não contra memória de como a tela "deveria" ficar.

**Não faz parte do build nem do deploy.** Fica na raiz do repositório, fora de
`apps/ybytu-dashboard` (o único diretório que o Vite empacota) e fora de `apps/ybytu-app`. Nenhum
desses arquivos deve aparecer em produção — são referência de design, não UI real.

## Onde os mockups são editados

**`C:\ybytu-pwa-admin` continua sendo a fonte de edição.** Esta pasta (`designs/`) é uma cópia
sincronizada manualmente, criada porque o Jules roda em sandbox e não enxerga `C:\ybytu-pwa-admin`
— sem essa cópia, ele não consegue auditar contra o design.

Não recomendamos inverter isso (fazer do repositório a fonte de edição) porque `C:\ybytu-pwa-admin`
tem infraestrutura de apoio que não foi copiada pra cá — `support.js`, `image-slot.js`,
`tokens.css`, `tokens.json` — usada pela ferramenta de edição visual pra renderizar os mockups de
verdade (os `<dc-import>` e o script `DCLogic` de cada arquivo dependem disso). Sem esses
arquivos, o que está em `designs/` é legível como referência de estrutura e texto, mas não
renderiza sozinho fora da ferramenta original.

**Isso cria uma superfície real de desatualização: duas cópias, sincronizadas à mão.** Sempre que
um mockup mudar em `C:\ybytu-pwa-admin`, alguém precisa lembrar de copiar de novo pra cá — não há
sincronização automática. Se isso não acontecer, um agente ou revisor consultando `designs/` vai
trabalhar em cima de uma versão desatualizada sem nenhum aviso.

**Mitigação simples, sem automação:** antes de pedir uma auditoria ou implementação que dependa de
um mockup específico, reconferir se ele mudou desde a última cópia (data de modificação do
arquivo em `C:\ybytu-pwa-admin` vs. data deste commit). Se a superfície de mudança de mockups
crescer, vale revisitar isso com um script pequeno em vez de cópia manual.

## Como recopiar depois de uma mudança

```
cp C:/ybytu-pwa-admin/*.dc.html designs/
```

Commitar depois — o diff do Git já mostra exatamente o que mudou no design desde a última
sincronização.

## Arquivos e telas que cobrem (27 mockups, sincronizados em 2026-09-05)

| Arquivo | Tela |
|---|---|
| `Login.dc.html` | Login |
| `EsqueciSenha.dc.html` | Esqueci minha senha |
| `CriarConta.dc.html` | Criar conta |
| `Dashboard.dc.html` | Dashboard (visão geral) |
| `Usuarios.dc.html` | Listagem de usuários |
| `UsuarioDetalhe.dc.html` | Detalhe do usuário (perfil, planos, atividade) |
| `Exercicios.dc.html` | Biblioteca de exercícios (tabela + grade) |
| `ExercicioEditor.dc.html` | Editor de exercício |
| `Treinos.dc.html` | Catálogo de planos de treino |
| `ConstrutorPlano.dc.html` | Construtor de plano de treino |
| `DetalhePlano.dc.html` | Detalhe de um plano de treino |
| `Alimentos.dc.html` | Biblioteca de alimentos |
| `AlimentoEditor.dc.html` | Editor de alimento |
| `Refeicoes.dc.html` | Catálogo de refeições |
| `RefeicaoEditor.dc.html` | Editor de refeição |
| `PlanosAlimentares.dc.html` | Catálogo de planos alimentares |
| `ConstrutorPlanoAlimentar.dc.html` | Construtor de plano alimentar |
| `Equipamentos.dc.html` | Cadastro de equipamentos |
| `Tags.dc.html` | Cadastro de tags |
| `Assinaturas.dc.html` | Assinaturas |
| `Conta.dc.html` | Conta do usuário |
| `Notificacoes.dc.html` | Notificações |
| `Mais.dc.html` | Menu "Mais" (mobile) |
| `Mobile.dc.html` | Layout mobile geral |
| `DesignSystem.dc.html` | Sistema de design (tokens, componentes-base) |
| `Sidebar.dc.html` | Componente compartilhado — barra lateral |
| `MobileNav.dc.html` | Componente compartilhado — navegação mobile |
