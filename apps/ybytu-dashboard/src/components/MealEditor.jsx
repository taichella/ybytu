import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mealService } from '../services/mealService.js';

const EMPTY = {
  meal_id: '', name_ptbr: '', name_en: '', name_fr: '',
  meal_type: 'lunch', prep_time_min: '', calories: '', protein_g: '', carbs_g: '', fat_g: '',
  ingredients_json: [], instruction_ptbr: '', instruction_en: '', instruction_fr: '',
  diet_tags: [], restriction_tags: [], is_active: true,
};

export default function MealEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('pt');
  const [form, setForm] = useState(EMPTY);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const nextItemId = useRef(0);
  const searchDebounce = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const lk = await mealService.getLookups();
        if (cancelled) return;
        setLookups(lk);
        if (!isNew) {
          const m = await mealService.getById(id);
          if (cancelled) return;
          const savedIngredients = m.ingredients_json ?? [];
          const foodDetails = await mealService.getFoodsByIds(savedIngredients.map((ing) => ing.id));
          const byId = Object.fromEntries((foodDetails ?? []).map((f) => [f.food_id, f]));
          setForm({
            ...EMPTY, ...m,
            ingredients_json: savedIngredients.map((ing) => {
              const food = byId[ing.id];
              return {
                ...ing, uniqueId: `it${nextItemId.current++}`,
                _name: food?.name_ptbr ?? ing.id,
                _caloriesPerUnit: food?.calories_per_unit ?? 0, _proteinG: food?.protein_g ?? 0,
                _carbsG: food?.carbs_g ?? 0, _fatG: food?.fat_g ?? 0, _baseQty: food?.quantity ?? 100,
              };
            }),
            diet_tags: m.diet_tags ?? [], restriction_tags: m.restriction_tags ?? [],
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar refeição');
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
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await mealService.searchFoods(foodSearch.trim());
        if (!cancelled) setFoodResults(results ?? []);
      } catch { /* silencioso, é só autocomplete */ }
    }, foodSearch.trim() ? 300 : 0);
    return () => { cancelled = true; clearTimeout(searchDebounce.current); };
  }, [foodSearch]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const ingredientMacros = (it) => {
    const k = (Number(it.qtd) || 0) / (Number(it._baseQty) || 100);
    return {
      kcal: (Number(it._caloriesPerUnit) || 0) * k,
      protein: (Number(it._proteinG) || 0) * k,
      carbs: (Number(it._carbsG) || 0) * k,
      fat: (Number(it._fatG) || 0) * k,
    };
  };

  const totals = useMemo(() => {
    const sum = form.ingredients_json.reduce((acc, it) => {
      const m = ingredientMacros(it);
      acc.kcal += m.kcal; acc.protein += m.protein; acc.carbs += m.carbs; acc.fat += m.fat;
      return acc;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    const pc = sum.protein * 4, cc = sum.carbs * 4, fc = sum.fat * 9;
    const tot = pc + cc + fc;
    const pctProt = tot ? +(pc / tot * 100).toFixed(0) : 0;
    const pctCarb = tot ? +(cc / tot * 100).toFixed(0) : 0;
    const pctFat = tot ? Math.max(0, 100 - pctProt - pctCarb) : 0;
    return {
      kcal: Math.round(sum.kcal), protein: +sum.protein.toFixed(1), carbs: +sum.carbs.toFixed(1), fat: +sum.fat.toFixed(1),
      pctProt, pctCarb, pctFat,
      gradient: tot ? `conic-gradient(#3b82f6 0 ${pctProt}%, #f59e0b ${pctProt}% ${pctProt + pctCarb}%, #a855f7 ${pctProt + pctCarb}% 100%)` : 'conic-gradient(var(--border) 0 100%)',
    };
  }, [form.ingredients_json]);

  const addIngredient = (food) => {
    set('ingredients_json', [...form.ingredients_json, {
      id: food.food_id, qtd: food.quantity ?? 100, unit: 'g',
      _name: food.name_ptbr, uniqueId: `it${nextItemId.current++}`,
      _caloriesPerUnit: food.calories_per_unit ?? 0, _proteinG: food.protein_g ?? 0,
      _carbsG: food.carbs_g ?? 0, _fatG: food.fat_g ?? 0, _baseQty: food.quantity ?? 100,
    }]);
    setFoodSearch('');
    setFoodResults([]);
  };

  const removeIngredient = (uniqueId) => {
    set('ingredients_json', form.ingredients_json.filter((it) => it.uniqueId !== uniqueId));
  };

  const updateIngredient = (uniqueId, field, value) => {
    set('ingredients_json', form.ingredients_json.map((it) => it.uniqueId === uniqueId ? { ...it, [field]: value } : it));
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        prep_time_min: form.prep_time_min === '' ? null : Number(form.prep_time_min),
        calories: totals.kcal,
        protein_g: totals.protein,
        carbs_g: totals.carbs,
        fat_g: totals.fat,
        ingredients_json: form.ingredients_json.map(({ id: foodId, qtd, unit }) => ({ id: foodId, qtd: Number(qtd) || 0, unit })),
      };
      if (isNew) {
        const created = await mealService.create(payload);
        navigate(`/meal-editor/${created.id}`);
      } else {
        await mealService.update(id, payload);
        navigate('/meals');
      }
    } catch (e) {
      setError(e.message || 'Falha ao salvar refeição');
    } finally {
      setSaving(false);
    }
  }

  const langBtnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 12px', borderRadius: '7px',
    background: isActive ? 'var(--brand)' : 'transparent', color: isActive ? '#fff' : 'var(--muted)'
  });
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' };

  if (loading) return <div style={{ padding: '28px', color: 'var(--muted)' }}>Carregando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/meals')} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>←</button>
          <input type="text" value={form.name_ptbr} onChange={(e) => set('name_ptbr', e.target.value)} placeholder="Nome da Refeição…" style={{ fontSize: '18px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => navigate('/meals')} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : (isNew ? 'Criar Receita' : 'Salvar')}
          </button>
        </div>
      </header>

      {error && <p style={{ color: '#ef4444', padding: '10px 28px 0' }}>{error}</p>}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Alimentos · buscar p/ adicionar</p>
            <input type="text" value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} placeholder="Buscar alimento…" style={inputStyle} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {foodResults.map((food) => (
              <div key={food.food_id} onClick={() => addIngredient(food)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--field)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name_ptbr}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{food.calories_per_unit} kcal/unid</p>
                </div>
                <span style={{ color: 'var(--brand)' }}>+</span>
              </div>
            ))}
            {foodSearch.trim().length >= 2 && foodResults.length === 0 && <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '10px' }}>Nenhum alimento encontrado.</p>}
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Ingredientes <span style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '15px' }}>· {form.ingredients_json.length} itens</span></h2>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Ajuste as quantidades — macros recalculam ao vivo</span>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px' }}>
              {form.ingredients_json.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px 34px', gap: '10px', padding: '10px 16px', background: 'var(--field)', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <span>Alimento</span><span style={{ textAlign: 'center' }}>Quantidade</span><span>Unidade</span><span style={{ textAlign: 'right' }}>Kcal</span><span></span>
                </div>
              )}
              {form.ingredients_json.map((it) => {
                const m = ingredientMacros(it);
                return (
                <div key={it.uniqueId} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px 34px', gap: '10px', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it._name ?? it.id}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>P {m.protein.toFixed(1)} · C {m.carbs.toFixed(1)} · G {m.fat.toFixed(1)}</p>
                  </div>
                  <input type="number" value={it.qtd} onChange={(e) => updateIngredient(it.uniqueId, 'qtd', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                  <input type="text" value={it.unit} onChange={(e) => updateIngredient(it.uniqueId, 'unit', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                  <span style={{ textAlign: 'right', fontSize: '14px', fontWeight: 800 }}>{Math.round(m.kcal)}</span>
                  <button onClick={() => removeIngredient(it.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              )})}
              {form.ingredients_json.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', fontWeight: 600 }}>Busque um alimento no painel à esquerda para adicionar.</div>
              )}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Modo de Preparo</h3>
                <div style={{ display: 'flex', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '9px', padding: '3px' }}>
                  <button onClick={() => setLang('pt')} style={langBtnStyle(lang === 'pt')}>🇧🇷 PT</button>
                  <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>🇬🇧 EN</button>
                  <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>🇫🇷 FR</button>
                </div>
              </div>
              <textarea rows="6" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontSize: '14px', padding: '14px' }}
                value={form[`instruction_${lang === 'pt' ? 'ptbr' : lang}`] ?? ''}
                onChange={(e) => set(`instruction_${lang === 'pt' ? 'ptbr' : lang}`, e.target.value)} />
            </div>
          </div>
        </main>

        <aside style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '22px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)' }}>Resumo da Refeição</p>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--muted)' }}>Calculado a partir dos ingredientes.</p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundImage: totals.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{totals.kcal}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>kcal</span>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Total de calorias</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Proteínas</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{totals.protein} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6' }}>{totals.pctProt}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Carboidratos</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{totals.carbs} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>{totals.pctCarb}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--field)', borderRadius: '12px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Gorduras</p><p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>{totals.fat} g</p></div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#a855f7' }}>{totals.pctFat}%</span>
            </div>
          </div>

          <div style={{ paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Configuração</p>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Tipo de refeição</label>
            <select value={form.meal_type} onChange={(e) => set('meal_type', e.target.value)} style={{ ...inputStyle, marginBottom: '12px', cursor: 'pointer' }}>
              {(lookups?.meal_types ?? []).map((t) => <option key={t.id} value={t.meal_type_id}>{t.name_ptbr}</option>)}
            </select>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>Tempo de preparo (min)</label>
            <input type="number" value={form.prep_time_min} onChange={(e) => set('prep_time_min', e.target.value)} style={{ ...inputStyle, marginBottom: '14px' }} />
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Refeição ativa <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
