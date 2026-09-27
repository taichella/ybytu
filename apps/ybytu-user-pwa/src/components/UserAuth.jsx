import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import YbytuLogo from './YbytuLogo';
import '../user.css';

const WHATSAPP_SUPPORT_NUMBER = '5511955026812';

function formatPhoneDisplay(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function UserAuth() {
  const navigate = useNavigate();

  // Estados do fluxo
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [method, setMethod] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [whatsappFailed, setWhatsappFailed] = useState(false);

  // Timers
  const [countdown, setCountdown] = useState(300); // 5 minutos TTL
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputRef = useRef(null);

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/hoje', { replace: true });
      }
    });
  }, [navigate]);

  // Contagem regressiva do código e do reenvio
  useEffect(() => {
    let timer;
    if (step === 'verify') {
      timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Auto-focus no input de OTP ao abrir etapa de verificação
  useEffect(() => {
    if (step === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneDisplay(e.target.value));
    setErrorMessage(null);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrorMessage(null);
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(val);
    setErrorMessage(null);

    // Se digitou os 6 dígitos, dispara verificação automaticamente
    if (val.length === 6) {
      verifyOtpCode(val);
    }
  };

  // 1. Solicita OTP
  const handleRequestOtp = async (overrideMethod = null) => {
    const activeMethod = overrideMethod || method;
    setErrorMessage(null);

    const cleanDigits = phone.replace(/\D/g, '');
    if (activeMethod === 'whatsapp' && cleanDigits.length < 10) {
      setErrorMessage('Informe um número de telefone com DDD válido.');
      return;
    }
    if (activeMethod === 'email' && (!email || !email.includes('@'))) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const identifier = activeMethod === 'whatsapp' ? `+55${cleanDigits}` : email.trim().toLowerCase();

      const { data, error } = await supabase.functions.invoke('ybytu-auth-request-otp', {
        body: { identifier, method: activeMethod },
      });

      // Trata erros de function (HTTP != 2xx) e erros com HTTP 200 { success: false }
      if (error || (data && data.success === false)) {
        let msg = data?.message || data?.error || error?.message || 'Falha ao solicitar código. Tente novamente.';
        
        // Se a mensagem indicar falha no envio do WhatsApp
        if (data?.error === 'whatsapp_send_failed' || (error && error.message?.includes('502'))) {
          setWhatsappFailed(true);
          msg = 'Não foi possível entregar o código pelo WhatsApp. Experimente solicitar por e-mail.';
        }

        setErrorMessage(msg);
        return;
      }

      // Sucesso na emissão (ou resposta cega)
      setStep('verify');
      setCountdown(300);
      setResendCooldown(60);
      setOtpCode('');
    } catch (err) {
      setErrorMessage(err?.message || 'Erro inesperado ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Valida OTP e estabelece sessão
  const verifyOtpCode = async (codeToVerify) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length !== 6) {
      setErrorMessage('Digite o código de 6 dígitos recebido.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const cleanDigits = phone.replace(/\D/g, '');
      const identifier = method === 'whatsapp' ? `+55${cleanDigits}` : email.trim().toLowerCase();

      const { data, error } = await supabase.functions.invoke('ybytu-auth-verify-otp', {
        body: { identifier, code },
      });

      // Trata erros com HTTP 200 success: false ou códigos de erro HTTP
      if (error || (data && data.success === false)) {
        const msg = data?.message || data?.error || error?.message || 'Código inválido ou expirado.';
        setErrorMessage(msg);
        return;
      }

      if (!data?.session?.access_token) {
        setErrorMessage('Sessão não retornada pelo servidor. Tente novamente.');
        return;
      }

      // Grava a sessão oficial no Supabase Client local
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionErr) {
        setErrorMessage(`Falha ao registrar sessão: ${sessionErr.message}`);
        return;
      }

      // Redireciona para a tela do dia do usuário
      navigate('/hoje', { replace: true });

    } catch (err) {
      setErrorMessage(err?.message || 'Erro inesperado na validação do código.');
    } finally {
      setLoading(false);
    }
  };

  const minutesLeft = Math.floor(countdown / 60);
  const secondsLeft = (countdown % 60).toString().padStart(2, '0');

  return (
    <div className="user-pwa-container" style={{ justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
        
        {/* Cabeçalho de Identidade */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-block', marginBottom: '12px' }}>
            <YbytuLogo size={48} showText={true} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px', color: 'var(--yb-text, #1A202C)' }}>
            Acessar sua Conta
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--yb-muted, #718096)', margin: 0 }}>
            {step === 'request'
              ? 'Acesse sua ficha de treino e plano alimentar'
              : 'Digite o código de 6 dígitos enviado para você'}
          </p>
        </div>

        {/* Banner de Erro Visível */}
        {errorMessage && (
          <div className="user-error-banner" role="alert">
            <svg className="user-error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ETAPA 1: SOLICITAÇÃO DO CÓDIGO */}
        {step === 'request' && (
          <div className="user-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {method === 'whatsapp' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--yb-muted, #718096)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Seu WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={handlePhoneChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--yb-radius-md, 12px)',
                    border: '1px solid var(--yb-border, #E2E8F0)',
                    background: 'var(--yb-field, #F8F9FA)',
                    fontSize: '16px',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--yb-muted, #718096)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Seu E-mail Cadastrado
                </label>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--yb-radius-md, 12px)',
                    border: '1px solid var(--yb-border, #E2E8F0)',
                    background: 'var(--yb-field, #F8F9FA)',
                    fontSize: '15px',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
            )}

            <button
              type="button"
              className="checkin-btn primary"
              disabled={loading}
              onClick={() => handleRequestOtp()}
            >
              {loading ? (
                'Enviando código…'
              ) : method === 'whatsapp' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  Receber código no WhatsApp
                </>
              ) : (
                'Receber código por e-mail'
              )}
            </button>

            {/* Alternância de método (WhatsApp vs E-mail) */}
            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              {method === 'whatsapp' ? (
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setErrorMessage(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '6px' }}
                >
                  {whatsappFailed ? 'Tentar receber código por e-mail' : 'Não tem WhatsApp? Entrar por e-mail'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMethod('whatsapp'); setErrorMessage(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '6px' }}
                >
                  Voltar e receber pelo WhatsApp
                </button>
              )}
            </div>
          </div>
        )}

        {/* ETAPA 2: VERIFICAÇÃO DO CÓDIGO */}
        {step === 'verify' && (
          <div className="user-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--yb-muted, #718096)' }}>
                Enviado para {method === 'whatsapp' ? phone : email}
              </span>
            </div>

            <div>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={handleOtpChange}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--yb-radius-md, 12px)',
                  border: '2px solid var(--yb-brand, #F55F16)',
                  background: 'var(--yb-field, #F8F9FA)',
                  fontSize: '26px',
                  fontWeight: 800,
                  letterSpacing: '10px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              className="checkin-btn primary"
              disabled={loading || otpCode.length !== 6}
              onClick={() => verifyOtpCode(otpCode)}
            >
              {loading ? 'Validando…' : 'Entrar no Aplicativo'}
            </button>

            {/* Expiração e Reenvio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--yb-muted, #718096)', borderTop: '1px solid var(--yb-border, #E2E8F0)', paddingTop: '10px' }}>
              <span>Expira em {minutesLeft}:{secondsLeft}</span>

              {resendCooldown > 0 ? (
                <span>Reenviar em {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Reenviar código
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setStep('request'); setErrorMessage(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--yb-muted, #718096)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Trocar número ou e-mail
              </button>
            </div>
          </div>
        )}

        {/* Rodapé de Contingência / Suporte */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '12px', color: 'var(--yb-muted, #718096)', margin: '0 0 6px' }}>
            Mudou de número ou precisa de ajuda para entrar?
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent('Olá! Preciso de ajuda para acessar minha conta no app Ybytu.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--yb-brand, #F55F16)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Falar com suporte no WhatsApp →
          </a>
        </div>

      </div>
    </div>
  );
}
