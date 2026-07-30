import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Exercises() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('table'); // 'table' ou 'grid'


  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Lógica de estilos para os botões de toggle (Tabela/Grade)
  const viewBtnStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.12)' : 'none'
  });

  // Helper para as pílulas de idioma
  const langPill = (isActive) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '18px', borderRadius: '5px', fontSize: '9px', fontWeight: 800, letterSpacing: '.02em',
    background: isActive ? 'var(--brand)' : 'var(--surface-2)',
    color: isActive ? '#fff' : 'var(--muted)',
    opacity: isActive ? 1 : 0.55,
    border: isActive ? 'none' : '1px solid var(--border)'
  });

  const LV = {
    ini: { level: 'Iniciante', levelBg: 'var(--surface-2)', levelColor: 'var(--muted)' },
    inter: { level: 'Intermediário', levelBg: 'rgba(59,130,246,.12)', levelColor: '#3b82f6' },
    av: { level: 'Avançado', levelBg: 'rgba(245,95,22,.14)', levelColor: '#F55F16' },
  };

  const createEx = (name, ref, groups, equips, lv, kcal, avoid, caution, langs) => {
    const total = avoid + caution;
    const health = avoid > 0
      ? { healthBg: 'rgba(239,68,68,.12)', healthColor: '#ef4444' }
      : { healthBg: 'rgba(217,119,6,.14)', healthColor: '#d97706' };
    const eqMore = equips.length > 1 ? ` +${equips.length - 1}` : '';
    
    return {
      name, ref, kcal,
      groupsShown: groups.slice(0, 2),
      hasMoreGroups: groups.length > 2, 
      moreGroups: '+' + (groups.length - 2),
      equipLabel: equips[0] + eqMore,
      ...LV[lv],
      healthNone: total === 0, healthWarn: total > 0, healthCount: total, ...health,
      langPills: [ 
        { code: 'PT', style: langPill(langs.includes('pt')) }, 
        { code: 'EN', style: langPill(langs.includes('en')) }, 
        { code: 'FR', style: langPill(langs.includes('fr')) } 
      ],
    };
  };

  const exercises = [
    createEx('Agachamento Livre', 'EX-0142', ['Quadríceps', 'Glúteos', 'Core'], ['Barra', 'Anilha'], 'av', 8, 1, 1, ['pt', 'en', 'fr']),
    createEx('Leg Press 45º', 'EX-0088', ['Quadríceps', 'Glúteos'], ['Máquina'], 'ini', 6, 0, 1, ['pt', 'en']),
    createEx('Supino Reto', 'EX-0031', ['Peitoral', 'Tríceps'], ['Barra', 'Banco'], 'inter', 7, 0, 1, ['pt', 'en', 'fr']),
    createEx('Puxada Frontal', 'EX-0205', ['Costas', 'Bíceps'], ['Cabo/Polia'], 'inter', 5, 0, 0, ['pt', 'en']),
    createEx('Flexão de Braço', 'EX-0009', ['Peitoral', 'Tríceps', 'Core'], ['Peso corporal'], 'ini', 5, 0, 0, ['pt', 'en', 'fr']),
    createEx('Levantamento Terra', 'EX-0177', ['Posteriores', 'Glúteos', 'Lombar'], ['Barra', 'Anilha'], 'av', 9, 2, 1, ['pt', 'en', 'fr']),
  ];

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar exercício, grupo muscular…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '9px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path></svg> Importar CSV
          </button>
          {/* Link para o futuro editor de exercícios */}
          <Link to="/exercise-editor" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo exercício
          </Link>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Biblioteca de Exercícios</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Banco multilíngue de exercícios (PT · EN · FR) com mídia, músculos e restrições de saúde. <strong style={{ color: 'var(--text)' }}>450</strong> exercícios.</p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setView('table')} title="Tabela" style={viewBtnStyle(view === 'table')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg> Tabela
              </button>
              <button onClick={() => setView('grid')} title="Grade" style={viewBtnStyle(view === 'grid')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg> Grade
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '280px' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
              <input type="text" placeholder="Filtrar nesta lista…" style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Qualquer grupo</option><option>Peitoral</option><option>Costas</option><option>Quadríceps</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Qualquer equipamento</option><option>Peso corporal</option><option>Halteres</option><option>Barra</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Qualquer nível</option><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Restrições de saúde</option><option>Com restrições</option><option>Sem restrições</option></select>
          </div>

          {/* VIEW: TABLE */}
          {view === 'table' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ width: '44px', textAlign: 'center', padding: '13px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Exercício</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Grupos musculares</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Equipamento</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nível</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Kcal</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Saúde</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Idiomas</th>
                      <th style={{ textAlign: 'right', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                            <div style={{ width: '60px', height: '42px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                            </div>
                            <div><p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{ex.name}</p><p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: '.02em' }}>{ex.ref}</p></div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {ex.groupsShown.map((g, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>{g}</span>)}
                            {ex.hasMoreGroups && <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>{ex.moreGroups}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg> {ex.equipLabel}</span></td>
                        <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: ex.levelBg, color: ex.levelColor }}>{ex.level}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700 }}>{ex.kcal}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {ex.healthNone ? <span style={{ color: 'var(--muted)', opacity: 0.4 }}>—</span> : (
                            <span title="Possui restrições de saúde" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: ex.healthBg, color: ex.healthColor }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> {ex.healthCount}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {ex.langPills.map((l, i) => <span key={i} style={l.style}>{l.code}</span>)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link to="/exercise-editor" style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', textDecoration: 'none' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                          </Link>
                          <button style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', marginLeft: '2px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', background: 'var(--bg)', flexWrap: 'wrap', gap: '10px' }}>
                <span>Mostrando <strong style={{ color: 'var(--text)' }}>1–6</strong> de 450 exercícios</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed', opacity: .5, fontFamily: 'inherit' }}>Anterior</button>
                  <button style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>1</button>
                  <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>2</button>
                  <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Próximo</button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GRID */}
          {view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {exercises.map((ex, idx) => (
                <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', height: '150px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    {/* Placeholder para imagem/vídeo */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                    
                    {ex.healthWarn && (
                      <span title="Possui restrições de saúde" style={{ position: 'absolute', top: '10px', left: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: ex.healthBg, color: ex.healthColor, backdropFilter: 'blur(4px)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> {ex.healthCount}
                      </span>
                    )}
                    <span style={{ position: 'absolute', top: '10px', right: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 8.5 22 9.3l-5 4.6L18.5 21 12 17.3 5.5 21 7 13.9l-5-4.6 7-.8z"></path></svg> {ex.kcal} kcal
                    </span>
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{ex.name}</p><p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.ref}</p></div>
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0, background: ex.levelBg, color: ex.levelColor }}>{ex.level}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {ex.groupsShown.map((g, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>{g}</span>)}
                      {ex.hasMoreGroups && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)' }}>{ex.moreGroups}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, minWidth: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg> 
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.equipLabel}</span>
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {ex.langPills.map((l, i) => <span key={i} style={l.style}>{l.code}</span>)}
                      </div>
                    </div>
                    <Link to="/exercise-editor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', border: '1px solid var(--border)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}