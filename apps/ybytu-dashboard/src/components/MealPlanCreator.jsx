import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mealPlanService } from '../services/mealPlanService';


export default function MealPlanCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [day, setDay] = useState(0);
  const [settings, setSettings] = useState(true);

  // Lógica de Abas de Dia
  const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Biblioteca de Refeições Mockadas[cite: 16]
  const library = [
    { id: 1, emoji: '🥞', name: 'Panqueca de Banana & Aveia', kcal: 340, type: 'Café', prot: 12, carb: 52, fat: 8 },
    { id: 2, emoji: '🍳', name: 'Omelete de Espinafre', kcal: 290, type: 'Café', prot: 22, carb: 6, fat: 20 },
    { id: 3, emoji: '🥗', name: 'Bowl de Frango com Quinoa', kcal: 520, type: 'Almoço', prot: 42, carb: 48, fat: 14 },
    { id: 4, emoji: '🍽️', name: 'Salmão com Legumes', kcal: 460, type: 'Jantar', prot: 38, carb: 18, fat: 26 },
    { id: 5, emoji: '🥛', name: 'Iogurte com Frutas', kcal: 260, type: 'Lanche', prot: 14, carb: 38, fat: 6 },
    { id: 6, emoji: '🌯', name: 'Wrap de Grão-de-bico', kcal: 410, type: 'Almoço', prot: 16, carb: 58, fat: 12 },
    { id: 7, emoji: '🥤', name: 'Shake Proteico', kcal: 220, type: 'Lanche', prot: 25, carb: 18, fat: 4 },
  ];

  // Estado Inicial dos "Slots" do dia vazios.
  const initialSlots = [
    { id: 's1', icon: '☀️', slot: 'Café da manhã', time: '07:00', meal: null },
    { id: 's2', icon: '🍎', slot: 'Lanche da manhã', time: '10:00', meal: null },
    { id: 's3', icon: '🍽️', slot: 'Almoço', time: '13:00', meal: null },
    { id: 's4', icon: '🥛', slot: 'Lanche da tarde', time: '16:00', meal: null },
    { id: 's5', icon: '🌙', slot: 'Jantar', time: '20:00', meal: null }
  ];

  // (Nota: Em produção terias um array de slots POR DIA. Aqui estamos a usar apenas um para exemplificar o editor)
  const [slots, setSlots] = useState(initialSlots);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSettings = () => setSettings(prev => !prev);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const planData = { name_ptbr: 'Novo Plano', user_id: 'dummy-id' };
      await mealPlanService.create(planData);
      navigate('/meal-plans');
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };



  // Manipulação de Refeições nos Slots
  const assignMealToEmptySlot = (meal) => {
    const emptySlotIndex = slots.findIndex(s => !s.meal);
    if (emptySlotIndex !== -1) {
      const newSlots = [...slots];
      newSlots[emptySlotIndex].meal = meal;
      setSlots(newSlots);
    }
  };

  const removeMealFromSlot = (slotId) => {
    setSlots(slots.map(s => s.id === slotId ? { ...s, meal: null } : s));
  };

  // Cálculos do Resumo do Dia
  const dailyGoalKcal = 1800;
  
  let P = 0, C = 0, F = 0, totalKcal = 0;
  slots.forEach(s => {
    if (s.meal) {
      P += s.meal.prot;
      C += s.meal.carb;
      F += s.meal.fat;
      totalKcal += s.meal.kcal;
    }
  });

  const pc = P * 4, cc = C * 4, fc = F * 9, totMacrosKcal = pc + cc + fc || 1;
  const pctP = Math.round((pc / totMacrosKcal) * 100);
  const pctC = Math.round((cc / totMacrosKcal) * 100);
  const pctF = Math.round((fc / totMacrosKcal) * 100);

  const diffKcal = dailyGoalKcal - totalKcal;
  const diffMsg = diffKcal >= 0 ? `${diffKcal} kcal abaixo da meta` : `${Math.abs(diffKcal)} kcal acima da meta`;
  const diffColor = diffKcal >= 0 ? '#16a34a' : '#ef4444';

  // Lógica Gráfico Donut (Resumo do Dia)[cite: 16]
  const getDonut = (size = 130) => {
    const a = pctP;
    const b = pctP + pctC;
    // Cores Hex: Prot Azul, Carb Laranja, Fat Roxo[cite: 16]
    const bg = totalKcal > 0 
      ? `conic-gradient(#3b82f6 0% ${a}%, #f59e0b ${a}% ${b}%, #a855f7 ${b}% 100%)`
      : 'var(--surface-2)';
    const hole = Math.round(size * 0.60);

    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: `${hole}px`, height: `${hole}px`, borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{totalKcal}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginTop: '2px' }}>kcal hoje</span>
        </div>
      </div>
    );
  };

  const dayStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '18px 14px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  return (
    <div key={isNew ? 'new' : 'edit'} style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* HEADER[cite: 16] */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/meal-plans')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/meal-plans')}>Planos Alimentares</span><span>/</span><span style={{ color: 'var(--text)' }}>Construtor</span>
            </div>
            <input type="text" defaultValue={isNew ? '' : "Cutting 1.800 kcal"} placeholder="Nome do plano alimentar..." style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', padding: '2px 4px', borderRadius: '6px', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleSettings} style={{ display: 'flex', alignItems: 'center', gap: '7px', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: settings ? 'var(--brand-soft)' : 'var(--surface)', color: settings ? 'var(--brand)' : 'var(--text)', border: `1px solid ${settings ? 'rgba(245,95,22,.4)' : 'var(--border)'}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg> Configurações
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg> {isSaving ? 'Salvando...' : (isNew ? 'Criar plano' : 'Publicar')}
          </button>
        </div>
      </header>

      {/* PLAN SETTINGS PANEL[cite: 16] */}
      {settings && (
        <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '18px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)' }}>Configurações do plano</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '7px', background: 'rgba(124,58,237,.12)', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M5.6 18.4l1.4-1.4M12 19v2M17 12h2M18.4 5.6 17 7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg> Gerado por IA
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Objetivos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--brand)', color: '#fff' }}>Emagrecimento</span>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Add</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Meta calórica (kcal/dia)</label>
              <input type="text" defaultValue={dailyGoalKcal} style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Refeições por dia</label>
              <input type="text" defaultValue="5" style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preferência</label>
              <select style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Onívoro</option><option>Vegetariano</option><option>Vegano</option></select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Restrições</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Sem lactose</span>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAY TABS[cite: 16] */}
      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
        {dayLabels.map((l, i) => (
          <button key={i} onClick={() => setDay(i)} style={dayStyle(i === day)}>{l}</button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap', paddingLeft: '16px' }}>
          Meta: <strong style={{ color: 'var(--text)' }}>{dailyGoalKcal} kcal</strong>
        </span>
      </div>

      {/* BUILDER AREA */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* MEALS LIBRARY PANEL[cite: 16] */}
        <aside style={{ width: '290px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Refeições · clique p/ adicionar</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
              <input type="text" placeholder="Buscar refeição…" style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {library.map(lib => (
              <div key={lib.id} onClick={() => assignMealToEmptySlot(lib)} className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>{lib.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lib.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{lib.kcal} kcal · {lib.type}</p>
                </div>
                <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg></span>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CANVAS (SLOTS)[cite: 16] */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{dayLabels[day]}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{slots.length} refeições planejadas</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Total do dia</span>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>{totalKcal} <span style={{ fontSize: '12px', color: 'var(--muted)' }}>/ {dailyGoalKcal}</span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: diffColor, background: diffKcal >= 0 ? 'rgba(22,163,74,.1)' : 'rgba(239,68,68,.1)', padding: '3px 8px', borderRadius: '6px' }}>
                  {diffKcal >= 0 ? 'No alvo' : 'Ultrapassou'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {slots.map(s => (
                <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', background: 'var(--field)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '15px' }}>{s.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>{s.slot}</p>
                      <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{s.time}</p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)' }}>{s.meal ? s.meal.kcal : 0} kcal</span>
                  </div>
                  
                  {s.meal ? (
                    <div className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 16px' }}>
                      <span style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.meal.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{s.meal.name}</p>
                        <div style={{ display: 'flex', gap: '9px', marginTop: '3px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#3b82f6' }}></span>P {s.meal.prot}g</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#f59e0b' }}></span>C {s.meal.carb}g</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#a855f7' }}></span>G {s.meal.fat}g</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/meal-editor/${s.meal.id}`)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path><path d="m9 11 3 3L22 4"></path></svg>
                      </button>
                      <button onClick={() => removeMealFromSlot(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', color: 'var(--muted)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Clique numa refeição à esquerda para adicionar aqui
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* DAY SUMMARY PANEL[cite: 16] */}
        <aside style={{ width: '270px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '22px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)' }}>Resumo do Dia</h3>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--muted)' }}>Soma das refeições de {dayLabels[day].toLowerCase()}.</p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '18px' }}>
            {getDonut()}
            <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 700, color: diffColor }}>{diffMsg}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Proteínas</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{P} g</p></div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6' }}>{totalKcal > 0 ? pctP : 0}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Carboidratos</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{C} g</p></div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>{totalKcal > 0 ? pctC : 0}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Gorduras</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{F} g</p></div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7' }}>{totalKcal > 0 ? pctF : 0}%</span>
            </div>
          </div>

          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Duplicar para outro dia
          </button>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '11px', background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)', color: '#7c3aed', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M5.6 18.4l1.4-1.4M12 19v2M17 12h2M18.4 5.6 17 7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg> Preencher dia com IA
          </button>
        </aside>

      </div>
    </div>
  );
}