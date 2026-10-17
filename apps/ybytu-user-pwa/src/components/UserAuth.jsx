import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { readFunctionError } from '../lib/functionError';
import YbytuLogo from './YbytuLogo';
import {
  ALL_COUNTRIES,
  getPhoneValidation,
  getCountryPlaceholder,
  AsYouType,
} from '../lib/phone.js';
import '../user.css';

// Suporte por e-mail (2026-10-17): o número de WhatsApp é o da API da Meta,
// que está desligada, e ninguém responde por ali (docs/POS_PILOTO.md).
const SUPPORT_EMAIL = 'contato@ybytu.app';

// Login por código no WhatsApp DESLIGADO (2026-10-11, decisão da Taina): a Meta
// aceita o envio mas não entrega (131042, conta com pagamento pendente), então o
// aluno ficava esperando um código que nunca chega. E-mail (Resend) vira o único
// caminho na tela. O fluxo de WhatsApp continua no código; para religar, true.
const WHATSAPP_LOGIN_ENABLED = false;

export default function UserAuth() {
  const navigate = useNavigate();

  // Estados do fluxo
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [method, setMethod] = useState(WHATSAPP_LOGIN_ENABLED ? 'whatsapp' : 'email'); // 'whatsapp' | 'email'
  const [phone, setPhone] = useState('');
  const [countryIso, setCountryIso] = useState('BR');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [whatsappFailed, setWhatsappFailed] = useState(false);

  // Timers
  const [countdown, setCountdown] = useState(300); // 5 minutos TTL
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputRef = useRef(null);

  const selectedCountry = useMemo(
    () => ALL_COUNTRIES.find((c) => c.iso === countryIso) || ALL_COUNTRIES[0],
    [countryIso]
  );

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const q = countrySearch.toLowerCase().trim();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [countrySearch]);

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
    const raw = e.target.value;
    const formatted = new AsYouType(countryIso).input(raw);
    setPhone(formatted);
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

    let identifier = '';

    if (activeMethod === 'whatsapp') {
      const validation = getPhoneValidation(phone, countryIso);
      if (validation.error || !validation.e164) {
        setErrorMessage(validation.error || 'Informe um número de WhatsApp válido com código de área.');
        return;
      }
      identifier = validation.e164;
    } else {
      if (!email || !email.includes('@')) {
        setErrorMessage('Informe um e-mail válido.');
        return;
      }
      identifier = email.trim().toLowerCase();
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ybytu-auth-request-otp', {
        body: { identifier, method: activeMethod },
      });

      // Trata erros de function (HTTP != 2xx) e erros com HTTP 200 { success: false }.
      // Em não-2xx o motivo real ({ error, message }) só existe no corpo da
      // resposta -- readFunctionError lê; error.message é sempre genérico.
      if (error || (data && data.success === false)) {
        const { body, httpStatus } = error ? await readFunctionError(error) : { body: null, httpStatus: null };
        const info = body || data;
        let msg = info?.message || 'Falha ao solicitar código. Tente novamente.';

        // Falha no envio do WhatsApp (502): oferece o e-mail
        if (info?.error === 'whatsapp_send_failed' || httpStatus === 502) {
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
      let identifier = '';
      if (method === 'whatsapp') {
        const validation = getPhoneValidation(phone, countryIso);
        identifier = validation.e164 || phone;
      } else {
        identifier = email.trim().toLowerCase();
      }

      const { data, error } = await supabase.functions.invoke('ybytu-auth-verify-otp', {
        body: { identifier, code },
      });

      // Trata erros com HTTP 200 success: false ou códigos de erro HTTP
      if (error || (data && data.success === false)) {
        const { body } = error ? await readFunctionError(error) : { body: null };
        const info = body || data;
        setErrorMessage(info?.message || 'Não foi possível validar o código. Tente novamente.');
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
    <div className="user-pwa-container user-auth-page" style={{ justifyContent: 'center' }}>
      <div className="user-auth-box" style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
        
        {/* Cabeçalho de Identidade — Estilo Oficial do Protótipo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '66px',
            height: '66px',
            borderRadius: '20px',
            background: 'var(--yb-brand, #F55F16)',
            color: '#FFFFFF',
            boxShadow: 'var(--yb-shadow-glow, 0 8px 22px rgba(245,95,22,.30))',
          }}>
            <svg viewBox="119 94 275 323" style={{ width: '36px', height: 'auto' }} fill="currentColor">
              <path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"></path>
              <path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"></path>
              <path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"></path>
            </svg>
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--yb-text, #1A202C)' }}>
              Ybytu
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--yb-muted, #718096)', fontWeight: 600 }}>
              {step === 'request'
                ? 'Sua evolução começa agora.'
                : 'Digite o código de 6 dígitos enviado para você'}
            </p>
          </div>
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
          <div className="user-card user-auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {method === 'whatsapp' ? (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--yb-muted, #718096)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Seu WhatsApp
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountryPickerOpen(true);
                      setCountrySearch('');
                    }}
                    className="country-btn"
                    title="Alterar país / DDI"
                  >
                    <span className="country-flag">{selectedCountry?.flag || '🌐'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--yb-text, #1A202C)' }}>
                      {selectedCountry?.dial || '+55'}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--yb-muted)' }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder={getCountryPlaceholder(countryIso)}
                    value={phone}
                    onChange={handlePhoneChange}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '14px 16px',
                      borderRadius: 'var(--yb-radius-input, 14px)',
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
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--yb-muted, #718096)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Seu E-mail Cadastrado
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', display: 'flex', color: 'var(--yb-muted, #718096)', pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m2 7 10 6 10-6"></path>
                    </svg>
                  </span>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 46px',
                      borderRadius: 'var(--yb-radius-input, 14px)',
                      border: '1px solid var(--yb-border, #E2E8F0)',
                      background: 'var(--yb-field, #F8F9FA)',
                      color: 'var(--yb-text, #1A202C)',
                      fontSize: '15px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>
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
                  RECEBER CÓDIGO NO WHATSAPP
                </>
              ) : (
                <>
                  RECEBER CÓDIGO POR E-MAIL
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>

            {/* Alternância de método (WhatsApp vs E-mail) */}
            {WHATSAPP_LOGIN_ENABLED && <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              {method === 'whatsapp' ? (
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setErrorMessage(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '6px' }}
                >
                  {whatsappFailed ? 'Tentar receber código por e-mail' : 'Não tem WhatsApp? Entrar por e-mail'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMethod('whatsapp'); setErrorMessage(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '6px' }}
                >
                  Voltar e receber pelo WhatsApp
                </button>
              )}
            </div>}
          </div>
        )}

        {/* ETAPA 2: VERIFICAÇÃO DO CÓDIGO */}
        {step === 'verify' && (
          <div className="user-card user-auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--yb-brand, #F55F16)' }}>
                Código Enviado
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--yb-muted, #718096)', fontWeight: 600 }}>
                Verifique a caixa de entrada de <strong>{method === 'whatsapp' ? phone : email}</strong>
              </p>
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
                  padding: '16px',
                  borderRadius: 'var(--yb-radius-input, 14px)',
                  border: '2px solid var(--yb-brand, #F55F16)',
                  background: 'var(--yb-field, #F8F9FA)',
                  color: 'var(--yb-text, #1A202C)',
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '10px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>

            <button
              type="button"
              className="checkin-btn primary"
              disabled={loading || otpCode.length !== 6}
              onClick={() => verifyOtpCode(otpCode)}
            >
              {loading ? (
                'Validando…'
              ) : (
                <>
                  ENTRAR NO APLICATIVO
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>

            {/* Expiração e Reenvio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--yb-muted, #718096)', borderTop: '1px solid var(--yb-border, #E2E8F0)', paddingTop: '12px' }}>
              <span>Expira em <strong>{minutesLeft}:{secondsLeft}</strong></span>

              {resendCooldown > 0 ? (
                <span>Reenviar em {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  style={{ background: 'transparent', border: 'none', color: 'var(--yb-brand, #F55F16)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  Reenviar código
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setStep('request'); setErrorMessage(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--yb-muted, #718096)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                {WHATSAPP_LOGIN_ENABLED ? '← Trocar número ou e-mail' : '← Trocar e-mail'}
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
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ajuda para entrar no app')}&body=${encodeURIComponent('Olá! Preciso de ajuda para acessar minha conta no app Ybytu.')}`}
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
            Falar com o suporte por e-mail →
          </a>
        </div>

      </div>

      {/* Modal de Seleção de País / DDI */}
      {countryPickerOpen && (
        <div
          className="country-modal-overlay"
          onClick={() => {
            setCountryPickerOpen(false);
            setCountrySearch('');
          }}
        >
          <div className="country-modal" onClick={(e) => e.stopPropagation()}>
            <div className="country-modal-header">
              <div>
                <h3 className="country-modal-title">Selecione o país</h3>
                <p className="country-modal-subtitle">Código telefônico (DDI) para seu WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCountryPickerOpen(false);
                  setCountrySearch('');
                }}
                className="btn-modal-close"
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="country-modal-search">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Buscar país ou código..."
                className="search-input"
                autoFocus
              />
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch('')}
                  className="btn-clear-search"
                >
                  LIMPAR
                </button>
              )}
            </div>

            <div className="country-modal-list">
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--yb-muted)', fontSize: '14px' }}>
                  Nenhum país encontrado para "{countrySearch}"
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.iso === countryIso;
                  return (
                    <button
                      type="button"
                      key={c.iso}
                      onClick={() => {
                        setCountryIso(c.iso);
                        setCountryPickerOpen(false);
                        setCountrySearch('');
                        if (phone) {
                          try {
                            const formatted = new AsYouType(c.iso).input(phone);
                            setPhone(formatted);
                          } catch (e) {}
                        }
                      }}
                      className={`country-list-item ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="country-flag">{c.flag}</span>
                      <span className="c-name">{c.name}</span>
                      <span className="c-dial">{c.dial}</span>
                      {isSelected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F55F16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
