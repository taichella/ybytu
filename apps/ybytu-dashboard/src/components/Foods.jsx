import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Foods() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('table');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const viewBtnStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.12)' : 'none'
  });

  const GROUPS = {
    prot: { label: 'Proteínas', bg: 'rgba(59,130,246,.12)', color: '#3b82f6' },
    carb: { label: 'Carboidratos', bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
    veg: { label: 'Vegetais', bg: 'rgba(22,163,74,.12)', color: '#16a34a' },
    fruit: { label: 'Frutas', bg: 'rgba(236,72,153,.12)', color: '#ec4899' },
    dairy: { label: 'Laticínios', bg: 'rgba(6,182,212,.12)', color: '#06b6d4' },
    fat: { label: 'Gorduras', bg: 'rgba(168,85,247,.12)', color: '#a855f7' }
  };

  // LÓGICA CORRIGIDA: Cores hexadecimais aplicadas diretamente no conic-gradient
  const getDonut = (prot, carb, fat, kcal, size = 64) => {
    const pc = prot * 4, cc = carb * 4, fc = fat * 9, tot = pc + cc + fc || 1;
    const dProt = +(pc / tot * 100).toFixed(1);
    const dCarb = +(cc / tot * 100).toFixed(1);
    
    // Azul (#3b82f6), Laranja (#f59e0b), Roxo (#a855f7)
    const bg = `conic-gradient(#3b82f6 0% ${dProt}%, #f59e0b ${dProt}% ${dProt + dCarb}%, #a855f7 ${dProt + dCarb}% 100%)`;
    
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: `${size - 14}px`, height: `${size - 14}px`, borderRadius: '50%', background: 'var(--field)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1, color: 'var(--text)' }}>{kcal}</span>
          <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>kcal</span>
        </div>
      </div>
    );
  };

  const createFood = (id, emoji, name, sub, grp, portion, kcal, prot, carb, fat, tags) => ({
    id, emoji, name, sub, ...GROUPS[grp], portion, kcal, prot, carb, fat,
    tagsShown: tags.slice(0, 1),
    hasMoreTags: tags.length > 1,
    moreTags: `+${tags.length - 1}`,
    tagsAll: tags
  });

  const foods = [
    createFood(1, '🍗', 'Peito de Frango Grelhado', 'TACO · grelhado', 'prot', '100 g', 165, 31, 0, 3.6, ['Low carb', 'Sem glúten']),
    createFood(2, '🍚', 'Arroz Branco Cozido', 'TACO · cozido', 'carb', '100 g', 128, 2.5, 28, 0.2, ['Vegano', 'Sem lactose']),
    createFood(3, '🥚', 'Ovo de Galinha', 'TACO · cozido', 'prot', '1 un (50 g)', 78, 6.3, 0.6, 5.3, ['Vegetariano', 'Keto']),
    createFood(4, '🥦', 'Brócolis', 'TACO · cozido', 'veg', '100 g', 35, 2.4, 7, 0.4, ['Vegano', 'Sem glúten']),
    createFood(5, '🍌', 'Banana Prata', 'TACO · in natura', 'fruit', '1 un (100 g)', 98, 1.3, 26, 0.1, ['Vegano']),
    createFood(6, '🥑', 'Abacate', 'TACO · in natura', 'fat', '100 g', 96, 1.2, 6, 8.4, ['Keto', 'Vegano']),
    createFood(7, '🧀', 'Queijo Minas Frescal', 'Rótulo · Tirolez', 'dairy', '30 g', 73, 5.4, 0.9, 5.5, ['Vegetariano']),
  ];

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar alimento, marca, grupo…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '9px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path></svg> Importar TACO
          </button>
          <Link to="/food-editor" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo alimento
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Banco de Alimentos</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Dicionário nutricional multilíngue (PT · EN · FR). <strong style={{ color: 'var(--text)' }}>1.840</strong> alimentos.</p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setView('table')} title="Tabela" style={viewBtnStyle(view === 'table')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg> Tabela
              </button>
              <button onClick={() => setView('grid')} title="Cards" style={viewBtnStyle(view === 'grid')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg> Cards
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '260px' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
              <input type="text" placeholder="Filtrar nesta lista…" style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Fonte</option><option>TACO</option><option>USDA</option><option>IBGE</option><option>Rótulo</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Grupos</option><option>Proteínas</option><option>Carboidratos</option><option>Vegetais</option><option>Frutas</option><option>Laticínios</option><option>Gorduras</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Pref. Alimentar</option><option>Onívoro</option><option>Vegetariano</option><option>Vegano</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Restrições</option><option>Sem glúten</option><option>Sem lactose</option><option>Low carb</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Tags</option><option>Rico em proteína</option><option>Magro</option></select>
          </div>

          {/* TABLE VIEW */}
          {view === 'table' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ width: '44px', textAlign: 'center', padding: '13px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Alimento</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Grupo</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Porção</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Macros (P / C / G)</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Kcal</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Tags</th>
                      <th style={{ textAlign: 'right', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map((f, idx) => (
                      <tr key={idx} className="yb-hover-row" style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{f.emoji}</div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>{f.name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{f.sub}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: f.bg, color: f.color }}>{f.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{f.portion}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 800 }}>
                            <span style={{ color: '#3b82f6' }}>{f.prot}g</span><span style={{ color: 'var(--border)' }}>|</span>
                            <span style={{ color: '#f59e0b' }}>{f.carb}g</span><span style={{ color: 'var(--border)' }}>|</span>
                            <span style={{ color: '#a855f7' }}>{f.fat}g</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 900 }}>{f.kcal}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {f.tagsShown.map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)' }}>{t}</span>)}
                            {f.hasMoreTags && <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>{f.moreTags}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => navigate(`/food-editor/${f.id}`)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                          </button>
                          <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', marginLeft: '2px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {foods.map((f, idx) => (
                <div key={idx} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{f.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{f.portion} · {f.kcal} kcal</p>
                      <span style={{ display: 'inline-flex', marginTop: '6px', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: f.bg, color: f.color }}>{f.label}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--field)', borderRadius: '12px' }}>
                    {getDonut(f.prot, f.carb, f.fat, f.kcal)}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#3b82f6' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Proteína</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.prot}g</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#f59e0b' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Carbo</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.carb}g</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#a855f7' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Gordura</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.fat}g</span></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                    {f.tagsAll.map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t}</span>)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button onClick={() => navigate(`/food-editor/${f.id}`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: '#ef4444', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
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