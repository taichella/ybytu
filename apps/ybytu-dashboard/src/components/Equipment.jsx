import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Equipment() {
  const [theme, setTheme] = useState('dark');
  
  // Lógica de Estado para os Equipamentos
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', pt: '', en: '', fr: '', count: 0 });

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;
    import('../services/equipmentService.js').then(({ equipmentService }) => {
      equipmentService.getAll()
        .then(data => {
          if (!active) return;
          const formatted = data.map(eq => ({
             id: eq.exercise_equipment_id || eq.id, // Fallback to id if needed
             pt: eq.name_ptbr || '',
             en: eq.name_en || '',
             fr: eq.name_fr || '',
             count: eq.count || 0,
             originalData: eq
          }));
          setEquipments(formatted);
          setError(null);
        })
        .catch(err => {
          if (!active) return;
          console.error("Error fetching equipments:", err);
          setError(err.message || 'Falha ao carregar equipamentos');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => { active = false; };
  }, []);

  const reloadData = () => {
    setLoading(true);
    import('../services/equipmentService.js').then(({ equipmentService }) => {
      equipmentService.getAll()
        .then(data => {
          const formatted = data.map(eq => ({
             id: eq.exercise_equipment_id || eq.id,
             pt: eq.name_ptbr || '',
             en: eq.name_en || '',
             fr: eq.name_fr || '',
             count: eq.count || 0,
             originalData: eq
          }));
          setEquipments(formatted);
          setError(null);
        })
        .catch(err => {
          console.error("Error reloading equipments:", err);
          setError(err.message || 'Falha ao carregar equipamentos');
        })
        .finally(() => setLoading(false));
    });
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Ações do Formulário
  const handleOpenNew = () => {
    setFormData({ id: '', pt: '', en: '', fr: '', count: 0 });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (eq) => {
    setFormData(eq);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Deseja realmente excluir este item? Essa ação não pode ser desfeita.')) return;
    const target = equipments.find(e => e.id === id);
    if (!target || !target.originalData) return;

    import('../services/equipmentService.js').then(({ equipmentService }) => {
      equipmentService.delete(target.originalData.id)
        .then(() => reloadData())
        .catch(err => alert("Erro ao excluir: " + err.message));
    });
  };

  const handleSave = () => {
    if (!formData.id || !formData.pt) return; // Validação simples
    
    const payload = {
        exercise_equipment_id: formData.id,
        name_ptbr: formData.pt,
        name_en: formData.en,
        name_fr: formData.fr
    };

    import('../services/equipmentService.js').then(({ equipmentService }) => {
      if (isEditing) {
        equipmentService.update(formData.originalData.id, payload)
          .then(() => {
            setShowForm(false);
            reloadData();
          })
          .catch(err => alert("Erro ao salvar: " + err.message));
      } else {
        equipmentService.create(payload)
          .then(() => {
            setShowForm(false);
            reloadData();
          })
          .catch(err => alert("Erro ao criar: " + err.message));
      }
    });
  };

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar equipamento…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={handleOpenNew} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo equipamento
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>
              <Link to="/exercises" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Módulo Treino</Link><span>/</span><span style={{ color: 'var(--text)' }}>Equipamentos</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Equipamentos</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Catálogo multilíngue usado para classificar exercícios. <strong style={{ color: 'var(--text)' }}>{equipments.length}</strong> equipamentos.</p>
          </div>

          {/* FEEDBACK STATES */}
          {loading && <div data-testid="loading-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontWeight: 800 }}>Carregando...</div>}
          {error && <div data-testid="error-state" style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontWeight: 800, background: 'rgba(239,68,68,.1)', borderRadius: '12px' }}>{error}</div>}
          {!loading && !error && equipments.length === 0 && <div data-testid="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontWeight: 800 }}>Lista vazia</div>}

          {/* Formulário Inline */}
          {showForm && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--brand)', borderRadius: '16px', padding: '20px', marginBottom: '18px', boxShadow: '0 8px 30px rgba(245,95,22,.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>
                  {isEditing ? 'Editar equipamento' : 'Novo equipamento'}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>ID</label>
                  <input type="text" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} disabled={isEditing} placeholder="ex: kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none', opacity: isEditing ? 0.7 : 1 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇧🇷 PT</label>
                  <input type="text" value={formData.pt} onChange={(e) => setFormData({...formData, pt: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇬🇧 EN</label>
                  <input type="text" value={formData.en} onChange={(e) => setFormData({...formData, en: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇫🇷 FR</label>
                  <input type="text" value={formData.fr} onChange={(e) => setFormData({...formData, fr: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <button onClick={handleSave} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {isEditing ? 'Guardar' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}

          {!loading && !error && equipments.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ textAlign: 'left', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (PT-BR)</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (EN)</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (FR)</th>
                    <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Exercícios</th>
                    <th style={{ textAlign: 'right', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((eq) => (
                    <tr key={eq.id} className="yb-hover-row" style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
                          <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"></path></svg>
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>{eq.id}</span>
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700 }}>{eq.pt}</td>
                      <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{eq.en}</td>
                      <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{eq.fr}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ display: 'inline-flex', padding: '3px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, background: 'var(--surface-2)', color: 'var(--text)' }}>{eq.count}</span></td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleEdit(eq)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                        <button onClick={() => handleDelete(eq.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', marginLeft: '2px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

        </div>
      </main>
    </>
  );
}