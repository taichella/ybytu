import { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { StaffContext } from '../lib/staffContextCore';

const ROLE_LABELS = {
  personal: 'Personal Trainer',
  nutricionista: 'Nutricionista',
  admin: 'Admin',
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
}

export default function Account() {
  const [theme, setTheme] = useState('dark');
  const [email, setEmail] = useState(null);
  // StaffContext.Provider carrega { fullName, roles } diretamente, sem
  // encapar num .staff -- ver comentário em UserDetail.jsx.
  const staff = useContext(StaffContext);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? null));
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const roleLabels = (staff?.roles ?? []).map((r) => ROLE_LABELS[r] || r);

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}><span>Configurações</span><span>/</span><span style={{ color: 'var(--text)' }}>Minha conta</span></div>
          <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>Minha Conta</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

          {/* Profile Hero -- dados reais do staff logado (StaffContext, preenchido
              pelo ybytu-whoami) + e-mail da sessão de auth. Removidas as abas
              Segurança/Preferências/Equipe: eram 100% mock (troca de senha, 2FA,
              sessões, notificações por e-mail, lista de equipe) sem nenhum backend
              por trás -- não existe function de listagem de staff, nem tabela de
              preferências de notificação. Regra da Taina: tela removida > dado
              falso. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', marginBottom: '22px' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '20px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '28px', color: '#fff', flexShrink: 0 }}>
              {initials(staff?.fullName)}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{staff?.fullName || '—'}</h1>
                {roleLabels.map((label) => (
                  <span key={label} style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16', textTransform: 'uppercase' }}>{label}</span>
                ))}
              </div>
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{email || '—'}</p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
