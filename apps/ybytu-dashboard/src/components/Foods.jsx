import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import { foodService } from '../services/foodService.js';

export default function Foods() {
  const [view, setView] = useState('list');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [lookups, setLookups] = useState(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedFoods, lookupsData] = await Promise.all([
        foodService.getAll(),
        foodService.getLookups()
      ]);
      setFoods(fetchedFoods);
      setLookups(lookupsData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Falha ao carregar alimentos.');
    } finally {
      setLoading(false);
    }
  };

  const getDonut = (p, c, f, kcal) => {
    const total = p + c + f || 1;
    const pp = (p / total) * 100;
    const cp = (c / total) * 100;
    const fp = (f / total) * 100;
    return (
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `conic-gradient(#3b82f6 0% ${pp}%, #f59e0b ${pp}% ${pp + cp}%, #a855f7 ${pp + cp}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--field)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: 'var(--text)' }}>
          {kcal}
        </div>
      </div>
    );
  };

  // Helper function to find a name from lookups
  const lookupName = (type, id) => {
    if (!lookups || !lookups[type]) return '';
    const item = lookups[type].find(i => i.id === id || i[`${type.slice(0,-1)}_id`] === id);
    return item ? item.name_ptbr : '';
  };

  const getTags = (f) => {
    let tags = [];
    if (f.food_group_id) tags.push(lookupName('food_groups', f.food_group_id));
    if (f.food_type_id) tags.push(lookupName('food_types', f.food_type_id));
    if (f.food_preparation_method_id) tags.push(lookupName('food_preparation_methods', f.food_preparation_method_id));
    return tags.filter(Boolean);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <MobileNav />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>
                <span>Catálogo Nutricional</span><span>/</span><span style={{ color: 'var(--text)' }}>Alimentos</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Alimentos</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Base curada. <strong style={{ color: 'var(--text)' }}>{foods.length}</strong> alimentos registrados.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: '8px', border: 'none', background: view === 'list' ? 'var(--field)' : 'transparent', color: view === 'list' ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', transition: 'all .2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>
                </button>
                <button onClick={() => setView('grid')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: '8px', border: 'none', background: view === 'grid' ? 'var(--field)' : 'transparent', color: view === 'grid' ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', transition: 'all .2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>
                </button>
              </div>
              <button onClick={() => navigate('/food-editor/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo alimento
              </button>
            </div>
          </header>

          {/* FILTERS */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '22px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              <input type="text" placeholder="Buscar por nome, marca ou ID..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
            </div>
            <select style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}>
              <option value="">Todos os Grupos</option>
              {lookups?.food_groups?.map(g => (
                <option key={g.id} value={g.id}>{g.name_ptbr}</option>
              ))}
            </select>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>
              Carregando alimentos...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444', fontSize: '14px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
              {error}
            </div>
          )}

          {!loading && !error && foods.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: '18px', border: '1px dashed var(--border)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>Nenhum alimento encontrado</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>Crie seu primeiro alimento clicando no botão acima.</p>
            </div>
          )}

          {!loading && !error && foods.length > 0 && view === 'list' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Alimento</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Grupo</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Porção</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Macros (P/C/G)</th>
                      <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Kcal</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Tags</th>
                      <th style={{ textAlign: 'right', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map((f) => {
                      const tags = getTags(f);
                      return (
                      <tr key={f.id} className="yb-hover-row" style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                {f.food_id ? f.food_id.substring(0,2).toUpperCase() : 'FO'}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>{f.name_ptbr}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{f.brand || f.food_id}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--surface-2)', color: 'var(--text)' }}>
                            {lookupName('food_groups', f.food_group_id) || 'Sem Grupo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                            {f.quantity} {lookupName('food_measurement_units', f.food_measurement_unit_id) || 'un'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 800 }}>
                            <span style={{ color: '#3b82f6' }}>{f.protein_g}g</span><span style={{ color: 'var(--border)' }}>|</span>
                            <span style={{ color: '#f59e0b' }}>{f.carbs_g}g</span><span style={{ color: 'var(--border)' }}>|</span>
                            <span style={{ color: '#a855f7' }}>{f.fat_g}g</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 900 }}>{f.calories_per_unit}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {tags.slice(0, 2).map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)' }}>{t}</span>)}
                            {tags.length > 2 && <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>+{tags.length - 2}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => navigate(`/food-editor/${f.id}`)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !error && foods.length > 0 && view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {foods.map((f) => {
                const tags = getTags(f);
                return (
                <div key={f.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>
                        {f.food_id ? f.food_id.substring(0,2).toUpperCase() : 'FO'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name_ptbr}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        {f.quantity} {lookupName('food_measurement_units', f.food_measurement_unit_id) || 'un'} · {f.calories_per_unit} kcal
                      </p>
                      <span style={{ display: 'inline-flex', marginTop: '6px', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--surface-2)', color: 'var(--text)' }}>
                        {lookupName('food_groups', f.food_group_id) || 'Sem Grupo'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--field)', borderRadius: '12px' }}>
                    {getDonut(Number(f.protein_g), Number(f.carbs_g), Number(f.fat_g), Number(f.calories_per_unit))}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#3b82f6' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Proteína</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.protein_g}g</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#f59e0b' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Carbo</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.carbs_g}g</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}><span style={{ width: '9px', height: '9px', borderRadius: '3px', background: '#a855f7' }}></span><span style={{ fontWeight: 700, color: 'var(--text)' }}>Gordura</span><span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--text)' }}>{f.fat_g}g</span></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                    {tags.map((t, i) => <span key={i} style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{t}</span>)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button onClick={() => navigate(`/food-editor/${f.id}`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
