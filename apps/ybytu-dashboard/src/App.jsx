import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingFallback from './components/LoadingFallback';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Login = lazy(() => import('./components/Login'));
const CreateAccount = lazy(() => import('./components/CreateAccount'));
const AcceptInvite = lazy(() => import('./components/AcceptInvite'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Campaign = lazy(() => import('./components/Campaign'));
const Users = lazy(() => import('./components/Users'));
const UserDetail = lazy(() => import('./components/UserDetail'));
const UserPlanPage = lazy(() => import('./components/UserPlanPage'));
const Subscriptions = lazy(() => import('./components/Subscriptions'));
const Exercises = lazy(() => import('./components/Exercises'));
const ExerciseEditor = lazy(() => import('./components/ExerciseEditor'));
const Trainings = lazy(() => import('./components/Trainings'));
const TrainingPlan = lazy(() => import('./components/TrainingPlan'));
const TrainingPlanCreator = lazy(() => import('./components/TrainingPlanCreator'));
const Equipment = lazy(() => import('./components/Equipment'));
const Foods = lazy(() => import('./components/Foods'));
const FoodEditor = lazy(() => import('./components/FoodEditor'));
const Meals = lazy(() => import('./components/Meals'));
const MealEditor = lazy(() => import('./components/MealEditor'));
const MealPlans = lazy(() => import('./components/MealPlans'));
const MealPlanCreator = lazy(() => import('./components/MealPlanCreator'));
const Account = lazy(() => import('./components/Account'));
const Tags = lazy(() => import('./components/Tags'));
const SharedPlan = lazy(() => import('./components/SharedPlan'));
const FailedPlans = lazy(() => import('./components/FailedPlans'));
const InviteStaff = lazy(() => import('./components/InviteStaff'));
const More = lazy(() => import('./components/More'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Rota pública — link compartilhável do plano, fora do login */}
          <Route path="/plano/:token" element={<SharedPlan />} />

          {/* Rotas protegidas pelo Layout */}
          <Route element={<DashboardLayout />}>
            {/* /campaign e /campaign/failed-plans NÃO são admin-only -- visão
                operacional aberta a todo staff, mesmo desenho de
                ybytu-pending-plan-reviews (fila pessoal vs. visão geral).
                Documentado no próprio backend: ybytu-campaign-stats/index.ts:6-10
                e ybytu-admin-failed-plans/index.ts:6-10 dizem explicitamente
                "visível pra qualquer staff ativo" -- nenhum dos dois exige
                requireRole. Só a AÇÃO de retry (ybytu-admin-retry-plan-generation)
                é admin-only, por isso invite-staff continua isolado abaixo.
                Corrigido 2026-09-13: o PR anterior endureceu pra admin-only
                sem saber que esse desenho já existia. */}
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/campaign/failed-plans" element={<FailedPlans />} />

            <Route element={<ProtectedRoute allowedRoles={['admin']} fallback="/dashboard" />}>
              <Route path="/campaign/invite-staff" element={<InviteStaff />} />
            </Route>

            {/* Rotas de Treino (Admin ou Personal) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'personal']} fallback="/dashboard" />}>
              <Route path="/trainings" element={<Trainings />} />
              <Route path="/trainings/:id" element={<TrainingPlan />} />
              <Route path="/training-creator/:id?" element={<TrainingPlanCreator />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercise-editor/:id?" element={<ExerciseEditor />} />
              <Route path="/equipment" element={<Equipment />} />
            </Route>

            {/* Rotas de Nutrição (Admin ou Nutricionista) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'nutricionista']} fallback="/dashboard" />}>
              <Route path="/foods" element={<Foods />} />
              <Route path="/food-editor/:id?" element={<FoodEditor />} />
              <Route path="/meals" element={<Meals />} />
              <Route path="/meal-editor/:id?" element={<MealEditor />} />
              <Route path="/meal-plans" element={<MealPlans />} />
              <Route path="/meal-plan-creator/:id?" element={<MealPlanCreator />} />
              <Route path="/tags" element={<Tags />} />
            </Route>

            {/* Rotas gerais acessíveis a todo Staff verificado */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/users/:id/plano" element={<UserPlanPage />} />
            <Route path="/review/:id" element={<UserDetail />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/account" element={<Account />} />
            <Route path="/more" element={<More />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;