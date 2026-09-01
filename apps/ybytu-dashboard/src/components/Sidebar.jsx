import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const staff = useContext(StaffContext);
  const roles = staff?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isPersonal = roles.includes('personal');
  const isNutri = roles.includes('nutricionista');

  const roleLabel = roles.map((r) => ROLE_LABELS[r] || r).join(' · ');

  const navClass = (path) => currentPath.includes(path) 
    ? { display:'flex', alignItems:'center', gap:'12px', padding:'11px 22px', fontSize:'14px', fontWeight:700, color:'var(--brand)', background:'var(--brand-soft)', borderRight:'3px solid var(--brand)', textDecoration:'none' }
    : { display:'flex', alignItems:'center', gap:'12px', padding:'11px 22px', fontSize:'14px', fontWeight:600, color:'var(--text)', textDecoration:'none' };

  return (
    <aside className="yb-side" style={{ width: '260px', flexShrink: 0, height: '100%', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '72px', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'var(--brand)', color: '#fff', boxShadow: '0 4px 12px rgba(245,95,22,.3)' }}>
          <svg viewBox="119 94 275 323" style={{ width: '20px', height: 'auto' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
        </span>
        <span style={{ fontWeight: 900, fontSize: '17px', letterSpacing: '.02em', color: 'var(--text)' }}>Ybytu <span style={{ color: 'var(--brand)', fontSize: '10px', fontWeight: 800 }}>ADMIN</span></span>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '18px 0' }}>
        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 22px', margin: '8px 0 8px' }}>Visão Geral</p>
        <Link to="/campaign" style={navClass('/campaign')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><circle cx="12" cy="12" r="9"></circle></svg> Campanha
        </Link>
        <Link to="/dashboard" style={navClass('/dashboard')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg> Dashboard
        </Link>

        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 22px', margin: '20px 0 8px' }}>Gestão</p>
        <Link to="/users" style={navClass('/users')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Usuários
        </Link>
        {isAdmin && (
          <Link to="/subscriptions" style={navClass('/subscriptions')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg> Assinaturas
          </Link>
        )}

        {(isAdmin || isPersonal) && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 22px', margin: '20px 0 8px' }}>Módulo Treino</p>
            <Link to="/exercises" style={navClass('/exercises')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"></path></svg> Exercícios
            </Link>
            <Link to="/trainings" style={navClass('/trainings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Treinos (Planos)
            </Link>
            <Link to="/equipment" style={navClass('/equipment')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg> Equipamentos
            </Link>
          </>
        )}

        {(isAdmin || isNutri) && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 22px', margin: '20px 0 8px' }}>Módulo Nutrição</p>
            <Link to="/foods" style={navClass('/foods')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg> Alimentos
            </Link>
            <Link to="/meals" style={navClass('/meals')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg> Refeições
            </Link>
            <Link to="/meal-plans" style={navClass('/meal-plans')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H3v10h6V11ZM21 3h-6v18h6V3ZM15 7H9v14h6V7Z"></path></svg> Planos Alimentares
            </Link>
            <Link to="/tags" style={navClass('/tags')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle></svg> Tags
            </Link>
          </>
        )}
      </nav>

      <div style={{ padding: '14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <Link to="/account" style={navClass('/account')}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '15px', flexShrink: 0 }}>{initials(staff?.fullName)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff?.fullName || '—'}</p>
            <p style={{ margin: '1px 0 0', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleLabel || 'Ver minha conta'}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}