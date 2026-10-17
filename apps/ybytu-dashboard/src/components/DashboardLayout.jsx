import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { supabase } from '../lib/supabase';
import { StaffProvider } from '../lib/StaffContext';
import { emailHealthService } from '../services/emailHealthService.js';

const EMAIL_HEALTH_REFRESH_MS = 5 * 60_000;

// Banner vermelho de falha de e-mail (2026-10-11): o e-mail é o caminho
// crítico com o WhatsApp fora, e uma falha do Resend não pode ficar
// invisível como ficou a do WhatsApp. Só para admin (a function exige o
// papel). Erro ao consultar não mostra banner -- não é a falha que ele vigia.
function EmailHealthBanner() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => emailHealthService.get()
      .then((data) => { if (!cancelled) setHealth(data); })
      .catch(() => {});
    load();
    const timer = setInterval(load, EMAIL_HEALTH_REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const failures = health?.recent_failures?.length ?? 0;
  const students = health?.students_without_link?.length ?? 0;
  const crons = health?.cron_failures?.length ?? 0;
  // Plano não gerado (2026-10-17): faixa própria, aparece desde a primeira falha
  // e some quando uma nova tentativa der certo (_shared/planFailureAlert.ts).
  const planFailures = health?.plan_failures?.length ?? 0;
  const emailProblem = !!health && (!!health.open_alert || failures > 0 || students > 0 || crons > 0);
  if (!emailProblem && planFailures === 0) return null;

  const planBanner = planFailures > 0 && (
    <div role="alert" style={{ background: '#dc2626', color: '#fff', padding: '10px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderBottom: emailProblem ? '1px solid rgba(255,255,255,.35)' : 'none' }}>
      <span>⚠️ {planFailures === 1 ? '1 aluno sem plano: a geração falhou' : `${planFailures} alunos sem plano: a geração falhou`}{planFailures === 1 && health.plan_failures[0].reason ? ` (${health.plan_failures[0].reason})` : ''}.</span>
      <Link to="/campaign/failed-plans" style={{ color: '#fff', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Ver planos que falharam</Link>
    </div>
  );
  if (!emailProblem) return planBanner;

  const parts = [];
  if (failures) parts.push(`${failures} envio(s) de e-mail com falha nas últimas ${health.failure_window_hours}h`);
  if (students) parts.push(`${students} aluno(s) com plano aprovado sem o link`);
  // Cron recusado (401/403): o próprio vigia pode estar parado (achado 2026-10-11).
  if (crons) parts.push(`${crons} tarefa(s) automática(s) sendo recusada(s) nas últimas ${health.cron_failure_window_hours}h`);
  if (parts.length === 0) parts.push('incidente de e-mail ainda aberto, aguardando a próxima verificação');

  return (
    <>
    {planBanner}
    <div role="alert" style={{ background: '#dc2626', color: '#fff', padding: '10px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <span>⚠️ {crons && !failures && !students ? 'Falha nas tarefas automáticas' : 'Falha no envio de e-mails'}: {parts.join(' e ')}.</span>
      <Link to="/campaign/email-alerts" style={{ color: '#fff', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Ver detalhes</Link>
    </div>
    </>
  );
}

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
      <div className="yb-shell" style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar />
        <div className="yb-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {staff?.roles?.includes('admin') && <EmailHealthBanner />}
          <Outlet />
        </div>
        <MobileNav />
      </div>
    </StaffProvider>
  );
}
