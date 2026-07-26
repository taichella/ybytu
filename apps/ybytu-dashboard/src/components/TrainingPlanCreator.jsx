import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function TrainingPlanCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [theme, setTheme] = useState('dark');
  const [mode, setMode] = useState('card');
  const [day, setDay] = useState(0);
  const [settings, setSettings] = useState(true);

  // ESTADO DOS EXERCÍCIOS DA FICHA
  const [blocks, setBlocks] = useState([
    { id: 'b1', letter: 'A', name: 'Supino Reto', group: 'Peitoral', sets: [ { id: 's1', n: 1, reps: '12', load: '50 kg', rest: '90s' } ] },
    { id: 'b2', letter: 'B', name: 'Tríceps Pulley', group: 'Tríceps', sets: [ { id: 's2', n: 1, reps: '15', load: '30 kg', rest: '45s' } ] }
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSettings = () => setSettings(prev => !prev);

  const segStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 16px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.12)' : 'none'
  });

  const dayStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '18px 14px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  const dayDefs = [['Treino A', 'Peito & Tríceps'], ['Treino B', 'Costas & Bíceps'], ['Treino C', 'Pernas']];
  
  const library = [
    { name: 'Supino Inclinado', group: 'Peitoral' }, { name: 'Crucifixo Máquina', group: 'Peitoral' },
    { name: 'Tríceps Testa', group: 'Tríceps' }, { name: 'Crossover', group: 'Peitoral' }, { name: 'Mergulho', group: 'Tríceps' }
  ];

  // FUNÇÕES DA FICHA (BUILDER)
  const addExercise = (libItem) => {
    const newLetter = String.fromCharCode(65 + blocks.length);
    const newBlock = {
      id: `b${Date.now()}`,
      letter: newLetter,
      name: libItem.name,
      group: libItem.group,
      sets: [ { id: `s${Date.now()}`, n: 1, reps: '10', load: '-', rest: '60s' } ]
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeExercise = (blockId) => {
    setBlocks(blocks.filter(b => b.id !== blockId).map((b, i) => ({...b, letter: String.fromCharCode(65 + i)})));
  };

  const addSet = (blockId) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, sets: [...b.sets, { id: `s${Date.now()}`, n: b.sets.length + 1, reps: '10', load: '-', rest: '60s' }] };
      }
      return b;
    }));
  };

  const removeSet = (blockId, setId) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        const newSets = b.sets.filter(s => s.id !== setId).map((s, i) => ({...s, n: i + 1}));
        return { ...b, sets: newSets };
      }
      return b;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/trainings')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/trainings')}>Planos</span><span>/</span><span style={{ color: 'var(--text)' }}>Construtor</span>
            </div>
            <input type="text" defaultValue="Hipertrofia 12 Semanas" style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', padding: '2px 4px', borderRadius: '6px', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleSettings} style={{ display: 'flex', alignItems: 'center', gap: '7px', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: settings ? 'var(--brand-soft)' : 'var(--surface)', color: settings ? 'var(--brand)' : 'var(--text)', border: `1px solid ${settings ? 'rgba(245,95,22,.4)' : 'var(--border)'}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg> Configurações
          </button>
          <button onClick={() => navigate('/trainings')} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg> Publicar
          </button>
        </div>
      </header>

      {/* DAY TABS */}
      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
        {dayDefs.map((d, i) => (
          <button key={i} onClick={() => setDay(i)} style={dayStyle(i === day)}>{d[0]} <span style={{ opacity: .6, fontWeight: 600 }}>· {d[1]}</span></button>
        ))}
      </div>

      {/* BUILDER AREA */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* Library Sidebar */}
        <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Biblioteca · clique p/ adicionar</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
              <input type="text" placeholder="Buscar exercício…" style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {library.map((lib, i) => (
              <div key={i} onClick={() => addExercise(lib)} className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></span>
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lib.name}</p><p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{lib.group}</p></div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Canvas */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Treino A · Peito & Tríceps</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{blocks.length} exercícios na ficha</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {blocks.map((b) => (
                <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--field)' }}>
                    <span style={{ color: 'var(--muted)', display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="18" r="1"></circle></svg></span>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>{b.letter}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{b.name}</p><p style={{ margin: '1px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{b.group}</p></div>
                    <button onClick={() => removeExercise(b.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '5px', borderRadius: '7px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg></button>
                  </div>
                  <div style={{ padding: '8px 16px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr 34px', gap: '10px', alignItems: 'center', padding: '8px 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      <span>Set</span><span>Reps</span><span>Carga</span><span>Descanso</span><span></span>
                    </div>
                    {b.sets.map((s) => (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr 34px', gap: '10px', alignItems: 'center', padding: '5px 0' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>{s.n}</span>
                        <input type="text" defaultValue={s.reps} style={{ width: '100%', padding: '9px 10px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none', textAlign: 'center' }} />
                        <input type="text" defaultValue={s.load} style={{ width: '100%', padding: '9px 10px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none', textAlign: 'center' }} />
                        <input type="text" defaultValue={s.rest} style={{ width: '100%', padding: '9px 10px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none', textAlign: 'center' }} />
                        <button onClick={() => removeSet(b.id, s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '5px' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path></svg></button>
                      </div>
                    ))}
                    <button onClick={() => addSet(b.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'none', border: '1px dashed var(--border)', borderRadius: '9px', padding: '8px 12px', color: 'var(--muted)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Adicionar série
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {blocks.length === 0 && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', border: '2px dashed var(--border)', borderRadius: '14px', color: 'var(--muted)', fontSize: '14px', fontWeight: 700 }}>
                A ficha está vazia. Clique num exercício da biblioteca para adicionar.
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}