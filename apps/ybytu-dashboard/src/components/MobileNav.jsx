import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StaffContext } from '../lib/staffContextCore';

export default function MobileNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const staff = useContext(StaffContext);
  const roles = staff?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isPersonal = roles.includes('personal');
  const isNutri = roles.includes('nutricionista');

  // Lógica para acender a aba Treino
  const isTreinoActive = currentPath.includes('/exercises') || currentPath.includes('/trainings') || currentPath.includes('/training-creator');
  
  // Lógica para acender a aba Nutrição
  const isNutriActive = currentPath.includes('/foods') || currentPath.includes('/meals') || currentPath.includes('/meal-plans');

  const mobClass = (isActive) => isActive
    ? { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', fontSize:'10.5px', fontWeight:800, textDecoration:'none', padding:'2px 0', color:'var(--brand)' }
    : { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', fontSize:'10.5px', fontWeight:700, textDecoration:'none', padding:'2px 0', color:'var(--muted)' };

  return (
    <nav className="yb-mnav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 70, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 8px calc(10px + env(safe-area-inset-bottom))', justifyContent: 'space-between', boxShadow: '0 -4px 20px rgba(0,0,0,.10)' }}>
      <Link to="/dashboard" style={mobClass(currentPath.includes('/dashboard'))}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
        <span>Início</span>
      </Link>
      {(isAdmin || isPersonal) && (
        <Link to="/trainings" style={mobClass(isTreinoActive)}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          <span>Treino</span>
        </Link>
      )}
      {(isAdmin || isNutri) && (
        <Link to="/foods" style={mobClass(isNutriActive)}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
          <span>Nutrição</span>
        </Link>
      )}
      <Link to="/users" style={mobClass(currentPath.includes('/users'))}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        <span>Usuários</span>
      </Link>
    </nav>
  );
}