import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Could be replaced with a better loading component
  }

  if (!user) {
    // Se não tiver logado, redireciona para o login
    return <Navigate to="/login" replace />;
  }

  // Se tiver logado, renderiza as rotas filhas
  return <Outlet />;
}
