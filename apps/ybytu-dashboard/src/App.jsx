import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import AcceptInvite from './components/AcceptInvite';
import ForgotPassword from './components/ForgotPassword';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import UserDetail from './components/UserDetail';
import Subscriptions from './components/Subscriptions';
import More from './components/More';
import Exercises from './components/Exercises';
import ExerciseEditor from './components/ExerciseEditor';
import Trainings from './components/Trainings';
import TrainingPlan from './components/TrainingPlan';
import TrainingPlanCreator from './components/TrainingPlanCreator';
import Equipment from './components/Equipment';
import Foods from './components/Foods';
import FoodEditor from './components/FoodEditor';
import Meals from './components/Meals';
import MealEditor from './components/MealEditor';
import MealPlans from './components/MealPlans';
import MealPlanCreator from './components/MealPlanCreator';
import Account from './components/Account';
import Tags from './components/Tags';
import SharedPlan from './components/SharedPlan';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/aceitar-convite/:token" element={<AcceptInvite />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Rota pública — link compartilhável do plano, fora do login */}
        <Route path="/plano/:token" element={<SharedPlan />} />

        {/* Rotas protegidas pelo Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/more" element={<More />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercise-editor/:id?" element={<ExerciseEditor />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/trainings/:id" element={<TrainingPlan />} />
          <Route path="/training-creator/:id?" element={<TrainingPlanCreator />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/food-editor/:id?" element={<FoodEditor />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/meal-editor/:id?" element={<MealEditor />} /> 
          <Route path="/meal-plans" element={<MealPlans />} /> 
          <Route path="/meal-plan-creator/:id?" element={<MealPlanCreator />} />     
          <Route path="/tags" element={<Tags />} /> 
          <Route path="/account" element={<Account />} />  
          
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;