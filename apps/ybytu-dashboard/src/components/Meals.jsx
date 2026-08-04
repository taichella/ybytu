import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Meals() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Estilo das abas de filtro[cite: 17]
  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  // Cálculo matemático para o Donut das Refeições[cite: 17]
  const getDonut = (prot, carb, fat, size = 56) => {
    const pc = prot * 4, cc = carb * 4, fc = fat * 9, tot = pc + cc + fc || 1;
    const dProt = +(pc / tot * 100).toFixed(1);
    const dCarb = +(cc / tot * 100).toFixed(1);
    // Usando as cores hexadecimais correspondentes a --prot, --carb, --fat[cite: 17]
    const bg = `conic-gradient(#3b82f6 0% ${dProt}%, #f59e0b ${dProt}% ${dProt + dCarb}%, #a855f7 ${dProt + dCarb}% 100%)`;
    
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundImage: bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: `${Math.round(size * 0.56)}px`, height: `${Math.round(size * 0.56)}px`, borderRadius: '50%', background: 'var(--field)' }}></div>
      </div>
    );
  };

  // Função para criar o objeto da refeição (para a listagem mockada)[cite: 17]
  const createMeal = (id, name, type, typeIcon, prep, ingCount, kcal, prot, carb, fat, tags, inactive, imgId) => ({
    id, name, type, typeIcon, prep, ingCount, kcal, prot, carb, fat, tags, inactive, imgId
  });

  const allMeals = [
    createMeal(1, 'Bowl de Frango com Quinoa', 'Almoço', '🥗', 25, 7, 520, 42, 48, 14, ['Low carb', 'Sem glúten'], false, 'meal-1'),
    createMeal(2, 'Panqueca de Banana & Aveia', 'Café da manhã', '🥞', 15, 5, 340, 12, 52, 8, ['Vegetariano'], false, 'meal-2'),
    createMeal(3, 'Salmão com Legumes', 'Jantar', '🍽️', 30, 6, 460, 38, 18, 26, ['Keto', 'Sem lactose'], false, 'meal-3'),
    createMeal(4, 'Iogurte com Frutas & Granola', 'Lanche', '🥛', 5, 4, 260, 14, 38, 6, ['Vegetariano'], false, 'meal-4'),
    createMeal(5, 'Omelete de Espinafre', 'Café da manhã', '🍳', 12, 5, 290, 22, 6, 20, ['Low carb', 'Keto'], false, 'meal-5'),
    createMeal(6, 'Wrap Vegano de Grão-de-bico', 'Almoço', '🌯', 20, 8, 410, 16, 58, 12, ['Vegano', 'Sem lactose'], true, 'meal-6'),
  ];

  // Filtro inteligente pelas abas
  const filteredMeals = allMeals.filter(m => {
    if (tab === 'all') return true;
    if (tab === 'cafe' && m.type !== 'Café da manhã') return false;
    if (tab === 'almoco' && m.type !== 'Almoço') return false;
    if (tab === 'janta' && m.type !== 'Jantar') return false;
    if (tab === 'lanche' && m.type !== 'Lanche') return false;
    return true;
  });

  return (
    <>
      {/* HEADER[cite: 17] */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar refeição, receita…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/meal-editor" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Nova refeição
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT[cite: 17] */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Refeições & Receitas</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Receitas multilíngues com ingredientes, modo de preparo e macros calculados. <strong style={{ color: 'var(--text)' }}>312</strong> refeições.</p>
          </div>

          {/* TABS[cite: 17] */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => setTab('all')} style={tabStyle(tab === 'all')}>Todas</button>
            <button onClick={() => setTab('cafe')} style={tabStyle(tab === 'cafe')}>Café da manhã</button>
            <button onClick={() => setTab('almoco')} style={tabStyle(tab === 'almoco')}>Almoço</button>
            <button onClick={() => setTab('janta')} style={tabStyle(tab === 'janta')}>Jantar</button>
            <button onClick={() => setTab('lanche')} style={tabStyle(tab === 'lanche')}>Lanche</button>
          </div>

          {/* GRID DE REFEIÇÕES[cite: 17] */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
            {filteredMeals.map((m) => (
              <div key={m.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative' }}>
                  {/* Para simular a imagem do prato[cite: 17] */}
                  <div style={{ width: '100%', height: '150px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
                    [Foto do Prato: {m.imgId}]
                  </div>
                  <span style={{ position: 'absolute', top: '10px', left: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {m.typeIcon} {m.type}
                  </span>
                  {m.inactive && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', display: 'inline-flex', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, background: 'rgba(0,0,0,.55)', color: '#fbbf24', backdropFilter: 'blur(4px)', textTransform: 'uppercase' }}>Inativa</span>
                  )}
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>{m.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '7px 0 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> {m.prep} min</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg> {m.ingCount} ingredientes</span>
                  </div>
                  
                  {/* Macros Row[cite: 17] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--field)', borderRadius: '12px', marginBottom: '14px' }}>
                    {getDonut(m.prot, m.carb, m.fat)}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Calorias</span><span style={{ fontSize: '15px', fontWeight: 900 }}>{m.kcal} kcal</span></div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }}></span>P {m.prot}g</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }}></span>C {m.carb}g</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a855f7' }}></span>G {m.fat}g</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', flex: 1, alignContent: 'flex-start' }}>
                    {m.tags.map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t}</span>)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <Link to={`/meal-editor/${m.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar receita
                    </Link>
                    <button style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
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