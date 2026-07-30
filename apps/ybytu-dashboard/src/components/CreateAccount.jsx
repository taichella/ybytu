import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CreateAccount() {
  const navigate = useNavigate();
  
  // UI States[cite: 3]
  const [theme, setTheme] = useState('dark');
  const [flow, setFlow] = useState('pro'); // 'pro' ou 'invite'
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [companyOrCode, setCompanyOrCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    // Registro no Supabase passando dados adicionais
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: flow === 'pro' ? 'admin' : 'invited_user',
          company_or_code: companyOrCode
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      // Por padrão, o Supabase envia um email de confirmação.
      // Você pode desativar isso no painel (Authentication > Providers > Email).
      navigate('/login');
    }
  };

  const isPro = flow === 'pro';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)' }}>
      
      {/* ===================== BRAND PANEL ===================== */}
      <div className="yb-brandpanel" style={{ flex: '0 0 44%', position: 'relative', overflow: 'hidden', display: 'none', background: 'linear-gradient(150deg,#F55F16 0%,#FF7A3D 60%,#ff8c52 100%)', color: '#fff', padding: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 20% 0%,rgba(255,255,255,.18),transparent 55%)' }}></div>
        <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-70px', bottom: '-60px', width: '430px', height: 'auto', opacity: '.13', color: '#fff', animation: 'ybFloat 9s ease-in-out infinite' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg viewBox="119 94 275 323" style={{ width: '34px', height: 'auto', color: '#fff' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
            <span style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '.12em' }}>YBYTU</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.15em', background: 'rgba(255,255,255,.2)', padding: '3px 8px', borderRadius: '6px' }}>ADMIN</span>
          </div>
          <div>
            <h2 style={{ fontSize: '40px', lineHeight: 1.05, fontWeight: 900, margin: '0 0 18px', textWrap: 'balance' }}>Comece a gerir<br/>o seu ecossistema.</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: .92, maxWidth: '380px', margin: '0 0 28px', fontWeight: 400 }}>Crie sua conta e tenha acesso à gestão de usuários, planos, treinos e nutrição.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 500 }}><span style={{ display: 'inline-flex', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>Gestão completa de assinaturas</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 500 }}><span style={{ display: 'inline-flex', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>Banco de exercícios e alimentos</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 500 }}><span style={{ display: 'inline-flex', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>Relatórios e métricas em tempo real</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', opacity: .8, margin: 0, fontWeight: 500 }}>© Ybytu 2026 · Plataforma de treino & nutrição</p>
        </div>
      </div>

      {/* ===================== FORM PANEL ===================== */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative' }}>
        <button onClick={toggleTheme} title="Alternar tema" style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
          )}
        </button>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'var(--brand)', color: '#fff' }}><svg viewBox="119 94 275 323" style={{ width: '20px', height: 'auto' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg></span>
            <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '.04em' }}>Ybytu <span style={{ color: 'var(--brand)', fontSize: '11px' }}>ADMIN</span></span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 6px' }}>Criar conta</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 22px' }}>Configure seu acesso ao painel administrativo.</p>

          <div style={{ display: 'flex', gap: '6px', padding: '5px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '24px' }}>
            <button type="button" onClick={() => setFlow('pro')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '9px', borderRadius: '8px', background: isPro ? 'var(--surface)' : 'transparent', color: isPro ? 'var(--brand)' : 'var(--muted)', boxShadow: isPro ? '0 1px 3px rgba(0,0,0,.12)' : 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Sou profissional
            </button>
            <button type="button" onClick={() => setFlow('invite')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '9px', borderRadius: '8px', background: !isPro ? 'var(--surface)' : 'transparent', color: !isPro ? 'var(--brand)' : 'var(--muted)', boxShadow: !isPro ? '0 1px 3px rgba(0,0,0,.12)' : 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2 15 8M21 2v4h-4M3 6a3 3 0 0 1 3-3h3l2 4-2 1.5a12 12 0 0 0 5 5L15 16l4 2v3a3 3 0 0 1-3 3A16 16 0 0 1 3 6Z"></path></svg> Tenho convite
            </button>
          </div>

          {!isPro && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '12px', background: 'var(--brand-soft)', border: '1px solid rgba(245,95,22,.25)', marginBottom: '18px' }}>
              <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0, marginTop: '1px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg></span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>Você foi convidado para uma equipe. Informe o código recebido por e-mail para entrar com as permissões corretas.</p>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Nome completo</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                <input type="text" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '13px 16px 13px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>{isPro ? 'Empresa / Organização' : 'Código de convite'}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>
                  {isPro ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M12 14h.01M16 14h.01M8 14h.01"></path></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 7h16M4 7a2 2 0 0 0-2 2v2a1 1 0 0 0 1 1 1 1 0 0 1 0 2 1 1 0 0 0-1 1v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a1 1 0 0 0-1-1 1 1 0 0 1 0-2 1 1 0 0 0 1-1V9a2 2 0 0 0-2-2"></path></svg>}
                </span>
                <input type="text" placeholder={isPro ? "Studio, academia ou consultório" : "YB-XXXX-XXXX"} value={companyOrCode} onChange={(e) => setCompanyOrCode(e.target.value)} required style={{ width: '100%', padding: '13px 16px 13px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none', textTransform: isPro ? 'none' : 'uppercase' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg></span>
                <input type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '13px 16px 13px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '13px 42px 13px 16px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPw ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Confirmar</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw2 ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '13px 42px 13px 16px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPw2(!showPw2)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPw2 ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                  </button>
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', lineHeight: 1.5, fontWeight: 500, marginTop: '2px' }}>
              <input type="checkbox" required style={{ width: '17px', height: '17px', accentColor: 'var(--brand)', marginTop: '1px', flexShrink: 0 }} />
              <span>Li e aceito os <Link to="#" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Termos de Uso</Link> e a <Link to="#" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Política de Privacidade</Link>.</span>
            </label>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
              {loading ? 'Processando...' : (isPro ? 'Criar conta' : 'Ativar acesso')} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', margin: '22px 0 0' }}>Já tem uma conta? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link></p>
        </div>
      </div>
    </div>
  );
}