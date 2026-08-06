import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { exerciseService } from '../services/exerciseService.js';

const LEVEL_COLORS = {
  ini: { bg: 'var(--surface-2)', color: 'var(--muted)' },
  inter: { bg: 'rgba(59,130,246,.12)', color: '#3b82f6' },
  av: { bg: 'rgba(245,95,22,.14)', color: '#F55F16' },
};

function levelStyle(levelCode) {
  if (levelCode === 'beginner' || levelCode === 'ini') return LEVEL_COLORS.ini;
  if (levelCode === 'advanced' || levelCode === 'av') return LEVEL_COLORS.av;
  return LEVEL_COLORS.inter;
}

export default function Exercises() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('table');
  const [exercises, setExercises] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ex, lk] = await Promise.all([
          exerciseService.getAll(),
          exerciseService.getLookups(),
        ]);
        if (cancelled) return;
        setExercises(ex ?? []);
        setLookups(lk);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar exercícios');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const nameById = (list, codeField) => {
    const map = new Map();
    (list ?? []).forEach((row) => map.set(row[codeField], row.name_ptbr));
    return map;
  };

  const muscleNames = useMemo(() => nameById(lookups?.muscle_groups, 'muscle_group_id'), [lookups]);
  const equipNames = useMemo(() => nameById(lookups?.exercise_equipments, 'exercise_equipment_id'), [lookups]);
  const levelNames = useMemo(() => nameById(lookups?.exercise_levels, 'exercise_level_id'), [lookups]);
  const healthNames = useMemo(() => nameById(lookups?.health_conditions, 'health_condition_id'), [lookups]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !(ex.name_ptbr ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (muscleFilter && !(ex.muscle_groups_ids ?? []).includes(muscleFilter)) return false;
      if (equipFilter && !(ex.exercise_equipments_ids ?? []).includes(equipFilter)) return false;
      if (levelFilter && ex.exercise_level_id !== levelFilter) return false;
      return true;
    });
  }, [exercises, search, muscleFilter, equipFilter, levelFilter]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const viewBtnStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.12)' : 'none'
  });

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercício…"
            style={{ width: '100%', padding: '10px 16px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/exercise-editor" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            + Novo exercício
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Biblioteca de Exercícios</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>
                Banco curado de exercícios (PT · EN · FR). <strong style={{ color: 'var(--text)' }}>{exercises.length}</strong> exercícios{search || muscleFilter || equipFilter || levelFilter ? `, ${filtered.length} filtrados` : ''}.
              </p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setView('table')} style={viewBtnStyle(view === 'table')}>Tabela</button>
              <button onClick={() => setView('grid')} style={viewBtnStyle(view === 'grid')}>Grade</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="">Qualquer grupo</option>
              {(lookups?.muscle_groups ?? []).map((m) => <option key={m.id} value={m.muscle_group_id}>{m.name_ptbr}</option>)}
            </select>
            <select value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="">Qualquer equipamento</option>
              {(lookups?.exercise_equipments ?? []).map((e) => <option key={e.id} value={e.exercise_equipment_id}>{e.name_ptbr}</option>)}
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="">Qualquer nível</option>
              {(lookups?.exercise_levels ?? []).map((l) => <option key={l.id} value={l.exercise_level_id}>{l.name_ptbr}</option>)}
            </select>
          </div>

          {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

          {!loading && !error && view === 'table' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Exercício</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Grupos musculares</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Equipamento</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nível</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Kcal</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Saúde</th>
                      <th style={{ textAlign: 'right', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ex) => {
                      const groups = (ex.muscle_groups_ids ?? []).map((id) => muscleNames.get(id) ?? id);
                      const equips = (ex.exercise_equipments_ids ?? []).map((id) => equipNames.get(id) ?? id);
                      const healthCount = (ex.avoid_health_conditions_ids?.length ?? 0) + (ex.caution_health_condition_ids?.length ?? 0);
                      const lv = levelStyle(ex.exercise_level_id);
                      return (
                        <tr key={ex.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{ex.name_ptbr}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</p>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>{groups.join(', ') || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>{equips.join(', ') || '—'}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: lv.bg, color: lv.color }}>{levelNames.get(ex.exercise_level_id) ?? ex.exercise_level_id ?? '—'}</span></td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700 }}>{ex.calories ?? '—'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {healthCount === 0 ? <span style={{ color: 'var(--muted)', opacity: 0.4 }}>—</span> : (
                              <span title={[...(ex.avoid_health_conditions_ids ?? []), ...(ex.caution_health_condition_ids ?? [])].map((id) => healthNames.get(id) ?? id).join(', ')} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>{healthCount}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Link to={`/exercise-editor/${ex.id}`} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>Editar</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && <p style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}>Nenhum exercício encontrado.</p>}
            </div>
          )}

          {!loading && !error && view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {filtered.map((ex) => (
                <Link key={ex.id} to={`/exercise-editor/${ex.id}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '15px', textDecoration: 'none', color: 'inherit' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{ex.name_ptbr}</p>
                  <p style={{ margin: '2px 0 10px', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{(ex.muscle_groups_ids ?? []).map((id) => muscleNames.get(id) ?? id).join(', ') || '—'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
