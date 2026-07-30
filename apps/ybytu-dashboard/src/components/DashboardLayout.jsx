import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { supabase } from '../lib/supabase';
import { StaffProvider } from '../lib/StaffContext';

// Guard real das rotas do painel. Antes disso não havia checagem nenhuma
// aqui (era só <Sidebar/><Outlet/><MobileNav/> — o comentário "rotas
// protegidas" em App.jsx era falso). Fechado em 2026-07-30, ver
// [[project_staff_role_system_design]].
export default function DashboardLayout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'denied'
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setStatus('denied');
        return;
      }

      const { data: whoami, error } = await supabase.functions.invoke('ybytu-whoami', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (cancelled) return;

      if (error || !whoami?.isStaff) {
        setStatus('denied');
        return;
      }

      setStaff({ fullName: whoami.fullName, roles: whoami.roles });
      setStatus('ok');
    }

    checkAccess();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (status === 'denied') {
      supabase.auth.signOut().finally(() => navigate('/login', { replace: true }));
    }
  }, [status, navigate]);

  if (status !== 'ok') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: '14px' }}>
        Verificando acesso…
      </div>
    );
  }

  return (
    <StaffProvider value={staff}>
      <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar />
        <div className="yb-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Outlet />
        </div>
        <MobileNav />
      </div>
    </StaffProvider>
  );
}
