import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDetail() {
  const navigate = useNavigate();

  
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('overview');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleBlock = () => setIsBlocked(!isBlocked);

  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  // Dados mockados originais do protótipo[cite: 9]
  const history = [
    { icon:'🏋️', iconBg:'var(--brand-soft)', iconColor:'#F55F16', name:'Hipertrofia 12 Semanas', kind:'Plano de treino · atual', period:'desde 12 jan 2026' },
    { icon:'🥗', iconBg:'rgba(22,163,74,.12)', iconColor:'#16a34a', name:'Cutting 1.800 kcal', kind:'Plano alimentar · atual', period:'desde 12 jan 2026' },
    { icon:'🏋️', iconBg:'var(--surface-2)', iconColor:'var(--muted)', name:'Full Body Iniciante', kind:'Plano de treino · concluído', period:'out – dez 2025' },
  ];

  const workouts = [
    { name:'Treino A · Peito & Tríceps', detail:'5 exercícios · 48 min', when:'hoje, 07:12' },
    { name:'Treino C · Pernas', detail:'6 exercícios · 55 min', when:'ontem, 18:30' },
    { name:'Treino B · Costas & Bíceps', detail:'5 exercícios · 50 min', when:'2 dias atrás' },
    { name:'Treino A · Peito & Tríceps', detail:'5 exercícios · 46 min', when:'4 dias atrás' },
  ];

  const meals = [
    { emoji:'🥗', name:'Bowl de Frango com Quinoa', kcal:520, when:'hoje, 13:05' },
    { emoji:'🥞', name:'Panqueca de Banana & Aveia', kcal:340, when:'hoje, 08:00' },
    { emoji:'🍽️', name:'Salmão com Legumes', kcal:460, when:'ontem, 20:15' },
    { emoji:'🥛', name:'Iogurte com Frutas', kcal:260, when:'ontem, 16:00' },
  ];

  // Renderizador do Heatmap original[cite: 9]
  const renderHeatmap = () => {
    const weeks = 12, days = 7;
    const colors = ['var(--surface-2)', 'rgba(245,95,22,.3)', 'rgba(245,95,22,.6)', '#F55F16'];
    let cells = [];
    for (let w = 0; w < weeks; w++){
      let col = [];
      for (let d = 0; d < days; d++){
        const seed = (w*7 + d) * 2654435761 % 100;

        let activityLevel;
        if (d === 6 || d === 0) activityLevel = seed % 4 < 2 ? 0 : 1;
        else activityLevel = [0,1,2,3,2,3,1,3,2,3][seed % 10];
        if (w < 2) activityLevel = Math.max(0, activityLevel - 1);
        col.push(
          <div key={`c${w}-${d}`} title={`Semana ${w+1}, dia ${d+1}`} style={{ width: 15, height: 15, borderRadius: 3, background: colors[activityLevel] }}></div>
        );
      }
      cells.push(<div key={`w${w}`} style={{ display:'flex', flexDirection:'column', gap:4 }}>{col}</div>);
    }
    return <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:4 }}>{cells}</div>;
  };

  return (
    <>
      {/* ===================== HEADER (Corrigido)[cite: 9] ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/users')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>Usuários</span><span>/</span><span style={{ color: 'var(--text)' }}>Perfil</span>
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mariana Silva</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleBlock} style={{ background: isBlocked ? 'rgba(239,68,68,.1)' : 'var(--surface)', color: isBlocked ? 'var(--danger)' : 'var(--text)', border: `1px solid ${isBlocked ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isBlocked ? 'Desbloquear Conta' : 'Bloquear Usuário'}
          </button>
          <button style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mensagem</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Reatribuir plano
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          {/* Profile Hero (Avatar à frente e SVG decorativo laranja)[cite: 9] */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '22px', opacity: isBlocked ? 0.6 : 1, transition: 'opacity 0.3s' }}>
            <div style={{ height: '84px', background: isBlocked ? 'var(--border)' : 'linear-gradient(135deg,#F55F16,#FF7A3D)', position: 'relative' }}>
              <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', opacity: '.14' }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', alignItems: 'flex-end', gap: '18px', flexWrap: 'wrap', marginTop: '-36px' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '22px', background: isBlocked ? 'var(--muted)' : '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '30px', border: '4px solid var(--surface)', flexShrink: 0, zIndex: 10 }}>MS</div>
              <div style={{ flex: 1, minWidth: '200px', paddingBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em', textDecoration: isBlocked ? 'line-through' : 'none' }}>Mariana Silva</h1>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16', textTransform: 'uppercase' }}>Pro</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: isBlocked ? 'rgba(239,68,68,.12)' : 'rgba(22,163,74,.12)', color: isBlocked ? 'var(--danger)' : '#16a34a', textTransform: 'uppercase' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isBlocked ? 'var(--danger)' : '#16a34a' }}></span> {isBlocked ? 'Inativo' : 'Ativo'}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Membro desde mar 2025 · São Paulo, BR · ID 8f3a…c21</p>
              </div>
              <div style={{ display: 'flex', gap: '26px', paddingBottom: '4px' }}>
                <div><p style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>88<span style={{ fontSize: '13px', color: 'var(--muted)' }}>%</span></p><p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Adesão</p></div>
                <div><p style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>142</p><p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Treinos</p></div>
                <div><p style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>37</p><p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Dias seguidos</p></div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => setTab('overview')} style={tabStyle(tab === 'overview')}>Visão geral</button>
            <button onClick={() => setTab('health')} style={tabStyle(tab === 'health')}>Saúde & metas</button>
            <button onClick={() => setTab('plans')} style={tabStyle(tab === 'plans')}>Planos atribuídos</button>
            <button onClick={() => setTab('activity')} style={tabStyle(tab === 'activity')}>Atividade & adesão</button>
          </div>

          {/* ===== TAB: VISÃO GERAL ===== */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Dados Pessoais</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Nome completo</span><span style={{ fontWeight: 700 }}>Mariana Silva</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Gênero</span><span style={{ fontWeight: 700 }}>Feminino</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Idade</span><span style={{ fontWeight: 700 }}>32 anos</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Peso</span><span style={{ fontWeight: 700 }}>64 kg</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Altura</span><span style={{ fontWeight: 700 }}>168 cm</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>IMC</span><span style={{ fontWeight: 800, color: '#16a34a' }}>22.7 · Saudável</span></div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Conta & Assinatura</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Plano</span><span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16' }}>Pro · Anual</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Próx. cobrança</span><span style={{ fontWeight: 700 }}>12 mar 2026</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Valor</span><span style={{ fontWeight: 700 }}>R$ 299,00/ano</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Onboarding</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800, color: '#16a34a' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> Completo</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Último acesso</span><span style={{ fontWeight: 700 }}>há 2 horas</span></div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Resumo de Atividade</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Treinos esta semana</span><span style={{ fontSize: '13px', fontWeight: 800 }}>4 / 5</span></div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: '80%', background: '#F55F16', borderRadius: '4px' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Refeições registradas</span><span style={{ fontSize: '13px', fontWeight: 800 }}>26 / 35</span></div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: '74%', background: '#16a34a', borderRadius: '4px' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Meta calórica média</span><span style={{ fontSize: '13px', fontWeight: 800 }}>1.760 / 1.800</span></div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: '97%', background: '#3b82f6', borderRadius: '4px' }}></div></div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===== TAB: SAÚDE & METAS ===== */}
          {tab === 'health' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Objetivos</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--brand)', color: '#fff' }}>Hipertrofia</span>
                  <span style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>Definição</span>
                  <span style={{ display: 'inline-flex', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>Mais energia</span>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Condições de Saúde</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(217,119,6,.12)', color: '#d97706', border: '1px solid rgba(217,119,6,.25)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> Lesão no joelho (direito)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Sem outras condições</span>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>Exercícios contraindicados são ocultados automaticamente no plano da usuária.</p>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Preferências de Treino</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Nível</span><span style={{ fontWeight: 700 }}>Intermediário</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Ambiente</span><span style={{ fontWeight: 700 }}>Academia</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Dias/semana</span><span style={{ fontWeight: 700 }}>5 dias</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Duração/sessão</span><span style={{ fontWeight: 700 }}>45 min</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Equipamentos</span><span style={{ fontWeight: 700, textAlign: 'right' }}>Barra, Halteres, Máquina</span></div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Preferências Nutricionais</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Preferência</span><span style={{ fontWeight: 700 }}>Onívoro</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Restrições</span><span style={{ fontWeight: 700, textAlign: 'right' }}>Sem lactose</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Refeições/dia</span><span style={{ fontWeight: 700 }}>5</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Dias/semana</span><span style={{ fontWeight: 700 }}>7 dias</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Não gosta de</span><span style={{ fontWeight: 700, textAlign: 'right' }}>Fígado, jiló</span></div>
                </div>
              </section>
            </div>
          )}

          {/* ===== TAB: PLANOS ATRIBUÍDOS (Completa)[cite: 9] ===== */}
          {tab === 'plans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Plano de Treino Atual</h3>
                  <a href="#" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Ver plano</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Hipertrofia 12 Semanas</p>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>Iniciado há 6 semanas · 5 dias/sem · Semana 6 de 12</p>
                  </div>
                  <div style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Progresso</span><span style={{ fontSize: '12px', fontWeight: 800 }}>50%</span></div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: '50%', background: 'var(--brand)', borderRadius: '4px' }}></div></div>
                  </div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Plano Alimentar Atual</h3>
                  <a href="#" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Ver plano</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Cutting 1.800 kcal</p>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>5 refeições/dia · meta 1.800 kcal · 40P / 35C / 25G</p>
                  </div>
                  <div style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Aderência</span><span style={{ fontSize: '12px', fontWeight: 800 }}>74%</span></div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: '74%', background: '#16a34a', borderRadius: '4px' }}></div></div>
                  </div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Histórico de Atribuições</h3></div>
                <div>
                  {history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: h.iconBg, color: h.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{h.icon}</span>
                      <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{h.name}</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{h.kind}</p></div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{h.period}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ===== TAB: ATIVIDADE & ADESÃO (Completa)[cite: 9] ===== */}
          {tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Adesão aos Treinos</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>Treinos concluídos nas últimas 12 semanas</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                    Menos
                    <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: 'var(--surface-2)' }}></span>
                    <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: 'rgba(245,95,22,.3)' }}></span>
                    <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: 'rgba(245,95,22,.6)' }}></span>
                    <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: '#F55F16' }}></span>
                    Mais
                  </div>
                </div>
                {renderHeatmap()}
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Treinos Concluídos</h3></div>
                  <div>
                    {workouts.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>
                        <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{w.name}</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{w.detail}</p></div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{w.when}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Refeições Registradas</h3></div>
                  <div>
                    {meals.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(22,163,74,.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '15px' }}>{m.emoji}</span>
                        <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{m.name}</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{m.kcal} kcal consumidas</p></div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{m.when}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}