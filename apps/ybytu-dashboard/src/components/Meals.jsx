import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mealService } from '../services/mealService.js';
import ChipMultiSelect from './ChipMultiSelect';

const MEAL_TYPE_ICON = {
  breakfast: '🥞', lunch: '🥗', dinner: '🍽️', snack: '🥛',
};

export default function Meals() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [meals, setMeals] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [m, lk] = await Promise.all([
          mealService.getAll({ include_inactive: true }),
          mealService.getLookups(),
        ]);
        if (cancelled) return;
        setMeals(m ?? []);
        setLookups(lk);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar refeições');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const mealTypeName = useMemo(() => {
    const map = new Map();
    (lookups?.meal_types ?? []).forEach((t) => map.set(t.meal_type_id, t.name_ptbr));
    return map;
  }, [lookups]);

  const filtered = useMemo(() => meals.filter((m) => {
    if (tab !== 'all' && m.meal_type !== tab) return false;
    if (search && !(m.name_ptbr ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [meals, tab, search]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  const getDonut = (prot, carb, fat, size = 56) => {
    const pc = (prot || 0) * 4, cc = (carb || 0) * 4, fc = (fat || 0) * 9, tot = pc + cc + fc || 1;
    const dProt = +(pc / tot * 100).toFixed(1);
    const dCarb = +(cc / tot * 100).toFixed(1);
    const bg = `conic-gradient(#3b82f6 0% ${dProt}%, #f59e0b ${dProt}% ${dProt + dCarb}%, #a855f7 ${dProt + dCarb}% 100%)`;
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundImage: bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: `${Math.round(size * 0.56)}px`, height: `${Math.round(size * 0.56)}px`, borderRadius: '50%', background: 'var(--field)' }}></div>
      </div>
    );
  };

  async function handleToggleActive(meal) {
    try {
      await mealService.setActive(meal.id, !meal.is_active);
      setMeals((prev) => prev.map((m) => m.id === meal.id ? { ...m, is_active: !meal.is_active } : m));
    } catch (e) {
      alert(e.message || 'Falha ao atualizar status da refeição');
    }
  }

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar refeição, receita…" style={{ width: '100%', padding: '10px 16px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/meal-editor" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            + Nova refeição
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Refeições & Receitas</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>
              Receitas multilíngues com ingredientes, modo de preparo e macros. <strong style={{ color: 'var(--text)' }}>{meals.length}</strong> refeições.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => setTab('all')} style={tabStyle(tab === 'all')}>Todas</button>
            <button onClick={() => setTab('breakfast')} style={tabStyle(tab === 'breakfast')}>Café da manhã</button>
            <button onClick={() => setTab('lunch')} style={tabStyle(tab === 'lunch')}>Almoço</button>
            <button onClick={() => setTab('dinner')} style={tabStyle(tab === 'dinner')}>Jantar</button>
            <button onClick={() => setTab('snack')} style={tabStyle(tab === 'snack')}>Lanche</button>
          </div>

          {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
              {filtered.map((m) => (
                <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100%', height: '110px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '28px', borderBottom: '1px solid var(--border)' }}>
                      {MEAL_TYPE_ICON[m.meal_type] ?? '🍽️'}
                    </div>
                    <span style={{ position: 'absolute', top: '10px', left: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,0,0,.45)', color: '#fff', textTransform: 'uppercase' }}>
                      {mealTypeName.get(m.meal_type) ?? m.meal_type}
                    </span>
                    {!m.is_active && (
                      <span style={{ position: 'absolute', top: '10px', right: '10px', display: 'inline-flex', padding: '4px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, background: 'rgba(0,0,0,.55)', color: '#fbbf24', textTransform: 'uppercase' }}>Inativa</span>
                    )}
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>{m.name_ptbr}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '7px 0 14px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                      <span>{m.prep_time_min ?? '—'} min</span>
                      <span>{(m.ingredients_json ?? []).length} ingredientes</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--field)', borderRadius: '12px', marginBottom: '14px' }}>
                      {getDonut(m.protein_g, m.carbs_g, m.fat_g)}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Calorias</span><span style={{ fontSize: '15px', fontWeight: 900 }}>{m.calories ?? '—'} kcal</span></div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: 700 }}>
                          <span>P {m.protein_g ?? 0}g</span><span>C {m.carbs_g ?? 0}g</span><span>G {m.fat_g ?? 0}g</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', flex: 1, alignContent: 'flex-start' }}>
                      {(m.diet_tags ?? []).map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t}</span>)}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                      <Link to={`/meal-editor/${m.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
                        Editar receita
                      </Link>
                      <button onClick={() => handleToggleActive(m)} style={{ padding: '9px 12px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>
                        {m.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>Nenhuma refeição encontrada.</p>}
        </div>
      </main>
    </>
  );
}
