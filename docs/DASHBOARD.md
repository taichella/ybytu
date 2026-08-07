# Dashboard Pro - Documentação de Telas

Este documento lista todas as telas do painel de administração (`pro.ybytu.app`), mapeando seu estado atual (se possuem integração real com o backend ou se operam com dados "mockados"). O objetivo é manter um controle do progresso de integração com o Supabase.

## Visão Geral

| Tela / Componente | Rota | Status de Integração | Edge Function Principal | Perfis de Acesso |
|---|---|---|---|---|
| Login | `/login` | ✅ Real | `ybytu-whoami` | Qualquer staff |
| CreateAccount | `/create-account` | 🛑 Obsoleta/Desativada | N/A | N/A |
| AcceptInvite | `/aceitar-convite/:token` | ✅ Real | `ybytu-redeem-staff-invite` | Novo staff |
| ForgotPassword | `/forgot-password` | ✅ Real | Auth Nativo | Qualquer staff |
| DashboardLayout | (Layout) | ✅ Real | `ybytu-whoami` | Qualquer staff |
| Dashboard | `/dashboard` | ❌ Mock | N/A | Qualquer staff |
| Users | `/users` | ❌ Mock | N/A | Qualquer staff |
| UserDetail | `/users/:id` | ❌ Mock | N/A | Qualquer staff |
| Subscriptions | `/subscriptions` | ❌ Mock | N/A | admin |
| More | `/more` | ✅ Real (Layout) | N/A | Qualquer staff |
| Exercises | `/exercises` | ✅ Real | `exerciseService.js` | admin, personal |
| ExerciseEditor | `/exercise-editor/:id?` | ✅ Real | `exerciseService.js` | admin, personal |
| Trainings | `/trainings` | ❌ Mock | N/A | admin, personal |
| TrainingPlan | `/trainings/:id` | ❌ Mock | N/A | admin, personal |
| TrainingPlanCreator | `/training-creator/:id?` | ❌ Mock | N/A | admin, personal |
| Equipment | `/equipment` | ❌ Mock | N/A | admin |
| Foods | `/foods` | ❌ Mock | N/A | admin, nutricionista |
| FoodEditor | `/food-editor/:id?` | ❌ Mock | N/A | admin, nutricionista |
| Meals | `/meals` | ❌ Mock | N/A | admin, nutricionista |
| MealEditor | `/meal-editor/:id?` | ❌ Mock | N/A | admin, nutricionista |
| MealPlans | `/meal-plans` | ❌ Mock | N/A | admin, nutricionista |
| MealPlanCreator | `/meal-plan-creator/:id?` | ❌ Mock | N/A | admin, nutricionista |
| Account | `/account` | ❌ Mock | N/A | admin |
| Tags | `/tags` | ❌ Mock | N/A | admin |
| SharedPlan | `/plano/:token` | ✅ Real | `ybytu-get-plan-payload` | Público (via Token) |
| UserPlan | (Usado pelo SharedPlan) | ✅ Real | Renderiza payload | Público (via Token) |

---

## Detalhamento das Telas

### Login (`Login.jsx`)
- **Rota:** `/login`
- **Descrição:** Tela de autenticação dos profissionais da plataforma.
- **Integração:** Real
- **Serviço/Function:** `supabase.auth.signInWithPassword` + `ybytu-whoami`
- **Acesso:** Qualquer staff registrado.
- **Tabelas acessadas:** `auth.users`, `staff`, `staff_roles`

### Create Account (`CreateAccount.jsx`)
- **Rota:** `/create-account`
- **Descrição:** Criação direta de conta (inativa para evitar bypass do painel de convite de staff).
- **Integração:** N/A (Apenas interface bloqueada).

### Accept Invite (`AcceptInvite.jsx`)
- **Rota:** `/aceitar-convite/:token`
- **Descrição:** Página onde o staff aceita convite via email/token para definir senha.
- **Integração:** Real
- **Serviço/Function:** `ybytu-redeem-staff-invite`
- **Acesso:** Acesso temporário pelo novo staff.
- **Tabelas acessadas:** `staff_invites`, `auth.users`, `staff`, `staff_roles`

### Forgot Password (`ForgotPassword.jsx`)
- **Rota:** `/forgot-password`
- **Descrição:** Fluxo de recuperação de senha por email.
- **Integração:** Real
- **Serviço/Function:** `supabase.auth.resetPasswordForEmail`
- **Acesso:** Qualquer pessoa logada ou não.

