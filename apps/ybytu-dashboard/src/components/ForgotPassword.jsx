import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [theme, setTheme] = useState('dark');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // O redirectTo aponta para o link onde o usuário definirá a nova senha
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

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
            <h2 style={{ fontSize: '40px', lineHeight: 1.05, fontWeight: 900, margin: '0 0 18px', textWrap: 'balance' }}>Sem estresse.<br/>Recupere o acesso.</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: .92, maxWidth: '380px', margin: 0, fontWeight: 400 }}>Enviamos um link seguro para o seu e-mail. Em poucos minutos você volta ao painel.</p>
          </div>
          <p style={{ fontSize: '13px', opacity: .8, margin: 0, fontWeight: 500 }}>Precisa de ajuda? Fale com o suporte Ybytu.</p>
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

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'var(--brand)', color: '#fff' }}><svg viewBox="119 94 275 323" style={{ width: '20px', height: 'auto' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg></span>
            <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '.04em' }}>Ybytu <span style={{ color: 'var(--brand)', fontSize: '11px' }}>ADMIN</span></span>
          </div>

          {!sent ? (
            <form onSubmit={handleResetPassword}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Esqueceu a senha?</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.55 }}>Digite o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>

              {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>E-mail</label>
              <div style={{ position: 'relative', marginBottom: '22px' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg></span>
                <input type="email" placeholder="admin@ybytu.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Enviando...' : 'Enviar link de redefinição'} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </button>
            </form>
          ) : (
            <div>
              <span style={{ display: 'inline-flex', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--brand-soft)', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', marginBottom: '22px' }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg></span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Verifique seu e-mail</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 8px', lineHeight: 1.55 }}>Enviamos um link de redefinição para o e-mail informado. Verifique sua caixa de entrada — o link expira em 30 minutos.</p>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 26px' }}>Não recebeu? <button onClick={handleResetPassword} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', padding: 0 }}>Reenviar</button></p>
              <button onClick={() => setSent(false)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '15px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> Voltar
              </button>
            </div>
          )}

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', color: 'var(--muted)', textDecoration: 'none', marginTop: '26px', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}