import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const togglePw = () => setShowPw(!showPw);

const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // TRAVA DE SEGURANÇA: papel resolvido no servidor (nunca em user_metadata,
    // que o próprio usuário controla). ybytu-whoami consulta staff/staff_roles
    // via service_role.
    const accessToken = data.session?.access_token;
    let isStaff = false;
    try {
      const { data: whoami, error: whoamiError } = await supabase.functions.invoke('ybytu-whoami', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      isStaff = !whoamiError && whoami?.isStaff === true;
    } catch {
      isStaff = false;
    }

    if (!isStaff) {
      // Se for um usuário comum do App (ou a checagem falhou), desloga
      // imediatamente e mostra erro
      await supabase.auth.signOut();
      setError('Acesso negado. Esta área é restrita para administradores.');
      setLoading(false);
      return;
    }

    // Sucesso absoluto! Direciona o administrador para o painel de gestão
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

        {/* ===================== BRAND SPOTLIGHT (Laranja) ===================== */}
        <div className="yb-brandpanel" style={{ flex: '0 0 46%', position: 'relative', overflow: 'hidden', display: 'none', background: 'linear-gradient(150deg,#F55F16 0%,#FF7A3D 60%,#ff8c52 100%)', color: '#fff', padding: '56px' }}>
          <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(120% 80% at 20% 0%,rgba(255,255,255,.18),transparent 55%)' }}></div>
          <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-70px', bottom: '-60px', width: '440px', height: 'auto', opacity: '.13', color: '#fff', animation: 'ybFloat 9s ease-in-out infinite' }} fill="currentColor">
            <path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/>
            <path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/>
            <path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/>
          </svg>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg viewBox="119 94 275 323" style={{ width: '34px', height: 'auto', color: '#fff' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
              <span style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '.12em' }}>YBYTU</span>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.15em', background: 'rgba(255,255,255,.2)', padding: '3px 8px', borderRadius: '6px' }}>ADMIN</span>
            </div>
            <div>
              <h2 style={{ fontSize: '42px', lineHeight: 1.05, fontWeight: 900, margin: '0 0 18px', textWrap: 'balance' }}>O painel que move<br/>treino e nutrição.</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: .92, maxWidth: '380px', margin: 0, fontWeight: 400 }}>Gerencie usuários, planos e a base de conteúdo do ecossistema Ybytu num só lugar.</p>
            </div>
            <div style={{ display: 'flex', gap: '28px' }}>
              <div><p style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>12k+</p><p style={{ fontSize: '12px', opacity: .85, margin: '2px 0 0', fontWeight: 600, letterSpacing: '.04em' }}>USUÁRIOS</p></div>
              <div><p style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>1.4k</p><p style={{ fontSize: '12px', opacity: .85, margin: '2px 0 0', fontWeight: 600, letterSpacing: '.04em' }}>ALIMENTOS</p></div>
              <div><p style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>99.9%</p><p style={{ fontSize: '12px', opacity: .85, margin: '2px 0 0', fontWeight: 600, letterSpacing: '.04em' }}>UPTIME</p></div>
            </div>
          </div>
        </div>

        {/* ===================== FORM PANEL (Direita) ===================== */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', background: 'var(--bg)' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
            )}
          </button>

          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'var(--brand)', color: '#fff' }}><svg viewBox="119 94 275 323" style={{ width: '20px', height: 'auto' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg></span>
              <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '.04em' }}>Ybytu <span style={{ color: 'var(--brand)', fontSize: '11px' }}>ADMIN</span></span>
            </div>

            <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.14em', color: 'var(--brand)', margin: '0 0 8px', textTransform: 'uppercase' }}>Bem-vindo de volta</p>
            <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Acessar painel</h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 30px' }}>Entre com suas credenciais de administrador.</p>

            <form onSubmit={handleLogin}>
              {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>E-mail</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg></span>
                <input type="email" placeholder="admin@ybytu.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Senha</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px 46px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={togglePw} type="button" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0' }}>
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }} /> Manter conectado
                </label>
                <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Esqueci a senha</Link>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '.01em' }}>
                {loading ? 'Entrando...' : 'Entrar'} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', margin: '26px 0 0' }}>Ainda não tem acesso? <Link to="/create-account" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Criar conta</Link></p>
          </div>
        </div>

      </div>
    </div>
  );
}