### Dashboard Layout (`DashboardLayout.jsx` / `Sidebar.jsx` / `MobileNav.jsx`)
- **Rota:** Layout wrapper
- **Descrição:** Estrutura base (sidebar e header móvel) protegida por sessão.
- **Integração:** Real
- **Serviço/Function:** `ybytu-whoami`
- **Acesso:** Qualquer staff logado.

### Dashboard (`Dashboard.jsx`)
- **Rota:** `/dashboard`
- **Descrição:** Visão geral de métricas, treinos e clientes ativos.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** Qualquer staff.

### Users (`Users.jsx`)
- **Rota:** `/users`
- **Descrição:** Lista de todos os clientes registrados.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** Qualquer staff.

### UserDetail (`UserDetail.jsx`)
- **Rota:** `/users/:id`
- **Descrição:** Perfil do cliente, contendo histórico de pagamentos, planos e avaliações.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** Qualquer staff.

### Subscriptions (`Subscriptions.jsx`)
- **Rota:** `/subscriptions`
- **Descrição:** Gestão de planos de assinatura e receita bruta.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin

### More (`More.jsx`)
- **Rota:** `/more`
- **Descrição:** Menu utilitário de navegação mobile para acessar as outras sessões.
- **Integração:** Real (Apenas navegação, sem dados)

### Exercises (`Exercises.jsx`)
- **Rota:** `/exercises`
- **Descrição:** Catálogo completo de exercícios do aplicativo.
- **Integração:** Real
- **Serviço/Function:** `exerciseService.js` (Lê da `exercises`)
- **Acesso:** admin, personal

### Exercise Editor (`ExerciseEditor.jsx`)
- **Rota:** `/exercise-editor/:id?`
- **Descrição:** Criação e edição de propriedades dos exercícios e vídeos.
- **Integração:** Real
- **Serviço/Function:** `exerciseService.js` (Escreve/Lê na `exercises`)
- **Acesso:** admin, personal

### Trainings (`Trainings.jsx`)
- **Rota:** `/trainings`
- **Descrição:** Lista de modelos e planos de treino base.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, personal

### Training Plan (`TrainingPlan.jsx`)
- **Rota:** `/trainings/:id`
- **Descrição:** Visão detalhada de um modelo de plano de treino.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, personal

### Training Plan Creator (`TrainingPlanCreator.jsx`)
- **Rota:** `/training-creator/:id?`
- **Descrição:** Interface interativa arrastar-e-soltar para desenhar novos treinos.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, personal

### Equipment (`Equipment.jsx`)
- **Rota:** `/equipment`
- **Descrição:** Gestão dos equipamentos e acessórios de academia.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin

### Foods (`Foods.jsx`)
- **Rota:** `/foods`
- **Descrição:** Base de dados nutricional central da TACO / USDA.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Food Editor (`FoodEditor.jsx`)
- **Rota:** `/food-editor/:id?`
- **Descrição:** Edição de macro/micronutrientes para alimentos da base.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Meals (`Meals.jsx`)
- **Rota:** `/meals`
- **Descrição:** Listagem de receitas construídas baseadas nos foods.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Meal Editor (`MealEditor.jsx`)
- **Rota:** `/meal-editor/:id?`
- **Descrição:** Composição dos ingredientes da refeição.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Meal Plans (`MealPlans.jsx`)
- **Rota:** `/meal-plans`
- **Descrição:** Listagem de planos de dieta genéricos e curados.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Meal Plan Creator (`MealPlanCreator.jsx`)
- **Rota:** `/meal-plan-creator/:id?`
- **Descrição:** Construtor de cardápio por horários e macros diários.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin, nutricionista

### Account (`Account.jsx`)
- **Rota:** `/account`
- **Descrição:** Definições do staff, incluindo segurança e gestão de permissões de novos staffs.
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin

### Tags (`Tags.jsx`)
- **Rota:** `/tags`
- **Descrição:** Dicionário geral de categorias (ex: restrições alimentares, funcionais, etc).
- **Integração:** Mock
- **Serviço/Function:** N/A
- **Acesso:** admin

### Shared Plan (`SharedPlan.jsx` / `UserPlan.jsx`)
- **Rota:** `/plano/:token`
- **Descrição:** Visualizador do plano final exportado para o utilizador.
- **Integração:** Real
- **Serviço/Function:** `ybytu-get-plan-payload`
- **Acesso:** Público (Via link com token ativo).
