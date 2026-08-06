import { useState, useEffect, useRef } from 'react';
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
          setForm({
            ...EMPTY, ...m,
            ingredients_json: (m.ingredients_json ?? []).map((ing) => ({ ...ing, uniqueId: `it${nextItemId.current++}` })),
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
    clearTimeout(searchDebounce.current);
    if (foodSearch.trim().length < 2) { setFoodResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await mealService.searchFoods(foodSearch.trim());
        setFoodResults(results ?? []);
      } catch { /* silencioso, é só autocomplete */ }
    }, 300);
    return () => clearTimeout(searchDebounce.current);
  }, [foodSearch]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addIngredient = (food) => {
    set('ingredients_json', [...form.ingredients_json, {
      id: food.food_id, qtd: 100, unit: 'g',
      _name: food.name_ptbr, uniqueId: `it${nextItemId.current++}`,
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
        calories: form.calories === '' ? null : Number(form.calories),
        protein_g: form.protein_g === '' ? null : Number(form.protein_g),
        carbs_g: form.carbs_g === '' ? null : Number(form.carbs_g),
        fat_g: form.fat_g === '' ? null : Number(form.fat_g),
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
            <input type="text" value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} placeholder="Buscar alimento… (min. 2 letras)" style={inputStyle} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Ingredientes <span style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '15px' }}>· {form.ingredients_json.length} itens</span></h2>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px' }}>
              {form.ingredients_json.map((it) => (
                <div key={it.uniqueId} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 34px', gap: '10px', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it._name ?? it.id}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{it.id}</p>
                  </div>
                  <input type="number" value={it.qtd} onChange={(e) => updateIngredient(it.uniqueId, 'qtd', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                  <input type="text" value={it.unit} onChange={(e) => updateIngredient(it.uniqueId, 'unit', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                  <button onClick={() => removeIngredient(it.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
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
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Macros da refeição</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Calorias (kcal)</label><input type="number" value={form.calories} onChange={(e) => set('calories', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Proteína (g)</label><input type="number" value={form.protein_g} onChange={(e) => set('protein_g', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Carboidrato (g)</label><input type="number" value={form.carbs_g} onChange={(e) => set('carbs_g', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Gordura (g)</label><input type="number" value={form.fat_g} onChange={(e) => set('fat_g', e.target.value)} style={inputStyle} /></div>
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
