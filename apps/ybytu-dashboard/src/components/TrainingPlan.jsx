import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function TrainingPlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [theme, setTheme] = useState('dark');
  const [day, setDay] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const dayStyle = (isActive) => ({
    border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
    background: isActive ? 'var(--brand-soft)' : 'var(--surface)',
    color: isActive ? 'var(--brand)' : 'var(--text)',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', padding: '10px 16px', borderRadius: '11px', whiteSpace: 'nowrap'
  });

  const dayDefs = [
    ['Treino A', 'Peito & Tríceps'],
    ['Treino B', 'Costas & Bíceps'],
    ['Treino C', 'Pernas'],
    ['Treino D', 'Ombros'],
    ['Treino E', 'Core & Cardio']
  ];

  const ex = (letter, name, group, tag, sets, reps, rest) => ({ letter, name, group, tag, hasTag: !!tag, sets, reps, rest });
  
  const byDay = [
    [ ex('A','Supino Reto','Peitoral','',4,'8–12','90s'), ex('B','Supino Inclinado Halteres','Peitoral','Bi-set',3,'10–12','75s'), ex('C','Crossover','Peitoral','Drop-set',3,'12–15','60s'), ex('D','Tríceps Pulley','Tríceps','',3,'12–15','45s'), ex('E','Tríceps Testa','Tríceps','Falha',3,'10–12','60s') ],
    [ ex('A','Puxada Frontal','Costas','',4,'10–12','90s'), ex('B','Remada Curvada','Costas','',4,'8–10','90s'), ex('C','Remada Unilateral','Costas','',3,'10–12','60s'), ex('D','Rosca Direta','Bíceps','',3,'10–12','45s'), ex('E','Rosca Martelo','Bíceps','Bi-set',3,'12','45s') ],
    [ ex('A','Agachamento Livre','Quadríceps','',4,'6–10','120s'), ex('B','Leg Press 45º','Quadríceps','',4,'12–15','90s'), ex('C','Cadeira Extensora','Quadríceps','Drop-set',3,'15','60s'), ex('D','Stiff','Posterior','',4,'10–12','90s'), ex('E','Panturrilha em Pé','Panturrilha','',4,'15–20','45s') ],
    [ ex('A','Desenvolvimento Militar','Ombros','',4,'8–10','90s'), ex('B','Elevação Lateral','Ombros','',4,'12–15','45s'), ex('C','Elevação Frontal','Ombros','',3,'12','45s'), ex('D','Crucifixo Inverso','Posterior Ombro','',3,'15','45s') ],
    [ ex('A','Prancha','Core','',3,'45s','30s'), ex('B','Abdominal Infra','Core','',3,'15–20','30s'), ex('C','Russian Twist','Core','',3,'20','30s'), ex('D','Esteira (HIIT)','Cardio','',1,'15min','—') ],
  ];

  const currentDef = dayDefs[day];
  const currentExercises = byDay[day];
  const totalSets = currentExercises.reduce((acc, curr) => acc + (Number(curr.sets) || 0), 0);

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/trainings')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/trainings')}>Planos</span><span>/</span><span style={{ color: 'var(--text)' }}>Detalhe</span>
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Hipertrofia 12 Semanas</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6M22 11h-6"></path></svg> Atribuir
          </button>
          <Link to={`/training-creator/${id || '1'}`} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '22px' }}>
            <div style={{ background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', padding: '28px', position: 'relative', overflow: 'hidden', color: '#fff' }}>
              <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-40px', top: '-50px', width: '240px', opacity: .14 }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(0,0,0,.25)', backdropFilter: 'blur(4px)' }}>Hipertrofia</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(0,0,0,.25)', backdropFilter: 'blur(4px)' }}>🏋️ Academia</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(255,255,255,.22)' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }}></span> Ativo</span>
                </div>
                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 900, letterSpacing: '-.02em' }}>Hipertrofia 12 Semanas</h1>
                <p style={{ margin: '8px 0 0', fontSize: '15px', opacity: .94, maxWidth: '560px', lineHeight: 1.55 }}>Programa ABC focado em volume progressivo para ganho de massa muscular. Indicado para alunos intermediários a avançados.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,.92)', color: '#1A202C' }}>PT</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,.92)', color: '#1A202C' }}>EN</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: .85 }}>Criado em 14 mai 2026</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', background: 'var(--surface)' }}>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Frequência</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>5×/sem</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Duração/sessão</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>52 min</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nível</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>Avançado</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Exercícios</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>32</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Equipamentos</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>Barra +3</p></div>
              <div style={{ padding: '18px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Usuários</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900, color: 'var(--brand)' }}>1.240</p></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {dayDefs.map((d, i) => (
              <button key={i} onClick={() => setDay(i)} style={dayStyle(i === day)}>
                <span style={{ fontWeight: 900 }}>{d[0].replace('Treino ', '')}</span><span style={{ opacity: .7, fontWeight: 600, marginLeft: '6px' }}>{d[1]}</span>
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>{currentDef[0]} · {currentDef[1]}</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{currentExercises.length} exercícios · {totalSets} séries totais</p>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~52 min
              </span>
            </div>
            
            <div>
              {currentExercises.map((ex, idx) => (
                <div key={idx} className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', flexShrink: 0 }}>{ex.letter}</span>
                  <div style={{ width: '64px', height: '46px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{ex.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{ex.group}</span>
                      {ex.hasTag && <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 7px', borderRadius: '5px', background: 'var(--brand-soft)', color: 'var(--brand)' }}>{ex.tag}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '22px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{ex.sets}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Séries</p></div>
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{ex.reps}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Reps</p></div>
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{ex.rest}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Desc.</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}