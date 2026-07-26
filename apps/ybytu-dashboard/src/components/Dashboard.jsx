import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [theme, setTheme] = useState('dark');
  const [period, setPeriod] = useState('hoje');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const btnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.1)' : 'none'
  });

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </span>
          <input type="text" placeholder="Buscar usuários, alimentos, treinos…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
            )}
          </button>
          
          <button title="Notificações" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            <span style={{ position: 'absolute', top: '9px', right: '9px', width: '8px', height: '8px', background: 'var(--brand)', border: '2px solid var(--surface)', borderRadius: '50%' }}></span>
          </button>
          
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative' }}>
        {/* Efeito Glow Laranja de Fundo */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '480px', height: '480px', background: 'rgba(245,95,22,.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', maxWidth: '1240px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '26px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>Visão Geral</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Bem-vindo de volta, Admin. Aqui está o resumo de hoje.</p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setPeriod('hoje')} style={btnStyle(period === 'hoje')}>Hoje</button>
              <button onClick={() => setPeriod('7')} style={btnStyle(period === '7')}>7 dias</button>
              <button onClick={() => setPeriod('mes')} style={btnStyle(period === 'mes')}>Mês</button>
            </div>
          </div>

          {/* Stat cards row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,.1)', padding: '3px 8px', borderRadius: '999px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>12%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Total de Usuários</p>
              <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 900 }}>12.450</p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,.1)', padding: '3px 8px', borderRadius: '999px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>8,5%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Assinaturas Ativas</p>
              <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 900 }}>8.230</p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168,85,247,.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', background: 'var(--field)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '999px' }}>Hoje</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Treinos Realizados</p>
              <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 900 }}>4.192</p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(22,163,74,.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,.1)', padding: '3px 8px', borderRadius: '999px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>3,1%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Base de Alimentos</p>
              <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 900 }}>1.405</p>
            </div>

          </div>

          {/* MRR strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <div style={{ background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', borderRadius: '18px', padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '150px', opacity: '.15' }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', opacity: .9, textTransform: 'uppercase' }}>Receita Recorrente (MRR)</p>
              <p style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 900 }}>R$ 142.500</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, opacity: .95 }}>▲ 15,3% vs. mês anterior</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ticket Médio</p>
              <p style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 900 }}>R$ 29,40</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>▲ 2,1% no período</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Taxa de Churn</p>
              <p style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 900 }}>2,4%</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>▼ 0,5% no período</p>
            </div>
          </div>

          {/* Chart + Donut row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: '18px', marginBottom: '18px' }}>
            
            {/* Growth chart SVG */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Crescimento de Usuários</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Novos cadastros nos últimos 6 meses</p>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand)' }}></span> +34% no semestre
                </span>
              </div>
              <svg viewBox="0 0 580 210" preserveAspectRatio="none" style={{ width: '100%', height: '200px', marginTop: '8px', display: 'block' }}>
                <defs>
                  <linearGradient id="ybArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F55F16" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#F55F16" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="40" x2="580" y2="40" stroke="var(--border)" strokeWidth="1"/>
                <line x1="0" y1="90" x2="580" y2="90" stroke="var(--border)" strokeWidth="1"/>
                <line x1="0" y1="140" x2="580" y2="140" stroke="var(--border)" strokeWidth="1"/>
                <path d="M0,160 C60,150 90,120 145,118 C200,116 230,90 290,82 C350,74 380,55 435,48 C490,41 520,28 580,20 L580,185 L0,185 Z" fill="url(#ybArea)"/>
                <path d="M0,160 C60,150 90,120 145,118 C200,116 230,90 290,82 C350,74 380,55 435,48 C490,41 520,28 580,20" fill="none" stroke="#F55F16" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="580" cy="20" r="5" fill="#F55F16" stroke="var(--surface)" strokeWidth="2.5"/>
                <circle cx="290" cy="82" r="4" fill="var(--surface)" stroke="#F55F16" strokeWidth="2.5"/>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span style={{ color: 'var(--text)' }}>Jun</span>
              </div>
            </div>

            {/* Plan distribution donut SVG */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900 }}>Distribuição de Planos</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <svg viewBox="0 0 42 42" style={{ width: '128px', height: '128px', flexShrink: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--border)" strokeWidth="6"/>
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F55F16" strokeWidth="6" strokeDasharray="22 78" strokeDashoffset="0"/>
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="17 83" strokeDashoffset="-22"/>
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#9ca3af" strokeWidth="6" strokeDasharray="61 39" strokeDashoffset="-39"/>
                </svg>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F55F16' }}></span><span style={{ fontWeight: 700 }}>Pro</span><span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600 }}>22%</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }}></span><span style={{ fontWeight: 700 }}>Start</span><span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600 }}>17%</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#9ca3af' }}></span><span style={{ fontWeight: 700 }}>Free</span><span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600 }}>61%</span></div>
                </div>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Conversão p/ pago</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--brand)' }}>39%</span>
              </div>
            </div>

          </div>

          {/* Recent signups + activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
            
            {/* Novos Usuários */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Novos Usuários</h3>
                <a href="#" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Ver todos</a>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>MS</div>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Mariana Silva</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Plano Pro</p></div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>há 5 min</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>CE</div>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Carlos Eduardo</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Plano Start</p></div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>há 12 min</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 22px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>AC</div>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Amanda Costa</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Plano Pro</p></div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>há 1 hora</span>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Atividade Recente</h3>
              </div>
              <div style={{ padding: '6px 22px' }}>
                <div style={{ display: 'flex', gap: '13px', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(168,85,247,.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </span>
                  <div><p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Novo plano de treino "Hipertrofia 12s" publicado</p><p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>há 22 min · por Coach Bruno</p></div>
                </div>
                <div style={{ display: 'flex', gap: '13px', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(22,163,74,.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
                  </span>
                  <div><p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>38 alimentos adicionados à base TACO</p><p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>há 1 hora · importação automática</p></div>
                </div>
                <div style={{ display: 'flex', gap: '13px', padding: '13px 0' }}>
                  <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>
                  </span>
                  <div><p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>142 renovações de assinatura processadas</p><p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>há 3 horas · gateway de pagamento</p></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}