import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function MealEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('pt');

  // Biblioteca de Ingredientes[cite: 14]
  const library = [
    { id: 101, emoji: '🍗', name: 'Peito de Frango', kcalPer: 165, p: 31, c: 0, f: 3.6 },
    { id: 102, emoji: '🍚', name: 'Arroz Integral', kcalPer: 124, p: 2.6, c: 26, f: 1 },
    { id: 103, emoji: '🥚', name: 'Ovo Cozido', kcalPer: 155, p: 13, c: 1.1, f: 11 },
    { id: 104, emoji: '🍠', name: 'Batata-doce', kcalPer: 86, p: 1.6, c: 20, f: 0.1 },
    { id: 105, emoji: '🥗', name: 'Folhas Verdes', kcalPer: 17, p: 1.4, c: 3.3, f: 0.2 },
    { id: 106, emoji: '🫘', name: 'Feijão Preto', kcalPer: 91, p: 6, c: 14, f: 0.5 },
    { id: 107, emoji: '🧀', name: 'Queijo Cottage', kcalPer: 98, p: 11, c: 3.4, f: 4.3 },
    { id: 108, emoji: '🥜', name: 'Pasta de Amendoim', kcalPer: 588, p: 25, c: 20, f: 50 },
  ];

  // Estado inicial dos ingredientes. Se for novo, array vazio. Se for editar, dados mockados do "Bowl de Frango".
  const initialItems = isNew ? [] : [
    { ...library[0], uniqueId: 'it1', qty: 150 }, // Frango
    { ...library[1], uniqueId: 'it2', qty: 100 }, // Quinoa (usando arroz para mock)
    { ...library[2], uniqueId: 'it3', qty: 80 },  // Brocolis (usando ovo para mock)
    { ...library[4], uniqueId: 'it4', qty: 40 },  // Abacate (usando folhas verdes para mock)
  ];

  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const langBtnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 12px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--brand)' : 'transparent',
    color: isActive ? '#fff' : 'var(--muted)'
  });

  // Funções de manipulação do construtor[cite: 14]
  const addFood = (food) => {
    setItems([...items, { ...food, uniqueId: `it${Date.now()}`, qty: 100 }]);
  };

  const removeFood = (uniqueId) => {
    setItems(items.filter(it => it.uniqueId !== uniqueId));
  };

  const updateQty = (uniqueId, newQty) => {
    const qty = Math.max(0, parseInt(newQty.replace(/[^0-9]/g, '')) || 0);
    setItems(items.map(it => it.uniqueId === uniqueId ? { ...it, qty } : it));
  };

  // Cálculos em tempo real[cite: 14]
  const sc = (n) => Math.round(n * 10) / 10;
  
  let P = 0, C = 0, F = 0;
  items.forEach(it => {
    const k = it.qty / 100;
    P += it.p * k;
    C += it.c * k;
    F += it.f * k;
  });

  const pc = P * 4, cc = C * 4, fc = F * 9, tot = pc + cc + fc || 1;
  const kcalTotal = Math.round(tot);
  const dProt = +(pc / tot * 100).toFixed(1);
  const dCarb = +(cc / tot * 100).toFixed(1);
  const bgDonut = `conic-gradient(#3b82f6 0% ${dProt}%, #f59e0b ${dProt}% ${dProt + dCarb}%, #a855f7 ${dProt + dCarb}% 100%)`;

  return (
    <div key={isNew ? 'new' : 'edit'} style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* HEADER[cite: 14] */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/meals')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/meals')}>Refeições</span><span>/</span><span style={{ color: 'var(--text)' }}>Editor de receita</span>
            </div>
            <input type="text" defaultValue={isNew ? '' : "Bowl de Frango com Quinoa"} placeholder="Nome da Refeição..." style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', padding: '2px 4px', borderRadius: '6px', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/meals')} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg> {isNew ? 'Criar Receita' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* BODY BUILDER[cite: 14] */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* FOOD LIBRARY PANEL[cite: 14] */}
        <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Alimentos · clique p/ adicionar</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
              <input type="text" placeholder="Buscar alimento…" style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {library.map((lib) => (
              <div key={lib.id} onClick={() => addFood(lib)} className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>{lib.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lib.name}</p><p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{lib.kcalPer} kcal/100g</p></div>
                <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg></span>
              </div>
            ))}
          </div>
        </aside>

        {/* BUILD AREA[cite: 14] */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            {/* Ingredientes List[cite: 14] */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Ingredientes <span style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '15px' }}>· {items.length} {items.length === 1 ? 'item' : 'itens'}</span></h2>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Ajuste as quantidades — macros recalculam ao vivo</span>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 70px 34px', gap: '10px', padding: '12px 16px', background: 'var(--field)', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                <span>Alimento</span><span style={{ textAlign: 'center' }}>Quantidade</span><span style={{ textAlign: 'right' }}>Kcal</span><span></span>
              </div>
              
              {items.map((it) => {
                const k = it.qty / 100;
                const itKcal = Math.round(it.kcalPer * k);
                const itP = sc(it.p * k);
                const itC = sc(it.c * k);
                const itF = sc(it.f * k);

                return (
                  <div key={it.uniqueId} className="yb-hover-row" style={{ display: 'grid', gridTemplateColumns: '1fr 110px 70px 34px', gap: '10px', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{it.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</p>
                        <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>P {itP} · C {itC} · G {itF}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                      <input type="text" value={it.qty} onChange={(e) => updateQty(it.uniqueId, e.target.value)} style={{ width: '56px', padding: '8px', borderRadius: '8px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none', textAlign: 'center' }} />
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>g</span>
                    </div>
                    <span style={{ textAlign: 'right', fontSize: '14px', fontWeight: 800 }}>{itKcal}</span>
                    <button onClick={() => removeFood(it.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '5px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                    </button>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px', fontWeight: 600 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg> Clique num alimento no painel à esquerda para adicionar
                </div>
              )}
            </div>

            {/* Instructions multilingual[cite: 14] */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Modo de Preparo</h3>
                <div style={{ display: 'flex', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '9px', padding: '3px' }}>
                  <button onClick={() => setLang('pt')} style={langBtnStyle(lang === 'pt')}>🇧🇷 PT</button>
                  <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>🇬🇧 EN</button>
                  <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>🇫🇷 FR</button>
                </div>
              </div>
              {lang === 'pt' && <textarea rows="6" defaultValue={isNew ? "" : "1. Cozinhe a quinoa conforme a embalagem e reserve.\n2. Tempere e grelhe o frango em fogo médio até dourar.\n3. Refogue os legumes rapidamente para manter a crocância.\n4. Monte o bowl: base de quinoa, frango fatiado e legumes por cima."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
              {lang === 'en' && <textarea rows="6" defaultValue={isNew ? "" : "1. Cook the quinoa per package and set aside.\n2. Season and grill the chicken over medium heat until golden.\n3. Quickly sauté the vegetables to keep them crisp.\n4. Assemble the bowl: quinoa base, sliced chicken and veggies on top."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
              {lang === 'fr' && <textarea rows="6" defaultValue={isNew ? "" : "1. Cuisez le quinoa selon l'emballage et réservez.\n2. Assaisonnez et grillez le poulet à feu moyen jusqu'à doré.\n3. Faites sauter rapidement les légumes pour garder le croquant.\n4. Dressez le bowl : base de quinoa, poulet tranché et légumes."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
            </div>
          </div>
        </main>

        {/* LIVE MACRO SUMMARY PANEL[cite: 14] */}
        <aside style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '22px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)' }}>Resumo da Refeição</h3>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--muted)' }}>Calculado a partir dos ingredientes.</p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: items.length > 0 ? bgDonut : 'var(--surface-2)', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '87px', height: '87px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{kcalTotal}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginTop: '2px' }}>kcal</span>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Total de calorias</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Proteínas</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{sc(P)} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6' }}>{items.length > 0 ? Math.round((pc / tot) * 100) : 0}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Carboidratos</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{sc(C)} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>{items.length > 0 ? Math.round((cc / tot) * 100) : 0}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Gorduras</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{sc(F)} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#a855f7' }}>{items.length > 0 ? Math.round((fc / tot) * 100) : 0}%</span>
            </div>
          </div>

          <div style={{ paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Configuração</p>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Tipo de refeição</label>
            <select defaultValue={isNew ? 'Almoço' : 'Almoço'} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer', marginBottom: '12px' }}>
              <option>Almoço</option><option>Café da manhã</option><option>Jantar</option><option>Lanche</option>
            </select>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Tempo de preparo (min)</label>
            <input type="text" defaultValue={isNew ? '' : "25"} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none', marginBottom: '14px' }} />
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Refeição ativa <input type="checkbox" defaultChecked style={{ width: '38px', height: '20px', accentColor: 'var(--brand)' }} /></label>
          </div>
        </aside>
      </div>
    </div>
  );
}