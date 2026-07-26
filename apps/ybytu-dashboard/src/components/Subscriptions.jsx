import { useState, useEffect } from 'react';

export default function Subscriptions() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Dados mocados extraídos do seu protótipo
  const avatars = ['#ec4899','#3b82f6','#16a34a','#a855f7','#f59e0b','#06b6d4'];
  
  const PLAN = {
    free:  { planBg: 'var(--surface-2)',     planColor: 'var(--muted)' },
    start: { planBg: 'rgba(59,130,246,.12)',  planColor: '#3b82f6' },
    pro:   { planBg: 'rgba(245,95,22,.14)',   planColor: '#F55F16' },
  };
  
  const OK   = { status: 'Pago',     statusBg: 'rgba(22,163,74,.12)', statusColor: '#16a34a' };
  const PEND = { status: 'Pendente', statusBg: 'rgba(217,119,6,.14)', statusColor: '#d97706' };
  const FAIL = { status: 'Falhou',   statusBg: 'rgba(239,68,68,.12)', statusColor: '#ef4444' };
  
  const t = (initials, name, planKey, planLabel, value, method, date, st, idx) => ({
    initials, name, plan: planLabel, ...PLAN[planKey], value, method, date, ...st, avatarBg: avatars[idx % avatars.length],
  });

  const plans = [
    { name: 'Free', color: 'var(--muted)', price: 'R$ 0', period: '/mês', subs: '8.540', featured: false, borderStyle: '1px solid var(--border)',
      features: ['Acesso a treinos básicos', '1 plano alimentar', 'Comunidade'] },
    { name: 'Start', color: '#3b82f6', price: 'R$ 19,90', period: '/mês', subs: '2.110', featured: false, borderStyle: '1px solid var(--border)',
      features: ['Treinos ilimitados', 'Planos alimentares', 'Acompanhamento de progresso'] },
    { name: 'Pro', color: '#F55F16', price: 'R$ 39,90', period: '/mês', subs: '1.800', featured: true, borderStyle: '2px solid var(--brand)',
      features: ['Tudo do Start', 'Planos gerados por IA', 'Ajustes por condição de saúde', 'Suporte prioritário'] },
  ];

  const txns = [
    t('MS', 'Mariana Silva', 'pro', 'Pro Anual', 'R$ 299,00', 'Cartão •• 4821', 'hoje, 09:12', OK, 0),
    t('CE', 'Carlos Eduardo', 'start', 'Start Mensal', 'R$ 19,90', 'Pix', 'hoje, 08:40', OK, 1),
    t('AC', 'Amanda Costa', 'pro', 'Pro Mensal', 'R$ 39,90', 'Cartão •• 1190', 'ontem', OK, 2),
    t('RN', 'Rafael Nunes', 'start', 'Start Mensal', 'R$ 19,90', 'Cartão •• 7782', 'ontem', FAIL, 3),
    t('JL', 'Juliana Lima', 'pro', 'Pro Mensal', 'R$ 39,90', 'Pix', '2 dias atrás', PEND, 4),
    t('PH', 'Pedro Henrique', 'pro', 'Pro Anual', 'R$ 299,00', 'Boleto', '3 dias atrás', OK, 5),
  ];

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </span>
          <input type="text" placeholder="Buscar assinante, transação…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '9px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"></path></svg> Relatório
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo plano
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Assinaturas</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Planos, receita e cobrança do app Ybytu.</p>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '22px' }}>
            <div style={{ background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', borderRadius: '18px', padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '140px', opacity: '.15' }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', opacity: .9, textTransform: 'uppercase' }}>MRR</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 900 }}>R$ 142.500</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, opacity: .95 }}>▲ 15,3% vs. mês anterior</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Assinantes pagos</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 900 }}>3.910</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>▲ 214 novos no mês</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ticket médio</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 900 }}>R$ 36,40</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>▲ 2,1% no período</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Churn (30d)</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 900 }}>2,4<span style={{ fontSize: '16px', color: 'var(--muted)' }}>%</span></p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>▼ 0,5% no período</p>
            </div>
          </div>

          {/* Plans */}
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Planos disponíveis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            {plans.map((p, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: p.borderStyle, borderRadius: '18px', padding: '22px', position: 'relative' }}>
                {p.featured && (
                  <span style={{ position: 'absolute', top: '16px', right: '16px', display: 'inline-flex', padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, background: 'var(--brand)', color: '#fff', textTransform: 'uppercase', letterSpacing: '.04em' }}>Popular</span>
                )}
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>{p.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '10px 0 4px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 900 }}>{p.price}</span>
                  <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>{p.period}</span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)' }}>{p.subs} assinantes ativos</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: p.color, display: 'flex', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                      </span> 
                      {f}
                    </div>
                  ))}
                </div>
                <button style={{ width: '100%', marginTop: '18px', padding: '10px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Editar plano</button>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Transações Recentes</h3>
              <a href="#" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Ver todas</a>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 22px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Assinante</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Plano</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Valor</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Método</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Data</th>
                    <th style={{ textAlign: 'center', padding: '12px 22px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '13px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: t.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>{t.initials}</div>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}><span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: t.planBg, color: t.planColor }}>{t.plan}</span></td>
                      <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 800 }}>{t.value}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t.method}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t.date}</td>
                      <td style={{ padding: '13px 22px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: t.statusBg, color: t.statusColor }}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}