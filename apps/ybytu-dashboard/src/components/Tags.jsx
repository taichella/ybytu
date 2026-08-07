import { useState, useEffect } from 'react';

export default function Tags() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('gerais');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const tabStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '7px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  // Mock Data[cite: 16]
  const gerais = [
    { id: 'fitness', pt: 'Fitness', en: 'Fitness', fr: 'Fitness', icon: '🏷️', count: 182 },
    { id: 'saudavel', pt: 'Saudável', en: 'Healthy', fr: 'Sain', icon: '🏷️', count: 421 },
    { id: 'rapido', pt: 'Rápido', en: 'Quick', fr: 'Rapide', icon: '🏷️', count: 96 },
    { id: 'economico', pt: 'Econômico', en: 'Budget', fr: 'Économique', icon: '🏷️', count: 73 },
  ];

  const funcionais = [
    { id: 'rico-proteina', pt: 'Rico em proteína', en: 'High protein', fr: 'Riche en protéines', icon: '⚡', count: 214 },
    { id: 'baixo-indice', pt: 'Baixo índice glicêmico', en: 'Low glycemic', fr: 'Faible index glyc.', icon: '⚡', count: 77 },
    { id: 'antioxidante', pt: 'Antioxidante', en: 'Antioxidant', fr: 'Antioxydant', icon: '⚡', count: 103 },
  ];

  const dietCat = {
    pref: { category: 'Preferência', icon: '🥗', bg: 'rgba(22,163,74,.12)', color: '#16a34a' },
    restr: { category: 'Restrição', icon: '⛔', bg: 'rgba(239,68,68,.12)', color: '#ef4444' },
    style: { category: 'Estilo', icon: '✨', bg: 'rgba(168,85,247,.12)', color: '#a855f7' },
  };

  const diet = [
    { id: 'vegano', pt: 'Vegano', en: 'Vegan', fr: 'Végan', cat: 'pref', desc: 'Sem nenhum ingrediente de origem animal.', sort: 1, hasEn: true, hasFr: true, count: 340 },
    { id: 'vegetariano', pt: 'Vegetariano', en: 'Vegetarian', fr: 'Végétarien', cat: 'pref', desc: 'Sem carnes; pode conter ovos e laticínios.', sort: 2, hasEn: true, hasFr: true, count: 512 },
    { id: 'sem-gluten', pt: 'Sem glúten', en: 'Gluten-free', fr: 'Sans gluten', cat: 'restr', desc: 'Exclui trigo, cevada, centeio e derivados.', sort: 1, hasEn: true, hasFr: true, count: 276 },
    { id: 'low-carb', pt: 'Low carb', en: 'Low carb', fr: 'Faible en glucides', cat: 'style', desc: 'Baixo teor de carboidratos por porção.', sort: 1, hasEn: true, hasFr: true, count: 233 },
  ];

  const groups = ['pref', 'restr', 'style'].map(key => {
    const items = diet.filter(d => d.cat === key);
    return { ...dietCat[key], count: items.length, items };
  });

  const curSimple = tab === 'gerais' ? gerais : funcionais;
  
  const hints = {
    gerais: 'Tags livres e descritivas (ex: "rápido", "caseiro"). Aparecem em alimentos, refeições e planos para busca e organização.',
    funcionais: 'Tags de propriedade nutricional/funcional (ex: "rico em proteína"). Usadas para recomendações e filtros inteligentes no app.',
    dieta: 'Tags estruturadas de dieta com categoria, descrição e ordem de exibição — controlam preferências e restrições do usuário no onboarding.',
  };

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar tag…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Nova tag
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}><span>Módulo Nutrição</span><span>/</span><span style={{ color: 'var(--text)' }}>Tags</span></div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Tags</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Vocabulário multilíngue usado para classificar alimentos, refeições e planos.</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => { setTab('gerais'); setShowNew(false); }} style={tabStyle(tab === 'gerais')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle></svg>
              Gerais
            </button>
            <button onClick={() => { setTab('funcionais'); setShowNew(false); }} style={tabStyle(tab === 'funcionais')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              Funcionais
            </button>
            <button onClick={() => { setTab('dieta'); setShowNew(false); }} style={tabStyle(tab === 'dieta')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
              Dieta
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '12px', background: 'var(--brand-soft)', border: '1px solid rgba(245,95,22,.2)', marginBottom: '18px' }}>
            <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0, marginTop: '1px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg></span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{hints[tab]}</p>
          </div>

          {showNew && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--brand)', borderRadius: '16px', padding: '20px', marginBottom: '18px', boxShadow: '0 8px 30px rgba(245,95,22,.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Nova Tag</h3>
                <button onClick={() => setShowNew(false)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>ID</label><input type="text" placeholder="ex: tag-nova" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇧🇷 PT</label><input type="text" placeholder="Nome em português" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇬🇧 EN</label><input type="text" placeholder="Name in English" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇫🇷 FR</label><input type="text" placeholder="Nom en français" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                {tab === 'dieta' && (
                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Categoria</label><select style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Preferência</option><option>Restrição</option><option>Estilo</option><option>Objetivo</option></select></div>
                )}
                <button onClick={() => setShowNew(false)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Adicionar</button>
              </div>
            </div>
          )}

          {/* SIMPLES (Gerais e Funcionais)[cite: 16] */}
          {(tab === 'gerais' || tab === 'funcionais') && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (PT-BR)</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (EN)</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (FR)</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Uso</th>
                      <th style={{ textAlign: 'right', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curSimple.map(t => (
                      <tr key={t.id} className="yb-hover-row" style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '13px 20px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}><span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.icon}</span><span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>{t.id}</span></span></td>
                        <td style={{ padding: '13px 16px' }}><span style={{ display: 'inline-flex', padding: '4px 11px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t.pt}</span></td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t.en}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t.fr}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ display: 'inline-flex', padding: '3px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, background: 'var(--surface-2)', color: 'var(--text)' }}>{t.count}</span></td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                          <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', marginLeft: '2px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DIETA (Rich Layout)[cite: 16] */}
          {tab === 'dieta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {groups.map((g, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', padding: '5px 12px', borderRadius: '8px', background: g.bg, color: g.color }}>{g.icon} {g.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{g.count} tags</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                    {g.items.map(t => (
                      <div key={t.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{t.pt}</p>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--muted)', fontSize: '10px', fontWeight: 800, flexShrink: 0 }} title="Ordem de exibição">{t.sort}</span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{t.id}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                            <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{t.desc}</p>
                        <div style={{ display: 'flex', gap: '5px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: 'var(--surface-2)', color: 'var(--text)' }}>PT</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: t.hasEn ? 'var(--surface-2)' : 'transparent', color: t.hasEn ? 'var(--text)' : 'var(--muted)', opacity: t.hasEn ? 1 : 0.45, border: t.hasEn ? 'none' : '1px dashed var(--border)' }}>EN</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: t.hasFr ? 'var(--surface-2)' : 'transparent', color: t.hasFr ? 'var(--text)' : 'var(--muted)', opacity: t.hasFr ? 1 : 0.45, border: t.hasFr ? 'none' : '1px dashed var(--border)' }}>FR</span>
                          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg> {t.count}</span>
                        </div>
                      </div>
                    ))}
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