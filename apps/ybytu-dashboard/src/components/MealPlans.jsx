import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mealPlanService } from '../services/mealPlanService.js';
import ChipMultiSelect from './ChipMultiSelect';

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#16a34a,#4ade80)',
  'linear-gradient(135deg,#F55F16,#FF7A3D)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#a855f7,#c084fc)',
  'linear-gradient(135deg,#0E0E0E,#3a3a3a)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];

export default function MealPlans() {
  const [theme, setTheme] = useState('dark');
  const [search, setSearch] = useState('');
  const [aiFilter, setAiFilter] = useState(false);
  const [plans, setPlans] = useState([]);
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
        const [p, lk] = await Promise.all([
          mealPlanService.getAll({ include_inactive: true }),
          mealPlanService.getLookups(),
        ]);
        if (cancelled) return;
        setPlans(p ?? []);
        setLookups(lk);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar planos alimentares');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const goalName = useMemo(() => {
    const map = new Map();
    (lookups?.goals ?? []).forEach((g) => map.set(g.goal_id, g.name_ptbr));
    return map;
  }, [lookups]);

  const filtered = useMemo(() => plans.filter((p) => {
    if (aiFilter && !p.created_by_ai) return false;
    if (search && !(p.name_ptbr ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [plans, search, aiFilter]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar plano alimentar…" style={{ width: '100%', padding: '10px 16px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/meal-plan-creator" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            + Criar plano
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Planos Alimentares</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Cardápios por objetivo e meta calórica. <strong style={{ color: 'var(--text)' }}>{plans.length}</strong> planos.</p>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', marginBottom: '18px' }}>
            Somente gerados por IA
            <input type="checkbox" checked={aiFilter} onChange={(e) => setAiFilter(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
          </label>

          {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
              {filtered.map((p, idx) => {
                const goals = (Array.isArray(p.goals_ids) ? p.goals_ids : []).map((g) => goalName.get(g) ?? g);
                return (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '64px', position: 'relative', background: COVER_GRADIENTS[idx % COVER_GRADIENTS.length], display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '14px' }}>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(0,0,0,.28)', color: '#fff' }}>{goals[0] ?? 'Sem objetivo'}</span>
                      {p.created_by_ai && <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(255,255,255,.92)', color: '#7c3aed' }}>IA</span>}
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>{p.name_ptbr}</h3>
                        <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: p.is_active ? 'rgba(22,163,74,.12)' : 'var(--surface-2)', color: p.is_active ? '#16a34a' : 'var(--muted)', textTransform: 'uppercase' }}>{p.is_active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <p style={{ margin: '10px 0', fontSize: '22px', fontWeight: 900 }}>{p.calories ?? '—'} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>kcal/dia</span></p>
                      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                        <span>{p.meals_per_day ?? '—'} refeições/dia</span>
                        <span>{p.days_per_week ?? '—'} dias/sem</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', flex: 1, alignContent: 'flex-start' }}>
                        {goals.map((g, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{g}</span>)}
                      </div>
                      <Link to={`/meal-plan-creator/${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '10px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, textDecoration: 'none', borderTop: '1px solid var(--border)', marginTop: 'auto', paddingTop: '14px' }}>
                        Editar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>Nenhum plano encontrado.</p>}
        </div>
      </main>
    </>
  );
}
