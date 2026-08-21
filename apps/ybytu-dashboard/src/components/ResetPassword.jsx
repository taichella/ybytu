import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Landing page do link de "esqueci a senha" -- ForgotPassword.jsx manda o
// e-mail com redirectTo apontando pra cá, mas essa rota nunca existiu em
// App.jsx (achado 2026-08-21, testando o fluxo ao vivo pra Taina recuperar
// acesso). O supabase-js já detecta o token de recovery na URL sozinho
// (detectSessionInUrl, default true) e dispara PASSWORD_RECOVERY -- só
// precisava dessa tela pra capturar o evento e deixar definir a senha nova.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [showPw, setShowPw] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let sessionFound = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionFound = true;
        setReady(true);
      }
    });

    // Se o evento já disparou antes desse listener montar (corrida possível
    // logo no load), uma sessão válida já presente também libera o form.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        sessionFound = true;
        setReady(true);
      }
    });

    // Sem evento nem sessão depois de um tempo -- token ausente/expirado.
    const timeout = setTimeout(() => {
      if (!sessionFound) setInvalidLink(true);
    }, 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const togglePw = () => setShowPw(!showPw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)' }}>
      <div className="yb-brandpanel" style={{ flex: '0 0 44%', position: 'relative', overflow: 'hidden', display: 'none', background: 'linear-gradient(150deg,#F55F16 0%,#FF7A3D 60%,#ff8c52 100%)', color: '#fff', padding: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 20% 0%,rgba(255,255,255,.18),transparent 55%)' }}></div>
        <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-70px', bottom: '-60px', width: '430px', height: 'auto', opacity: '.13', color: '#fff' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg viewBox="119 94 275 323" style={{ width: '34px', height: 'auto' }} fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
            <span style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '.12em' }}>YBYTU</span>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.15em', background: 'rgba(255,255,255,.2)', padding: '3px 8px', borderRadius: '6px' }}>ADMIN</span>
          </div>
          <div>
            <h2 style={{ fontSize: '40px', lineHeight: 1.05, fontWeight: 900, margin: '0 0 18px', textWrap: 'balance' }}>Quase lá.<br/>Defina sua nova senha.</h2>
          </div>
          <p style={{ fontSize: '13px', opacity: .8, margin: 0, fontWeight: 500 }}>Precisa de ajuda? Fale com o suporte Ybytu.</p>
        </div>
      </div>

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

          {invalidLink ? (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Link inválido ou expirado</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 26px', lineHeight: 1.55 }}>Esse link de redefinição não é mais válido. Peça um novo.</p>
              <Link to="/forgot-password" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>Pedir novo link</Link>
            </div>
          ) : done ? (
            <div>
              <span style={{ display: 'inline-flex', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(22,163,74,.12)', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '22px' }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Senha redefinida!</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0, lineHeight: 1.55 }}>Levando você pro painel...</p>
            </div>
          ) : !ready ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Defina sua nova senha</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.55 }}>Escolha uma senha com pelo menos 6 caracteres.</p>

              {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Nova senha</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px 46px 14px 16px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                <button type="button" onClick={togglePw} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{showPw ? <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></> : <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                </button>
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Confirmar nova senha</label>
              <div style={{ position: 'relative', marginBottom: '22px' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', color: 'var(--muted)', textDecoration: 'none', marginTop: '26px', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
