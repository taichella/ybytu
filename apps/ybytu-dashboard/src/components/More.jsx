import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StaffContext } from '../lib/staffContextCore';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';

const ROLE_LABELS = {
  personal: 'Personal Trainer',
  nutricionista: 'Nutricionista',
  admin: 'Admin Principal',
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
}

export default function More() {
  const navigate = useNavigate();
  const staff = useContext(StaffContext);
  const roles = staff?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isPersonal = roles.includes('personal');
  const isNutri = roles.includes('nutricionista');
  const [signingOut, setSigningOut] = useState(false);

  const roleText = roles.map((r) => ROLE_LABELS[r] || r).join(' · ') || 'Staff';

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '15px 18px',
    borderBottom: '1px solid var(--border)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* ===================== HEADER ===================== */}
      <header
        style={{
          height: '72px',
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            <span>Ybytu Admin</span>
            <span>/</span>
            <span style={{ color: 'var(--text)' }}>Mais</span>
          </div>
          <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>Mais opções</h2>
        </div>
        <ThemeToggle />
      </header>

      {/* ===================== MAIN ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Account Card */}
          <Link
            to="/account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '22px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#F55F16,#FF7A3D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#fff',
                fontSize: '19px',
                flexShrink: 0,
              }}
            >
              {initials(staff?.fullName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                {staff?.fullName || 'Minha Conta'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                {roleText} · Ver detalhes
              </p>
            </div>
            <span style={{ color: 'var(--muted)', display: 'flex', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </Link>

          {/* Gestão */}
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Gestão
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '22px' }}>
            <Link to="/users" style={itemStyle}>
              <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Usuários</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Base de alunos, status e perfis</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
            </Link>

            {isAdmin && (
              <Link to="/campaign" style={itemStyle}>
                <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,95,22,.14)', color: '#F55F16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Campanha</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Métricas, convites e planos gerados</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            )}

            <Link to="/subscriptions" style={{ ...itemStyle, borderBottom: 'none' }}>
              <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,95,22,.14)', color: '#F55F16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Assinaturas</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Planos e faturamento no WooCommerce</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          </div>

          {/* Módulo Treino */}
          {(isAdmin || isPersonal) && (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Módulo Treino
              </p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '22px' }}>
                <Link to="/trainings" style={itemStyle}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,95,22,.14)', color: '#F55F16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Planos de Treino</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Fichas e moldes de treino</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>

                <Link to="/exercises" style={itemStyle}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,95,22,.14)', color: '#F55F16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 14.14 14.14" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Exercícios</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Biblioteca de movimentos e mídias</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>

                <Link to="/equipment" style={{ ...itemStyle, borderBottom: 'none' }}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168,85,247,.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Equipamentos</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Catálogo de aparelhos e pesos</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>
              </div>
            </>
          )}

          {/* Módulo Nutrição */}
          {(isAdmin || isNutri) && (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Módulo Nutrição
              </p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '22px' }}>
                <Link to="/foods" style={itemStyle}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(22,163,74,.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z" /><path d="M10 2c1 .5 2 2 2 5" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Alimentos</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Tabela nutricional e gramaturas</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>

                <Link to="/meals" style={itemStyle}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(22,163,74,.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Refeições & Receitas</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Preparo e macronutrientes</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>

                <Link to="/meal-plans" style={itemStyle}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(22,163,74,.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Planos Alimentares</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Distribuição calórica diária</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>

                <Link to="/tags" style={{ ...itemStyle, borderBottom: 'none' }}>
                  <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Tags & Categorias</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Classificação de alimentos e restrições</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
                </Link>
              </div>
            </>
          )}

          {/* Sistema & Sair */}
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Sistema
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <Link to="/account" style={itemStyle}>
              <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Minha Conta</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Dados de perfil e permissões</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}><path d="m9 18 6-6-6-6" /></svg>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                ...itemStyle,
                borderBottom: 'none',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: signingOut ? 'default' : 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239,68,68,.12)', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--danger, #ef4444)' }}>
                  {signingOut ? 'Saindo…' : 'Sair da Conta'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Encerrar sessão neste dispositivo</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
