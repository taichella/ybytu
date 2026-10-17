import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import YbytuLogo from './YbytuLogo';
import '../user.css';

// Suporte por e-mail (2026-10-17): o WhatsApp está desligado (docs/POS_PILOTO.md,
// "WhatsApp FORA"), e quem está esperando o plano não pode ficar sem canal.
const SUPPORT_EMAIL = 'contato@ybytu.app';

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
    <div className="user-pwa-container user-blocked-page" style={{ justifyContent: 'center' }}>
      <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Ícone de Status do Protótipo */}
        <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
          <div className="blocked-wait-icon" style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'var(--yb-brand-soft, rgba(245,95,22,.10))',
            color: 'var(--yb-brand, #F55F16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <p className="user-kicker" style={{ marginBottom: '6px' }}>
          Status do Plano
        </p>

        <h1 style={{
          fontSize: '22px',
          fontWeight: 900,
          margin: '0 0 10px',
          color: 'var(--yb-text, #1A202C)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Plano em Preparação
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--yb-muted, #718096)',
          lineHeight: 1.55,
          fontWeight: 600,
          margin: '0 0 24px',
        }}>
          Nossa equipe de treinadores e nutricionistas está revisando sua rotina individualizada. Assim que tudo for aprovado, você receberá um aviso por e-mail e o plano será liberado aqui.
        </p>

        <div className="user-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Meu plano ainda está em preparação')}&body=${encodeURIComponent('Olá! Acessei o app Ybytu e meu plano ainda está em preparação. Poderiam verificar?')}`}
            className="checkin-btn primary"
            style={{ textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-10 6L2 7"></path>
            </svg>
            Falar com o suporte por e-mail
          </a>

          <button
            type="button"
            onClick={handleRetry}
            style={{
              width: '100%',
              background: 'var(--yb-surface-2, #F1F5F9)',
              color: 'var(--yb-text, #1A202C)',
              border: '1px solid var(--yb-border, #E2E8F0)',
              borderRadius: 'var(--yb-radius-btn, 14px)',
              padding: '15px 16px',
              fontSize: '13.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
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
              fontWeight: 700,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            ← Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
}
