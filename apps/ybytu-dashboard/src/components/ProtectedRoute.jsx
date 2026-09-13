import { Navigate, Outlet } from 'react-router-dom';
import { useStaff } from '../lib/staffContextCore';

export default function ProtectedRoute({ allowedRoles = [], fallback = '/dashboard' }) {
  const staff = useStaff();
  const roles = staff?.roles ?? [];

  // Admin has access to all protected areas
  if (roles.includes('admin')) {
    return <Outlet />;
  }

  // Check if staff has any of the allowed roles
  const hasAccess = allowedRoles.length === 0 || allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
