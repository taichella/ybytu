import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Cadastro de staff (admin/personal/nutricionista) deixou de ser auto-serviço.
// Antes essa tela deixava qualquer visitante se auto-atribuir role:'admin' em
// user_metadata (client-controlável, sem checagem nenhuma no servidor) — furo
// fechado em 2026-07-30 (ver [[project_staff_role_system_design]]). O único
// caminho pra criar conta de staff agora é /aceitar-convite/:token (function
// ybytu-redeem-staff-invite), gerado por um admin já autenticado.
export default function CreateAccount() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <button onClick={toggleTheme} title="Alternar tema" style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '14px', background: 'var(--brand-soft)', color: 'var(--brand)', marginBottom: '20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 10px' }}>Acesso só por convite</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px' }}>
          Contas do painel Ybytu (admin, personal, nutricionista) são criadas por convite de um administrador.
          Se você recebeu um link de convite, use-o diretamente. Caso contrário, peça a um administrador da equipe.
        </p>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '14px', padding: '13px 22px', borderRadius: '12px', textDecoration: 'none' }}>
          Ir para o login <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </Link>
      </div>
    </div>
  );
}
