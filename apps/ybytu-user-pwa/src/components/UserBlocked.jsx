import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import YbytuLogo from './YbytuLogo';
import '../user.css';

const WHATSAPP_SUPPORT_NUMBER = '5511955026812';

export default function UserBlocked() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const handleRetry = () => {
    navigate('/hoje');
  };

  return (
    <div className="user-pwa-container" style={{ justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Ícone de status */}
        <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--yb-brand-soft, rgba(245,95,22,.10))',
            color: 'var(--yb-brand, #F55F16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: 'var(--yb-text, #1A202C)' }}>
          Plano em Preparação
        </h1>

        <p style={{ fontSize: '14px', color: 'var(--yb-muted, #718096)', lineHeight: 1.5, margin: '0 0 24px' }}>
          A equipe pro de treinadores e nutricionistas está finalizando o planejamento individualizado da sua rotina. Assim que seu plano for liberado, ele aparecerá aqui automaticamente.
        </p>

        <div className="user-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent('Olá! Acessei o app Ybytu e meu plano ainda está em preparação. Poderiam verificar?')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="checkin-btn primary"
            style={{ textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Falar com suporte no WhatsApp
          </a>

          <button
            type="button"
            className="user-tab-btn"
            onClick={handleRetry}
            style={{ background: 'var(--yb-surface-2, #F1F5F9)', color: 'var(--yb-text, #1A202C)' }}
          >
            Verificar se o plano já está pronto
          </button>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--yb-muted, #718096)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
}
