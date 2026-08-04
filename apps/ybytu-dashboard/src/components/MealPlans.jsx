import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function MealPlans() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('all');
  const [aiFilter, setAiFilter] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  // Função do gráfico Donut simplificado (baseado em percentagens diretas)[cite: 15]
  const getDonut = (pctP, pctC, pctF, size = 68) => {
    const a = pctP;
    const b = pctP + pctC;
    // Cores Hex: Prot Azul, Carb Laranja, Fat Roxo[cite: 15]
    const bg = `conic-gradient(#3b82f6 0% ${a}%, #f59e0b ${a}% ${b}%, #a855f7 ${b}% 100%)`;
    const hole = Math.round(size * 0.58);
    
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundImage: bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: `${hole}px`, height: `${hole}px`, borderRadius: '50%', background: 'var(--field)' }}></div>
      </div>
    );
  };

  const grad = [
    'linear-gradient(135deg,#16a34a,#4ade80)',
    'linear-gradient(135deg,#F55F16,#FF7A3D)',
    'linear-gradient(135deg,#3b82f6,#60a5fa)',
    'linear-gradient(135deg,#a855f7,#c084fc)',
    'linear-gradient(135deg,#0E0E0E,#3a3a3a)',
    'linear-gradient(135deg,#ef4444,#f87171)'
  ];

  const ACT = { status: 'Ativo', statusBg: 'rgba(22,163,74,.12)', statusColor: '#16a34a' };
  const DRF = { status: 'Rascunho', statusBg: 'var(--surface-2)', statusColor: 'var(--muted)' };

  // Dados Mockados dos Planos Alimentares[cite: 15]
  const allPlans = [
    { id: 1, name: 'Cutting 1.800 kcal', goal: 'Emagrecimento', kcal: 1800, pctP: 40, pctC: 35, pctF: 25, mealsPerDay: 5, days: 7, tags: ['Low carb', 'Alto em proteína'], cover: grad[0], ai: false, ...ACT },
    { id: 2, name: 'Bulking Limpo 3.200', goal: 'Ganho de massa', kcal: 3200, pctP: 30, pctC: 50, pctF: 20, mealsPerDay: 6, days: 7, tags: ['Hipercalórico'], cover: grad[1], ai: false, ...ACT },
    { id: 3, name: 'Manutenção Equilibrada', goal: 'Manutenção', kcal: 2400, pctP: 30, pctC: 45, pctF: 25, mealsPerDay: 4, days: 7, tags: ['Balanceado'], cover: grad[2], ai: true, ...ACT },
    { id: 4, name: 'Vegano 2.000 kcal', goal: 'Manutenção', kcal: 2000, pctP: 25, pctC: 55, pctF: 20, mealsPerDay: 5, days: 7, tags: ['Vegano', 'Sem lactose'], cover: grad[3], ai: true, ...ACT },
    { id: 5, name: 'Low Carb 1.600', goal: 'Emagrecimento', kcal: 1600, pctP: 35, pctC: 20, pctF: 45, mealsPerDay: 4, days: 7, tags: ['Low carb', 'Keto'], cover: grad[4], ai: false, ...ACT },
    { id: 6, name: 'Recomp 2.200 kcal', goal: 'Ganho de massa', kcal: 2200, pctP: 38, pctC: 37, pctF: 25, mealsPerDay: 5, days: 6, tags: ['Recomposição'], cover: grad[5], ai: true, ...DRF },
  ];

  // Filtro Inteligente[cite: 15]
  const filteredPlans = allPlans.filter(p => {
    if (aiFilter && !p.ai) return false;
    if (tab === 'all') return true;
    if (tab === 'emag' && p.goal !== 'Emagrecimento') return false;
    if (tab === 'ganho' && p.goal !== 'Ganho de massa') return false;
    if (tab === 'manut' && p.goal !== 'Manutenção') return false;
    if (tab === 'rascunho' && p.status !== 'Rascunho') return false;
    return true;
  });

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar plano alimentar…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/meal-plan-creator" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Criar plano
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Planos Alimentares</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Cardápios multilíngues por objetivo e meta calórica — manuais ou gerados por IA. <strong style={{ color: 'var(--text)' }}>36</strong> planos.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', marginBottom: '22px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              <button onClick={() => setTab('all')} style={tabStyle(tab === 'all')}>Todos</button>
              <button onClick={() => setTab('emag')} style={tabStyle(tab === 'emag')}>Emagrecimento</button>
              <button onClick={() => setTab('ganho')} style={tabStyle(tab === 'ganho')}>Ganho de massa</button>
              <button onClick={() => setTab('manut')} style={tabStyle(tab === 'manut')}>Manutenção</button>
              <button onClick={() => setTab('rascunho')} style={tabStyle(tab === 'rascunho')}>Rascunhos</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', paddingBottom: '8px', whiteSpace: 'nowrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M5.6 18.4l1.4-1.4M12 19v2M17 12h2M18.4 5.6 17 7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg>
              Somente gerados por IA 
              <input type="checkbox" checked={aiFilter} onChange={(e) => setAiFilter(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', marginLeft: '2px', cursor: 'pointer' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
            {filteredPlans.map((p) => (
              <div key={p.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ height: '80px', position: 'relative', overflow: 'hidden', background: p.cover, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '14px' }}>
                  <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-26px', top: '-26px', width: '120px', opacity: .16 }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
                  <span style={{ position: 'relative', display: 'inline-flex', padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(0,0,0,.28)', color: '#fff', backdropFilter: 'blur(4px)' }}>{p.goal}</span>
                  {p.ai && (
                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: 'rgba(255,255,255,.92)', color: '#7c3aed' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M5.6 18.4l1.4-1.4M12 19v2M17 12h2M18.4 5.6 17 7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg> IA
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>{p.name}</h3>
                    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: p.statusBg, color: p.statusColor, textTransform: 'uppercase' }}>{p.status}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0', padding: '14px', background: 'var(--field)', borderRadius: '13px' }}>
                    {getDonut(p.pctP, p.pctC, p.pctF)}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Meta diária</p>
                      <p style={{ margin: '3px 0 0', fontSize: '24px', fontWeight: 900, lineHeight: 1 }}>{p.kcal} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>kcal</span></p>
                      <div style={{ display: 'flex', gap: '9px', marginTop: '7px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }}></span>{p.pctP}%</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }}></span>{p.pctC}%</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a855f7' }}></span>{p.pctF}%</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg> {p.mealsPerDay} refeições/dia</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg> {p.days} dias/sem</div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', flex: 1, alignContent: 'flex-start' }}>
                    {p.tags.map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t}</span>)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    {/* Estes links devem apontar para as respetivas rotas no futuro (ex: /meal-plan-detail/:id e /meal-plan-creator/:id) */}
                    <Link to={`/meal-plans/${p.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', border: '1px solid var(--border)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg> Ver
                    </Link>
                    <Link to={`/meal-plan-creator/${p.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  );
}