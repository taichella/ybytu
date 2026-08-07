import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function FoodEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id; // Se não houver ID na URL, estamos a criar um Novo Alimento
  
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('pt');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const langBtnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '8px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--brand)' : 'transparent',
    color: isActive ? '#fff' : 'var(--muted)'
  });

  // Lógica do Gráfico Donut. Se for novo alimento, começa a zero.
  const pc = isNew ? 0 : 31 * 4;
  const cc = isNew ? 0 : 0;
  const fc = isNew ? 0 : 3.6 * 9;
  const tot = pc + cc + fc || 1;
  const dProt = +(pc / tot * 100).toFixed(1);
  const dCarb = +(cc / tot * 100).toFixed(1);
  
  // Se for novo alimento, exibe cinza neutro
  const bgDonut = isNew 
    ? `var(--surface-2)` 
    : `conic-gradient(var(--prot) 0 ${dProt}%, var(--carb) ${dProt}% ${dProt + dCarb}%, var(--fat) ${dProt + dCarb}% 100%)`;

  const macros = [
    { label: 'Proteínas', value: isNew ? '' : '31', unit: 'g' }, { label: 'Carboidratos', value: isNew ? '' : '0', unit: 'g' },
    { label: 'Gorduras totais', value: isNew ? '' : '3.6', unit: 'g' }, { label: 'Gord. saturadas', value: isNew ? '' : '1.0', unit: 'g' },
    { label: 'Gord. trans', value: isNew ? '' : '0', unit: 'g' }, { label: 'Fibras', value: isNew ? '' : '0', unit: 'g' },
    { label: 'Açúcares', value: isNew ? '' : '0', unit: 'g' }, { label: 'Colesterol', value: isNew ? '' : '85', unit: 'mg' }
  ];

  const micros = [
    { label: 'Sódio', value: isNew ? '' : '74', unit: 'mg' }, { label: 'Cálcio', value: isNew ? '' : '15', unit: 'mg' },
    { label: 'Ferro', value: isNew ? '' : '1.0', unit: 'mg' }, { label: 'Potássio', value: isNew ? '' : '256', unit: 'mg' },
    { label: 'Magnésio', value: isNew ? '' : '29', unit: 'mg' }, { label: 'Energia', value: isNew ? '' : '165', unit: 'kcal' }
  ];

  const vitamins = isNew ? [] : ['Vitamina B6', 'Niacina (B3)', 'Fósforo', 'Selênio'];
  const dietTags = isNew ? [] : ['Low carb', 'Sem glúten', 'Sem lactose', 'Keto'];
  const functionalTags = isNew ? [] : ['Rico em proteína', 'Magro'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/foods')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/foods')}>Alimentos</span><span>/</span>
              <span style={{ color: 'var(--text)' }}>{isNew ? 'Criar' : 'Editar'}</span>
              {!isNew && <span style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: '6px', fontSize: '11px' }}>FOOD-0142</span>}
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isNew ? 'Novo Alimento' : 'Peito de Frango Grelhado'}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/foods')} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg> {isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

          {/* Selector de Idioma */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"></path></svg>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Nome exibido ao usuário por idioma.</span>
            </div>
            <div style={{ display: 'flex', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setLang('pt')} style={langBtnStyle(lang === 'pt')}>🇧🇷 PT</button>
              <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>🇬🇧 EN</button>
              <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>🇫🇷 FR</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '22px', alignItems: 'start' }}>

            {/* COLUNA ESQUERDA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Resumo Nutricional */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Resumo Nutricional <span style={{ color: 'var(--muted)', fontWeight: 600, textTransform: 'none', fontSize: '13px' }}>· por porção (100 g)</span></h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: bgDonut, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{isNew ? '0' : '165'}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>kcal</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Energia</span>
                      <span style={{ fontSize: '22px', fontWeight: 900 }}>{isNew ? '0' : '165'} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>kcal</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'var(--prot)' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Proteínas</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{isNew ? '0' : '31'} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>{isNew ? '0%' : '75%'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'var(--carb)' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Carboidratos</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{isNew ? '0' : '0'} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>0%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: 'var(--fat)' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Gorduras</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{isNew ? '0' : '3.6'} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>{isNew ? '0%' : '20%'}</span></div>
                  </div>
                </div>
              </section>

              {/* Tabela Completa */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Tabela Nutricional Completa</h3>
                
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Macronutrientes</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {macros.map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--field)', borderRadius: '11px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{n.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <input type="text" defaultValue={n.value} style={{ width: '56px', padding: '6px 8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 800, outline: 'none', textAlign: 'right' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '28px' }}>{n.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Minerais & Outros</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {micros.map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--field)', borderRadius: '11px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{n.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <input type="text" defaultValue={n.value} style={{ width: '56px', padding: '6px 8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 800, outline: 'none', textAlign: 'right' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '28px' }}>{n.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Vit/Min */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Vitaminas & Minerais (fonte)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {vitamins.map((v, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(22,163,74,.10)', color: '#16a34a', border: '1px solid rgba(22,163,74,.22)' }}>
                      {v} <button style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', display: 'flex', padding: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                    </span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar
                  </button>
                </div>
              </section>
            </div>

            {/* COLUNA DIREITA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Image */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Imagem</h3>
                <div style={{ width: '100%', height: '180px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 600 }}>
                  Arraste a foto do alimento
                </div>
              </section>

              {/* Identification */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Identificação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', background: 'var(--brand-soft)', color: 'var(--brand)' }}>{lang === 'pt' ? 'PT-BR' : (lang === 'en' ? 'EN' : 'FR')}</span></label>
                    {lang === 'pt' && <input type="text" defaultValue={isNew ? '' : "Peito de Frango Grelhado"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'en' && <input type="text" defaultValue={isNew ? '' : "Grilled Chicken Breast"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'fr' && <input type="text" defaultValue={isNew ? '' : "Blanc de poulet grillé"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Código (food_id)</label><input type="text" defaultValue={isNew ? '' : "FOOD-0142"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Marca</label><input type="text" placeholder="—" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  </div>
                </div>
              </section>

              {/* Classification */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Classificação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Grupo</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Proteínas</option><option>Carboidratos</option><option>Vegetais</option><option>Gorduras</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fonte</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>TACO</option><option>USDA</option><option>IBGE</option><option>Rótulo</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preparo</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Grelhado</option><option>Cozido</option><option>Cru</option><option>Assado</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preferência</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Onívoro</option><option>Vegetariano</option><option>Vegano</option></select></div>
                </div>
              </section>

              {/* Portion & Factors */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Porção & Fatores</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Quantidade</label><input type="text" defaultValue="100" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Unidade</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>g</option><option>ml</option><option>un</option></select></div>
                  <div><label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fator correção <span style={{ color: 'var(--brand)', cursor: 'help' }}>ⓘ</span></label><input type="text" defaultValue="1.00" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                  <div><label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fator cocção <span style={{ color: 'var(--brand)', cursor: 'help' }}>ⓘ</span></label><input type="text" defaultValue={isNew ? '1.00' : '0.90'} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                </div>
              </section>

              {/* Restrictions & diet tags */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Restrições & Tags de Dieta</h3>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Adequado para</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' }}>
                  {dietTags.map((t, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(22,163,74,.10)', color: '#16a34a' }}>{t}</span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Add</button>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Tags funcionais</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {functionalTags.map((t, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>{t}</span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Add</button>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}