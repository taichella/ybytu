import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingService } from '../services/trainingService.js';

const EMPTY_PLAN = {
  training_plan_id: '', name_ptbr: '', name_en: '', name_fr: '',
  goals_ids: [], exercise_environments_ids: [], exercise_equipment_ids: [], exercise_level_id: '',
  days_per_week: 3, duration_minutes: '', instruction_ptbr: '', instruction_en: '', instruction_fr: '',
  is_active: true,
};

export default function TrainingPlanCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [day, setDay] = useState(1);
  const [settings, setSettings] = useState(true);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [isMolde, setIsMolde] = useState(false);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [exSearch, setExSearch] = useState('');
  const [exResults, setExResults] = useState([]);
  const nextUid = useRef(0);
  const searchDebounce = useRef(null);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const lk = await trainingService.getLookups();
        if (cancelled) return;
        setLookups(lk);
        if (!isNew) {
          const { training_plan, slots, is_molde } = await trainingService.getById(id);
          if (cancelled) return;
          setPlan({ ...EMPTY_PLAN, ...training_plan });
          setIsMolde(is_molde);
          const grouped = {};
          (slots ?? []).forEach((s) => {
            const d = s.day_number ?? 1;
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push({
              uniqueId: `s${nextUid.current++}`, exercise_id: s.exercise_id, exercise: s.exercise,
              sets: s.sets, reps: s.reps, rest_seconds: s.rest_seconds, order_within_day: s.order_within_day,
            });
          });
          setSlotsByDay(grouped);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar plano de treino');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    clearTimeout(searchDebounce.current);
    if (exSearch.trim().length < 2) { setExResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await trainingService.searchExercises(exSearch.trim());
        if (!cancelled) setExResults(results ?? []);
      } catch { /* autocomplete, falha silenciosa */ }
    }, 300);
    return () => { cancelled = true; clearTimeout(searchDebounce.current); };
  }, [exSearch]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const setPlanField = (field, value) => setPlan((p) => ({ ...p, [field]: value }));

  const currentSlots = slotsByDay[day] ?? [];

  const addExercise = (ex) => {
    setSlotsByDay((prev) => {
      const list = prev[day] ?? [];
      return {
        ...prev,
        [day]: [...list, { uniqueId: `s${nextUid.current++}`, exercise_id: ex.exercise_id, exercise: ex, sets: 3, reps: 10, rest_seconds: 60, order_within_day: list.length + 1 }],
      };
    });
  };

  const removeSlot = (uniqueId) => {
    setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((s) => s.uniqueId !== uniqueId) }));
  };

  const updateSlot = (uniqueId, field, value) => {
    setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).map((s) => s.uniqueId === uniqueId ? { ...s, [field]: value } : s) }));
  };

  async function handleSave() {
    if (isMolde) {
      const ok = window.confirm('Este treino é um dos moldes ativos (fonte do gerador). Editar afeta todo plano novo gerado a partir de agora para os objetivos que usam este molde. Continuar?');
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...plan, days_per_week: Number(plan.days_per_week) || null, duration_minutes: plan.duration_minutes === '' ? null : Number(plan.duration_minutes) };
      const allSlots = Object.entries(slotsByDay).flatMap(([dayNumber, slots]) =>
        slots.map((s, i) => ({
          exercise_id: s.exercise_id, exercise_order: i + 1, sets: Number(s.sets) || 0, reps: Number(s.reps) || 0,
          rest_seconds: s.rest_seconds === '' ? null : Number(s.rest_seconds),
          day_number: Number(dayNumber), order_within_day: i + 1,
        }))
      );
      if (isNew) {
        const created = await trainingService.create(payload, allSlots);
        navigate(`/training-creator/${created.id}`);
      } else {
        await trainingService.update(id, payload, allSlots);
        navigate('/trainings');
      }
    } catch (e) {
      setError(e.message || 'Falha ao salvar plano de treino');
    } finally {
      setSaving(false);
    }
  }

  const dayStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '18px 14px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });
  const inputStyle = { width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' };

  if (loading) return <div style={{ padding: '28px', color: 'var(--muted)' }}>Carregando…</div>;

  const days = Array.from({ length: Number(plan.days_per_week) || 3 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/trainings')} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>←</button>
          <input type="text" value={plan.name_ptbr} onChange={(e) => setPlanField('name_ptbr', e.target.value)} placeholder="Nome do plano de treino…" style={{ fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => setSettings((s) => !s)} style={{ borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: settings ? 'var(--brand-soft)' : 'var(--surface)', color: settings ? 'var(--brand)' : 'var(--text)', border: `1px solid ${settings ? 'rgba(245,95,22,.4)' : 'var(--border)'}` }}>Configurações</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : (isNew ? 'Criar plano' : 'Salvar')}
          </button>
        </div>
      </header>

      {isMolde && (
        <div style={{ flexShrink: 0, background: 'rgba(245,95,22,.1)', borderBottom: '1px solid rgba(245,95,22,.3)', padding: '10px 28px', fontSize: '13px', fontWeight: 700, color: '#F55F16' }}>
          ⚠️ Este é um molde ativo ({plan.training_plan_id}) — fonte do gerador de planos. Qualquer alteração salva aqui muda o formato de todo plano novo gerado a partir de agora. Um snapshot é gravado antes de cada mudança para permitir reverter.
        </div>
      )}
      {error && <p style={{ color: '#ef4444', padding: '10px 28px 0' }}>{error}</p>}

      {settings && (
        <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '18px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Objetivos</label>
              <select multiple value={plan.goals_ids} onChange={(e) => setPlanField('goals_ids', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputStyle, height: '76px' }}>
                {(lookups?.goals ?? []).map((g) => <option key={g.id} value={g.goal_id}>{g.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Ambiente</label>
              <select multiple value={plan.exercise_environments_ids} onChange={(e) => setPlanField('exercise_environments_ids', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputStyle, height: '76px' }}>
                {(lookups?.exercise_environments ?? []).map((e) => <option key={e.id} value={e.exercise_environment_id}>{e.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Equipamentos</label>
              <select multiple value={plan.exercise_equipment_ids} onChange={(e) => setPlanField('exercise_equipment_ids', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputStyle, height: '76px' }}>
                {(lookups?.exercise_equipments ?? []).map((eq) => <option key={eq.id} value={eq.exercise_equipment_id}>{eq.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Nível</label>
              <select value={plan.exercise_level_id ?? ''} onChange={(e) => setPlanField('exercise_level_id', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {(lookups?.exercise_levels ?? []).map((l) => <option key={l.id} value={l.exercise_level_id}>{l.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Dias por semana</label>
              <input type="number" min="1" max="7" value={plan.days_per_week} onChange={(e) => setPlanField('days_per_week', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Duração (min)</label>
              <input type="number" value={plan.duration_minutes} onChange={(e) => setPlanField('duration_minutes', e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
        {days.map((d) => (
          <button key={d} onClick={() => setDay(d)} style={dayStyle(d === day)}>Dia {d}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Biblioteca · buscar p/ adicionar</p>
            <input type="text" value={exSearch} onChange={(e) => setExSearch(e.target.value)} placeholder="Buscar exercício…" style={inputStyle} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exResults.map((ex) => (
              <div key={ex.id} onClick={() => addExercise(ex)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name_ptbr}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</p>
                </div>
                <span style={{ color: 'var(--brand)' }}>+</span>
              </div>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Dia {day}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{currentSlots.length} exercícios na ficha</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentSlots.map((s, i) => (
                <div key={s.uniqueId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--field)' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{s.exercise?.name_ptbr ?? s.exercise_id}</p></div>
                    <button onClick={() => removeSlot(s.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '14px 16px' }}>
                    <div><label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Séries</label><input type="number" value={s.sets} onChange={(e) => updateSlot(s.uniqueId, 'sets', e.target.value)} style={inputStyle} /></div>
                    <div><label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Reps</label><input type="number" value={s.reps} onChange={(e) => updateSlot(s.uniqueId, 'reps', e.target.value)} style={inputStyle} /></div>
                    <div><label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Descanso (s)</label><input type="number" value={s.rest_seconds ?? ''} onChange={(e) => updateSlot(s.uniqueId, 'rest_seconds', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
              ))}
            </div>

            {currentSlots.length === 0 && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', border: '2px dashed var(--border)', borderRadius: '14px', color: 'var(--muted)', fontSize: '14px', fontWeight: 700 }}>
                A ficha do dia {day} está vazia. Busque um exercício na biblioteca à esquerda.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
