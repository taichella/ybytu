import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import { equipmentService } from '../services/equipmentService.js';

export default function Equipment() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ id: '', exercise_equipment_id: '', name_ptbr: '', name_en: '', name_fr: '' });

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipmentService.getAll();
      setEquipments(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Falha ao carregar equipamentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (eq) => {
    setFormData({
        id: eq.id,
        exercise_equipment_id: eq.exercise_equipment_id,
        name_ptbr: eq.name_ptbr || '',
        name_en: eq.name_en || '',
        name_fr: eq.name_fr || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
        setSaving(true);
        setError(null);
        if (isEditing) {
            await equipmentService.update(formData.id, formData);
        } else {
            await equipmentService.create(formData);
        }
        setShowForm(false);
        fetchEquipments(); // Reload
    } catch (err) {
        setError(err.message || 'Falha ao salvar equipamento.');
    } finally {
        setSaving(false);
    }
  };

  const resetForm = () => {
      setFormData({ id: '', exercise_equipment_id: '', name_ptbr: '', name_en: '', name_fr: '' });
      setIsEditing(false);
      setShowForm(true);
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
                <Link to="/exercises" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Módulo Treino</Link><span>/</span><span style={{ color: 'var(--text)' }}>Equipamentos</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Equipamentos</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Catálogo multilíngue usado para classificar exercícios. <strong style={{ color: 'var(--text)' }}>{equipments.length}</strong> equipamentos.</p>
            </div>
            <div>
              <button onClick={() => !showForm ? resetForm() : setShowForm(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> {showForm && !isEditing ? 'Cancelar' : 'Novo equipamento'}
              </button>
            </div>
          </header>

          {error && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '22px' }}>
              {error}
            </div>
          )}

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
                  <input type="text" value={formData.exercise_equipment_id} onChange={(e) => setFormData({...formData, exercise_equipment_id: e.target.value})} disabled={isEditing} placeholder="ex: kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none', opacity: isEditing ? 0.7 : 1 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇧🇷 PT</label>
                  <input type="text" value={formData.name_ptbr} onChange={(e) => setFormData({...formData, name_ptbr: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇬🇧 EN</label>
                  <input type="text" value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇫🇷 FR</label>
                  <input type="text" value={formData.name_fr} onChange={(e) => setFormData({...formData, name_fr: e.target.value})} placeholder="Kettlebell" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                </div>
                <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Adicionar')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>Carregando...</div>
          ) : equipments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: '18px', border: '1px dashed var(--border)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>Nenhum equipamento encontrado</h3>
            </div>
          ) : (
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
                            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>{eq.exercise_equipment_id}</span>
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700 }}>{eq.name_ptbr}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{eq.name_en}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{eq.name_fr}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ display: 'inline-flex', padding: '3px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, background: 'var(--surface-2)', color: 'var(--text)' }}>{eq.count}</span></td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleEdit(eq)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
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
    </div>
  );
}
