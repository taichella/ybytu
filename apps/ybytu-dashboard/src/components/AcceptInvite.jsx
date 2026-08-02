import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ERROR_MESSAGES = {
  invite_not_found: 'Este convite não é válido. Peça um novo ao administrador.',
  invite_revoked: 'Este convite não é válido. Peça um novo ao administrador.',
  invite_expired: 'Este convite expirou (validade de 7 dias). Peça um novo.',
  invite_already_used: 'Este convite já foi usado. Se a conta é sua, entre pelo login.',
  account_exists: 'Já existe uma conta com este e-mail. Peça a um administrador para liberar o papel.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres.',
  missing_full_name: 'Preencha seu nome completo.',
  missing_token: 'Este convite não é válido. Peça um novo ao administrador.',
};

const DEFAULT_ERROR_MESSAGE = 'Não foi possível concluir seu cadastro. Tente novamente em instantes.';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [theme, setTheme] = useState('dark');
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const togglePw = () => setShowPw(!showPw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const { data, error: invokeError } = await supabase.functions.invoke('ybytu-redeem-staff-invite', {
      body: { token, full_name: fullName, password },
    });

    setLoading(false);

    if (invokeError || !data?.ok) {
      // Em erro HTTP não-2xx o supabase-js não preenche `data` -- o corpo
      // JSON (com o código de erro que mapeamos pra mensagem amigável) vem
      // em invokeError.context, a Response crua da function.
      const code = data?.error ?? await invokeError?.context?.json?.().then(b => b?.error).catch(() => null);
      setError(ERROR_MESSAGES[code] || DEFAULT_ERROR_MESSAGE);
      return;
    }

    setDone(true);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

        {/* ===================== BRAND PANEL ===================== */}
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
              <h2 style={{ fontSize: '42px', lineHeight: 1.05, fontWeight: 900, margin: '0 0 18px', textWrap: 'balance' }}>Você foi<br/>convidado.</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: .92, maxWidth: '380px', margin: 0, fontWeight: 400 }}>Defina sua senha para acessar o painel Ybytu como parte da equipe.</p>
            </div>
            <div></div>
          </div>
        </div>

        {/* ===================== FORM PANEL ===================== */}
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

            {!done ? (
              <form onSubmit={handleSubmit}>
                <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.14em', color: 'var(--brand)', margin: '0 0 8px', textTransform: 'uppercase' }}>Convite da equipe</p>
                <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Criar sua conta</h1>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 30px' }}>Defina seu nome e uma senha para acessar o painel.</p>

                {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Nome completo</label>
                <div style={{ position: 'relative', marginBottom: '18px' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                  <input type="text" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Senha</label>
                <div style={{ position: 'relative', marginBottom: '18px' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                  <input type={showPw ? 'text' : 'password'} placeholder="Mínimo de 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ width: '100%', padding: '14px 46px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={togglePw} type="button" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0' }}>
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>Confirmar senha</label>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                  <input type={showPw ? 'text' : 'password'} placeholder="Digite a senha novamente" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }} />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '.01em' }}>
                  {loading ? 'Criando conta...' : 'Criar conta'} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </button>
              </form>
            ) : (
              <div>
                <span style={{ display: 'inline-flex', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--brand-soft)', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', marginBottom: '22px' }}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>
                <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 8px' }}>Conta criada!</h1>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: '0 0 26px', lineHeight: 1.55 }}>Sua conta foi criada com sucesso. Agora você já pode entrar no painel com seu e-mail e senha.</p>
                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Ir para o login <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </button>
              </div>
            )}

            {!done && (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', color: 'var(--muted)', textDecoration: 'none', marginTop: '26px', fontWeight: 600 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> Já tenho conta — ir para o login
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
