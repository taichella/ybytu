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
  const [listFilter, setListFilter] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

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
    const s = search.trim().toLowerCase();
    const lf = listFilter.trim().toLowerCase();
    return exercises.filter((ex) => {
      // Busca do topo: nome OU grupo muscular (o que o placeholder do design
      // promete -- "Buscar exercício, grupo muscular…").
      if (s) {
        const inName = (ex.name_ptbr ?? '').toLowerCase().includes(s);
        const inMuscle = (ex.muscle_groups_ids ?? []).some((id) => (muscleNames.get(id) ?? id).toLowerCase().includes(s));
        if (!inName && !inMuscle) return false;
      }
      // "Filtrar nesta lista…" -- estreita o resultado já filtrado, inclui o
      // código de referência (exercise_id) porque é o que aparece no card.
      if (lf) {
        const inName = (ex.name_ptbr ?? '').toLowerCase().includes(lf);
        const inRef = (ex.exercise_id ?? '').toLowerCase().includes(lf);
        if (!inName && !inRef) return false;
      }
      if (muscleFilter && !(ex.muscle_groups_ids ?? []).includes(muscleFilter)) return false;
      if (equipFilter && !(ex.exercise_equipments_ids ?? []).includes(equipFilter)) return false;
      if (levelFilter && ex.exercise_level_id !== levelFilter) return false;
      if (healthFilter) {
        // mesma regra do badge: 'none' é sentinela, não conta como restrição
        const healthCount = [...(ex.avoid_health_conditions_ids ?? []), ...(ex.caution_health_condition_ids ?? [])]
          .filter((id) => id && id !== 'none').length;
        if (healthFilter === 'with' && healthCount === 0) return false;
        if (healthFilter === 'without' && healthCount > 0) return false;
      }
      return true;
    });
  }, [exercises, search, listFilter, muscleFilter, equipFilter, levelFilter, healthFilter, muscleNames]);

  useEffect(() => { setPage(1); }, [search, listFilter, muscleFilter, equipFilter, levelFilter, healthFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const paged = useMemo(() => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE), [filtered, pageSafe]);
  const pageStart = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const allPageSelected = paged.length > 0 && paged.every((ex) => selected.has(ex.id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paged.forEach((ex) => next.delete(ex.id));
      else paged.forEach((ex) => next.add(ex.id));
      return next;
    });
  };
  const toggleSelectOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const langPillStyle = (on) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '18px', borderRadius: '5px', fontSize: '9px', fontWeight: 800, letterSpacing: '.02em',
    background: on ? 'var(--brand)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--muted)',
    opacity: on ? 1 : 0.55, border: on ? 'none' : '1px solid var(--border)',
  });

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const viewBtnStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '7px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.12)' : 'none'
  });

  const filterSelectStyle = { padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' };

  // Derivados que a tabela e o card da grade compartilham (Exercicios.dc.html
  // mostra os mesmos dados nas duas visões, só com layout diferente).
  const cardData = (ex) => {
    const groups = (ex.muscle_groups_ids ?? []).map((id) => muscleNames.get(id) ?? id);
    const equips = (ex.exercise_equipments_ids ?? []).map((id) => equipNames.get(id) ?? id);
    // 'none' é sentinela de "nenhuma condição", não uma condição -- 85 linhas
    // têm 'none' em avoid e 75 em caution (medido 2026-09-05). Contar sem
    // filtrar fazia a tabela mostrar "2 restrições" pra exercício sem
    // restrição nenhuma, e faria o filtro "Sem restrições" escondê-lo.
    const realIds = (arr) => (arr ?? []).filter((id) => id && id !== 'none');
    const avoidIds = realIds(ex.avoid_health_conditions_ids);
    const cautionIds = realIds(ex.caution_health_condition_ids);
    const healthCount = avoidIds.length + cautionIds.length;
    return {
      groups,
      groupsShown: groups.slice(0, 2),
      moreGroups: groups.length > 2 ? `+${groups.length - 2}` : null,
      // design: primeiro equipamento + "+N" pros demais
      equipLabel: equips.length === 0 ? '—' : equips[0] + (equips.length > 1 ? ` +${equips.length - 1}` : ''),
      healthCount,
      // vermelho quando há 'avoid' (contraindicado), âmbar quando só 'caution'
      healthBg: avoidIds.length > 0 ? 'rgba(239,68,68,.12)' : 'rgba(217,119,6,.14)',
      healthColor: avoidIds.length > 0 ? '#ef4444' : '#d97706',
      healthTitle: [...avoidIds, ...cautionIds].map((id) => healthNames.get(id) ?? id).join(', '),
      level: levelNames.get(ex.exercise_level_id) ?? ex.exercise_level_id ?? '—',
      levelStyle: levelStyle(ex.exercise_level_id),
    };
  };

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
                Banco curado de exercícios (PT · EN · FR). <strong style={{ color: 'var(--text)' }}>{exercises.length}</strong> exercícios{search || listFilter || muscleFilter || equipFilter || levelFilter || healthFilter ? `, ${filtered.length} filtrados` : ''}.
                {selected.size > 0 && <span style={{ color: 'var(--brand)', fontWeight: 700 }}> · {selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>}
              </p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setView('table')} style={viewBtnStyle(view === 'table')}>Tabela</button>
              <button onClick={() => setView('grid')} style={viewBtnStyle(view === 'grid')}>Grade</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '280px' }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </span>
              <input
                type="text"
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                placeholder="Filtrar nesta lista…"
                style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} style={{ ...filterSelectStyle, color: muscleFilter ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">Qualquer grupo muscular</option>
              {(lookups?.muscle_groups ?? []).map((m) => <option key={m.id} value={m.muscle_group_id}>{m.name_ptbr}</option>)}
            </select>
            <select value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)} style={{ ...filterSelectStyle, color: equipFilter ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">Qualquer equipamento</option>
              {(lookups?.exercise_equipments ?? []).map((e) => <option key={e.id} value={e.exercise_equipment_id}>{e.name_ptbr}</option>)}
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ ...filterSelectStyle, color: levelFilter ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">Qualquer nível</option>
              {(lookups?.exercise_levels ?? []).map((l) => <option key={l.id} value={l.exercise_level_id}>{l.name_ptbr}</option>)}
            </select>
            <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)} style={{ ...filterSelectStyle, color: healthFilter ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">Restrições de saúde</option>
              <option value="with">Com restrições</option>
              <option value="without">Sem restrições</option>
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
                      <th style={{ width: '44px', textAlign: 'center', padding: '13px 16px' }}>
                        <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} style={{ width: '15px', height: '15px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                      </th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Exercício</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Grupos musculares</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Equipamento</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nível</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Kcal</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Saúde</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Idiomas</th>
                      <th style={{ textAlign: 'right', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((ex) => {
                      const d = cardData(ex);
                      const groups = d.groups;
                      const equips = (ex.exercise_equipments_ids ?? []).map((id) => equipNames.get(id) ?? id);
                      const healthCount = d.healthCount;
                      const lv = d.levelStyle;
                      return (
                        <tr key={ex.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                            <input type="checkbox" checked={selected.has(ex.id)} onChange={() => toggleSelectOne(ex.id)} style={{ width: '15px', height: '15px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                              <div style={{ position: 'relative', width: '60px', height: '42px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                                {ex.image_url ? (
                                  <img src={ex.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                                )}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{ex.name_ptbr}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>{groups.join(', ') || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>{equips.join(', ') || '—'}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: lv.bg, color: lv.color }}>{levelNames.get(ex.exercise_level_id) ?? ex.exercise_level_id ?? '—'}</span></td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700 }}>{ex.calories ?? '—'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {healthCount === 0 ? <span style={{ color: 'var(--muted)', opacity: 0.4 }}>—</span> : (
                              <span title={d.healthTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: d.healthBg, color: d.healthColor }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> {healthCount}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <span style={langPillStyle(!!ex.name_ptbr)}>PT</span>
                              <span style={langPillStyle(!!ex.name_en)}>EN</span>
                              <span style={langPillStyle(!!ex.name_fr)}>FR</span>
                            </div>
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
              {filtered.length > 0 && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', background: 'var(--bg)', flexWrap: 'wrap', gap: '10px' }}>
                  <span>Mostrando <strong style={{ color: 'var(--text)' }}>{pageStart}–{pageEnd}</strong> de {filtered.length} exercícios</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === 1 ? 'not-allowed' : 'pointer', opacity: pageSafe === 1 ? 0.5 : 1, fontFamily: 'inherit' }}>Anterior</button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, pageSafe - 3), pageSafe + 2).map((p) => (
                      <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', border: p === pageSafe ? 'none' : '1px solid var(--border)', borderRadius: '8px', background: p === pageSafe ? 'var(--brand)' : 'var(--surface)', color: p === pageSafe ? '#fff' : 'var(--text)', fontWeight: p === pageSafe ? 800 : 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe === pageCount} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === pageCount ? 'not-allowed' : 'pointer', opacity: pageSafe === pageCount ? 0.5 : 1, fontFamily: 'inherit' }}>Próximo</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && view === 'grid' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {paged.map((ex) => {
                  const d = cardData(ex);
                  return (
                    <div key={ex.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {/* Slot de mídia (150px) -- image_url está vazio em 298/298
                          hoje, então na prática cai sempre no placeholder do
                          design até a migração dos vídeos pro R2 acontecer
                          (ver docs/MIGRACAO_VIDEOS_CLOUDFLARE_20260904.md). */}
                      <div style={{ position: 'relative' }}>
                        {ex.image_url ? (
                          <img src={ex.image_url} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', background: 'var(--field)', borderBottom: '1px dashed var(--border)', color: 'var(--muted)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>
                            <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Arraste vídeo / foto</span>
                          </div>
                        )}
                        {d.healthCount > 0 && (
                          <span title={d.healthTitle} style={{ position: 'absolute', top: '10px', left: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: d.healthBg, color: d.healthColor, backdropFilter: 'blur(4px)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> {d.healthCount}
                          </span>
                        )}
                        {ex.calories != null && (
                          <span style={{ position: 'absolute', top: '10px', right: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 8.5 22 9.3l-5 4.6L18.5 21 12 17.3 5.5 21 7 13.9l-5-4.6 7-.8z"></path></svg> {ex.calories} kcal
                          </span>
                        )}
                      </div>

                      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{ex.name_ptbr}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</p>
                          </div>
                          <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0, background: d.levelStyle.bg, color: d.levelStyle.color }}>{d.level}</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                          {d.groupsShown.map((g, i) => (
                            <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>{g}</span>
                          ))}
                          {d.moreGroups && (
                            <span title={d.groups.join(', ')} style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)' }}>{d.moreGroups}</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, minWidth: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.equipLabel}</span>
                          </span>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <span style={langPillStyle(!!ex.name_ptbr)}>PT</span>
                            <span style={langPillStyle(!!ex.name_en)}>EN</span>
                            <span style={langPillStyle(!!ex.name_fr)}>FR</span>
                          </div>
                        </div>

                        <Link to={`/exercise-editor/${ex.id}`} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', border: '1px solid var(--border)' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 && <p style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}>Nenhum exercício encontrado.</p>}

              {/* Paginação: o mockup só desenha o rodapé na visão de tabela, mas
                  a grade real tem 298 itens (o mockup tem 6) -- sem isso a
                  grade renderiza o catálogo inteiro de uma vez. Mesmo controle
                  e mesmo PAGE_SIZE da tabela, por consistência. */}
              {filtered.length > 0 && (
                <div style={{ marginTop: '18px', padding: '16px 20px', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', background: 'var(--surface)', flexWrap: 'wrap', gap: '10px' }}>
                  <span>Mostrando <strong style={{ color: 'var(--text)' }}>{pageStart}–{pageEnd}</strong> de {filtered.length} exercícios</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === 1 ? 'not-allowed' : 'pointer', opacity: pageSafe === 1 ? 0.5 : 1, fontFamily: 'inherit' }}>Anterior</button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, pageSafe - 3), pageSafe + 2).map((p) => (
                      <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', border: p === pageSafe ? 'none' : '1px solid var(--border)', borderRadius: '8px', background: p === pageSafe ? 'var(--brand)' : 'var(--surface)', color: p === pageSafe ? '#fff' : 'var(--text)', fontWeight: p === pageSafe ? 800 : 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe === pageCount} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === pageCount ? 'not-allowed' : 'pointer', opacity: pageSafe === pageCount ? 0.5 : 1, fontFamily: 'inherit' }}>Próximo</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
