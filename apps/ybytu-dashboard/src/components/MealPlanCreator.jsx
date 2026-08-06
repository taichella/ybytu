import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mealPlanService } from '../services/mealPlanService.js';

const EMPTY_PLAN = {
  meal_plan_id: '', name_ptbr: '', name_en: '', name_fr: '',
  goals_ids: [], calories: '', meals_per_day: 5, days_per_week: 7,
  instruction_ptbr: '', instruction_en: '', instruction_fr: '',
  dietary_preference: '', restriction_tags: [], is_active: true, created_by_ai: false,
};

export default function MealPlanCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [day, setDay] = useState(1);
  const [settings, setSettings] = useState(true);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mealSearch, setMealSearch] = useState('');
  const [mealResults, setMealResults] = useState([]);
  const nextUid = useRef(0);
  const searchDebounce = useRef(null);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const lk = await mealPlanService.getLookups();
        if (cancelled) return;
        setLookups(lk);
        if (!isNew) {
          const { meal_plan, slots } = await mealPlanService.getById(id);
          if (cancelled) return;
          setPlan({ ...EMPTY_PLAN, ...meal_plan, goals_ids: Array.isArray(meal_plan.goals_ids) ? meal_plan.goals_ids : [], restriction_tags: meal_plan.restriction_tags ?? [] });
          const grouped = {};
          (slots ?? []).forEach((s) => {
            const d = s.day_order;
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push({ uniqueId: `s${nextUid.current++}`, meal_order: s.meal_order, meal_type_id: s.meal_type_id, meal_id: s.meal_id, meal: s.meal });
          });
          setSlotsByDay(grouped);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar plano');
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
    if (mealSearch.trim().length < 2) { setMealResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await mealPlanService.searchMeals(mealSearch.trim());
        if (!cancelled) setMealResults(results ?? []);
      } catch { /* autocomplete, falha silenciosa */ }
    }, 300);
    return () => { cancelled = true; clearTimeout(searchDebounce.current); };
  }, [mealSearch]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const setPlanField = (field, value) => setPlan((p) => ({ ...p, [field]: value }));

  const currentSlots = slotsByDay[day] ?? [];

  const addMealToDay = (meal) => {
    setSlotsByDay((prev) => {
      const list = prev[day] ?? [];
      return {
        ...prev,
        [day]: [...list, { uniqueId: `s${nextUid.current++}`, meal_order: list.length + 1, meal_type_id: meal.meal_type, meal_id: meal.id, meal }],
      };
    });
  };

  const removeSlot = (uniqueId) => {
    setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((s) => s.uniqueId !== uniqueId) }));
  };

  const dayTotals = useMemo(() => {
    let P = 0, C = 0, F = 0, kcal = 0;
    currentSlots.forEach((s) => {
      P += Number(s.meal?.protein_g ?? 0);
      C += Number(s.meal?.carbs_g ?? 0);
      F += Number(s.meal?.fat_g ?? 0);
      kcal += Number(s.meal?.calories ?? 0);
    });
    return { P, C, F, kcal };
  }, [currentSlots]);

  const dailyGoalKcal = Number(plan.calories) || 0;
  const diffKcal = dailyGoalKcal - dayTotals.kcal;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...plan,
        calories: plan.calories === '' ? null : Number(plan.calories),
        meals_per_day: Number(plan.meals_per_day) || null,
        days_per_week: Number(plan.days_per_week) || null,
      };
      const allSlots = Object.entries(slotsByDay).flatMap(([dayOrder, slots]) =>
        slots.map((s, i) => ({ day_order: Number(dayOrder), meal_order: i + 1, meal_type_id: s.meal_type_id, meal_id: s.meal_id }))
      );
      if (isNew) {
        const created = await mealPlanService.create(payload, allSlots);
        navigate(`/meal-plan-creator/${created.id}`);
      } else {
        await mealPlanService.update(id, payload, allSlots);
        navigate('/meal-plans');
      }
    } catch (e) {
      setError(e.message || 'Falha ao salvar plano');
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

  const days = Array.from({ length: Number(plan.days_per_week) || 7 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/meal-plans')} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>←</button>
          <input type="text" value={plan.name_ptbr} onChange={(e) => setPlanField('name_ptbr', e.target.value)} placeholder="Nome do plano alimentar…" style={{ fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => setSettings((s) => !s)} style={{ borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: settings ? 'var(--brand-soft)' : 'var(--surface)', color: settings ? 'var(--brand)' : 'var(--text)', border: `1px solid ${settings ? 'rgba(245,95,22,.4)' : 'var(--border)'}` }}>Configurações</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : (isNew ? 'Criar plano' : 'Salvar')}
          </button>
        </div>
      </header>

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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Meta calórica (kcal/dia)</label>
              <input type="number" value={plan.calories} onChange={(e) => setPlanField('calories', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Refeições por dia</label>
              <input type="number" value={plan.meals_per_day} onChange={(e) => setPlanField('meals_per_day', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Dias por semana</label>
              <input type="number" min="1" max="7" value={plan.days_per_week} onChange={(e) => setPlanField('days_per_week', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Preferência</label>
              <select value={plan.dietary_preference ?? ''} onChange={(e) => setPlanField('dietary_preference', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {(lookups?.dietary_preferences ?? []).map((p) => <option key={p.id} value={p.dietary_preference_id}>{p.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Restrições</label>
              <select multiple value={plan.restriction_tags} onChange={(e) => setPlanField('restriction_tags', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputStyle, height: '76px' }}>
                {(lookups?.dietary_restrictions ?? []).map((r) => <option key={r.id} value={r.dietary_restriction_id}>{r.name_ptbr}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
        {days.map((d) => (
          <button key={d} onClick={() => setDay(d)} style={dayStyle(d === day)}>Dia {d}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap', paddingLeft: '16px' }}>
          Meta: <strong style={{ color: 'var(--text)' }}>{dailyGoalKcal} kcal</strong>
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ width: '290px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Refeições · buscar p/ adicionar</p>
            <input type="text" value={mealSearch} onChange={(e) => setMealSearch(e.target.value)} placeholder="Buscar refeição…" style={inputStyle} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mealResults.map((m) => (
              <div key={m.id} onClick={() => addMealToDay(m)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name_ptbr}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{m.calories} kcal · {m.meal_type}</p>
                </div>
                <span style={{ color: 'var(--brand)' }}>+</span>
              </div>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Dia {day}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{currentSlots.length} refeições planejadas</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 14px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>{dayTotals.kcal} <span style={{ fontSize: '12px', color: 'var(--muted)' }}>/ {dailyGoalKcal}</span></span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: diffKcal >= 0 ? '#16a34a' : '#ef4444' }}>{diffKcal >= 0 ? 'No alvo' : 'Ultrapassou'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentSlots.map((s) => (
                <div key={s.uniqueId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '13px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{s.meal?.name_ptbr}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{s.meal_type_id} · {s.meal?.calories ?? 0} kcal</p>
                  </div>
                  <button onClick={() => removeSlot(s.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {currentSlots.length === 0 && (
                <div style={{ padding: '18px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 700, border: '1px dashed var(--border)', borderRadius: '16px' }}>
                  Busque uma refeição à esquerda para adicionar ao dia {day}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside style={{ width: '270px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '22px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--muted)' }}>Resumo do Dia {day}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '18px' }}>
            <div style={{ padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #3b82f6' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Proteínas</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{dayTotals.P.toFixed(1)} g</p></div>
            <div style={{ padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #f59e0b' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Carboidratos</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{dayTotals.C.toFixed(1)} g</p></div>
            <div style={{ padding: '11px', background: 'var(--field)', borderRadius: '11px', borderLeft: '3px solid #a855f7' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Gorduras</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900 }}>{dayTotals.F.toFixed(1)} g</p></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
            Plano ativo <input type="checkbox" checked={plan.is_active} onChange={(e) => setPlanField('is_active', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
          </label>
        </aside>
      </div>
    </div>
  );
}
