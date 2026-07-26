import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ExerciseEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id; // Se não tem ID, é criação de um novo exercício

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

  const avoidConditions = isNew ? [] : ['Hérnia de disco', 'Lesão lombar'];
  const cautionConditions = isNew ? [] : ['Lesão no joelho'];

  const selectedMuscles = isNew ? [] : [
    { name: 'Quadríceps', primary: true },
    { name: 'Glúteos', primary: true },
    { name: 'Core', primary: false }
  ];

  const selectedEquipments = isNew ? [] : ['Barra', 'Anilha'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/exercises')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/exercises')}>Exercícios</span><span>/</span>
              <span style={{ color: 'var(--text)' }}>{isNew ? 'Criar' : 'Editar'}</span>
              {!isNew && <span style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: '6px', fontSize: '11px' }}>EX-0142</span>}
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isNew ? 'Novo Exercício' : 'Agachamento Livre'}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/exercises')} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg> {isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

          {/* Language bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"></path></svg>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Conteúdo exibido ao usuário no idioma do app — edite cada idioma.</span>
            </div>
            <div style={{ display: 'flex', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setLang('pt')} style={langBtnStyle(lang === 'pt')}>🇧🇷 Português</button>
              <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>🇬🇧 English</button>
              <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>🇫🇷 Français</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)', gap: '22px', alignItems: 'start' }}>

            {/* LEFT column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Media */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Mídia de Execução</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)' }}>Vídeo e imagem exibidos no app durante o treino.</p>
                
                <div style={{ width: '100%', height: '280px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 600 }}>
                  Arraste o vídeo / GIF de demonstração
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>video_url</label>
                    <input type="text" defaultValue={isNew ? '' : "https://cdn.ybytu.com/ex/agachamento.mp4"} style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>image_url</label>
                    <input type="text" defaultValue={isNew ? '' : "https://cdn.ybytu.com/ex/agachamento.jpg"} style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                </div>
              </section>

              {/* Instructions */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Instruções de Execução</h3>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '7px', background: 'var(--brand-soft)', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {lang === 'pt' ? 'PT-BR' : (lang === 'en' ? 'EN' : 'FR')}
                  </span>
                </div>
                {lang === 'pt' && <textarea rows="7" defaultValue={isNew ? '' : "1. Posicione a barra sobre o trapézio, pés na largura dos ombros...\n2. Inspire, contraia o core e desça...\n3. Desça até as coxas ficarem paralelas...\n4. Suba empurrando o chão..."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
                {lang === 'en' && <textarea rows="7" defaultValue={isNew ? '' : "1. Position the bar on your traps...\n2. Inhale, brace your core...\n3. Lower until thighs are parallel...\n4. Drive through your feet to stand up..."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
                {lang === 'fr' && <textarea rows="7" defaultValue={isNew ? '' : "1. Placez la barre sur les trapèzes...\n2. Inspirez, gainez et descendez...\n3. Descendez jusqu'à ce que les cuisses soient parallèles...\n4. Remontez en poussant dans les pieds..."} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />}
              </section>

              {/* Health conditions */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Condições de Saúde</h3>
                <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--muted)' }}>O app oculta ou alerta o exercício conforme as condições do usuário.</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#ef4444', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path></svg></span>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.04em' }}>Evitar — contraindicado</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {avoidConditions.map((c, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(239,68,68,.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)' }}>
                      {c} <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                    </span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#d97706', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg></span>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.04em' }}>Cautela — orientar adaptação</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cautionConditions.map((c, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(217,119,6,.10)', color: '#d97706', border: '1px solid rgba(217,119,6,.25)' }}>
                      {c} <button style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', display: 'flex', padding: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                    </span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar
                  </button>
                </div>
              </section>
            </div>

            {/* RIGHT column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Identificação */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Identificação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome do exercício <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', background: 'var(--brand-soft)', color: 'var(--brand)' }}>{lang === 'pt' ? 'PT-BR' : (lang === 'en' ? 'EN' : 'FR')}</span></label>
                    {lang === 'pt' && <input type="text" defaultValue={isNew ? '' : "Agachamento Livre"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'en' && <input type="text" defaultValue={isNew ? '' : "Barbell Back Squat"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'fr' && <input type="text" defaultValue={isNew ? '' : "Squat à la barre"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Código de referência (exercise_id)</label>
                    <input type="text" defaultValue={isNew ? '' : "EX-0142"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                </div>
              </section>

              {/* Classificação */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Classificação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nível</label>
                    <select defaultValue={isNew ? 'Iniciante' : 'Avançado'} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                      <option>Avançado</option><option>Intermediário</option><option>Iniciante</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Calorias (kcal/min)</label>
                    <input type="text" defaultValue={isNew ? '' : "8"} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} />
                  </div>
                </div>
              </section>

              {/* Grupos musculares */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Grupos Musculares</h3>
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <svg viewBox="0 0 90 170" style={{ width: '80px', flexShrink: 0 }}>
                    <ellipse cx="45" cy="14" rx="10" ry="12" fill="var(--surface-2)" stroke="var(--border)"/>
                    <rect x="33" y="28" width="24" height="40" rx="8" fill="var(--surface-2)" stroke="var(--border)"/>
                    <rect x="20" y="32" width="11" height="38" rx="5" fill="var(--surface-2)" stroke="var(--border)"/>
                    <rect x="59" y="32" width="11" height="38" rx="5" fill="var(--surface-2)" stroke="var(--border)"/>
                    <rect x="33" y="70" width="11" height="48" rx="5" fill={isNew ? 'var(--surface-2)' : '#F55F16'} opacity="0.85" stroke="var(--border)"/>
                    <rect x="46" y="70" width="11" height="48" rx="5" fill={isNew ? 'var(--surface-2)' : '#F55F16'} opacity="0.85" stroke="var(--border)"/>
                    <rect x="33" y="120" width="11" height="42" rx="5" fill={isNew ? 'var(--surface-2)' : '#F55F16'} opacity="0.4" stroke="var(--border)"/>
                    <rect x="46" y="120" width="11" height="42" rx="5" fill={isNew ? 'var(--surface-2)' : '#F55F16'} opacity="0.4" stroke="var(--border)"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Selecionados</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {selectedMuscles.map((m, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: m.primary ? 'var(--brand)' : 'var(--brand-soft)', color: m.primary ? '#fff' : 'var(--brand)' }}>
                          {m.name} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .8, cursor: 'pointer' }}><path d="M18 6 6 18M6 6l12 12"></path></svg>
                        </span>
                      ))}
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Equipamentos */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Equipamentos</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedEquipments.map((e, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg> {e} 
                      <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                    </span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar equipamento
                  </button>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}