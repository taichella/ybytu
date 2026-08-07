import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import { tagService } from '../services/tagService.js';

export default function Tags() {
  const [tab, setTab] = useState('gerais'); // gerais | funcionais | dieta
  const [showNew, setShowNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
      id: '', tag_id: '', name_ptbr: '', name_en: '', name_fr: '',
      category: '', description_ptbr: '', sort_order: '0'
  });

  useEffect(() => {
    fetchTags();
    setShowNew(false);
  }, [tab]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tagService.getAll(tab);
      setTags(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Falha ao carregar tags.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
      setFormData({
          id: t.id,
          tag_id: t.tag_id || t.functional_tag_id || t.diet_tag_id || '',
          name_ptbr: t.name_ptbr || '',
          name_en: t.name_en || '',
          name_fr: t.name_fr || '',
          category: t.category || '',
          description_ptbr: t.description_ptbr || '',
          sort_order: t.sort_order || '0'
      });
      setIsEditing(true);
      setShowNew(true);
  };

  const handleSave = async () => {
      try {
          setSaving(true);
          setError(null);

          let payload = {
              name_ptbr: formData.name_ptbr,
              name_en: formData.name_en,
              name_fr: formData.name_fr,
          };
          if (tab === 'gerais') payload.tag_id = formData.tag_id;
          if (tab === 'funcionais') payload.functional_tag_id = formData.tag_id;
          if (tab === 'dieta') {
              payload.diet_tag_id = formData.tag_id;
              payload.category = formData.category;
              payload.description_ptbr = formData.description_ptbr;
              payload.sort_order = parseInt(formData.sort_order) || 0;
          }

          if (isEditing) {
              await tagService.update(tab, formData.id, payload);
          } else {
              await tagService.create(tab, payload);
          }

          setShowNew(false);
          fetchTags();
      } catch (err) {
          setError(err.message || 'Falha ao salvar tag.');
      } finally {
          setSaving(false);
      }
  };

  const resetForm = () => {
      setFormData({ id: '', tag_id: '', name_ptbr: '', name_en: '', name_fr: '', category: '', description_ptbr: '', sort_order: '0' });
      setIsEditing(false);
      setShowNew(true);
  };

  const groupDietTags = (tags) => {
      const grouped = {};
      tags.forEach(t => {
          const cat = t.category || 'Outros';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(t);
      });
      return grouped;
  };
  const dietGroupsMap = groupDietTags(tags);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <MobileNav />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>
                <span>Sistema</span><span>/</span><span style={{ color: 'var(--text)' }}>Tags & Filtros</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Tags & Filtros</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Gerenciamento do sistema de classificação transversal.</p>
            </div>
            <div>
              <button onClick={() => !showNew ? resetForm() : setShowNew(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> {showNew && !isEditing ? 'Cancelar' : 'Nova tag'}
              </button>
            </div>
          </header>

          <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)', marginBottom: '28px', overflowX: 'auto' }}>
            <button onClick={() => setTab('gerais')} style={{ padding: '0 0 16px', background: 'none', border: 'none', borderBottom: tab === 'gerais' ? '3px solid var(--brand)' : '3px solid transparent', color: tab === 'gerais' ? 'var(--text)' : 'var(--muted)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}>Gerais (Alimentos)</button>
            <button onClick={() => setTab('funcionais')} style={{ padding: '0 0 16px', background: 'none', border: 'none', borderBottom: tab === 'funcionais' ? '3px solid var(--brand)' : '3px solid transparent', color: tab === 'funcionais' ? 'var(--text)' : 'var(--muted)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}>Funcionais (Alimentos)</button>
            <button onClick={() => setTab('dieta')} style={{ padding: '0 0 16px', background: 'none', border: 'none', borderBottom: tab === 'dieta' ? '3px solid var(--brand)' : '3px solid transparent', color: tab === 'dieta' ? 'var(--text)' : 'var(--muted)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}>Dieta (Meals & Alimentos)</button>
          </div>

          {error && <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '22px' }}>{error}</div>}

          {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO INLINE */}
          {showNew && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--brand)', borderRadius: '16px', padding: '20px', marginBottom: '22px', boxShadow: '0 8px 30px rgba(245,95,22,.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>
                  {isEditing ? `Editar tag (${tab})` : `Nova tag (${tab})`}
                </h3>
                <button onClick={() => setShowNew(false)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>ID / Código</label><input type="text" value={formData.tag_id} onChange={(e) => setFormData({...formData, tag_id: e.target.value})} disabled={isEditing} placeholder="ex: sem-gluten" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none', opacity: isEditing ? 0.7 : 1 }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇧🇷 PT</label><input type="text" value={formData.name_ptbr} onChange={(e) => setFormData({...formData, name_ptbr: e.target.value})} placeholder="Sem Glúten" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇬🇧 EN</label><input type="text" value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} placeholder="Gluten Free" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome 🇫🇷 FR</label><input type="text" value={formData.name_fr} onChange={(e) => setFormData({...formData, name_fr: e.target.value})} placeholder="Sans Gluten" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>

                {tab === 'dieta' && (
                  <>
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Categoria</label><input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Ex: Preferência" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Descrição (PT)</label><input type="text" value={formData.description_ptbr} onChange={(e) => setFormData({...formData, description_ptbr: e.target.value})} placeholder="Descrição curta" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Ordem</label><input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: e.target.value})} placeholder="0" style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                    </div>
                  </>
                )}
                <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Adicionar')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>Carregando tags...</div>
          ) : tags.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: '18px', border: '1px dashed var(--border)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>Nenhuma tag encontrada</h3>
             </div>
          ) : (tab === 'gerais' || tab === 'funcionais') ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (PT-BR)</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (EN)</th>
                      <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome (FR)</th>
                      <th style={{ textAlign: 'right', padding: '13px 20px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map(t => (
                      <tr key={t.id} className="yb-hover-row" style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>{t.tag_id || t.functional_tag_id}</span>
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700 }}>{t.name_ptbr}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t.name_en}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{t.name_fr}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleEdit(t)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {Object.entries(dietGroupsMap).map(([category, items], idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', padding: '5px 12px', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text)' }}>{category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{items.length} tags</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                    {items.map(t => (
                      <div key={t.id} className="yb-hover-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{t.name_ptbr}</p>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--muted)', fontSize: '10px', fontWeight: 800, flexShrink: 0 }} title="Ordem de exibição">{t.sort_order}</span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{t.diet_tag_id}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button onClick={() => handleEdit(t)} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{t.description_ptbr || 'Sem descrição'}</p>
                        <div style={{ display: 'flex', gap: '5px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: 'var(--surface-2)', color: 'var(--text)' }}>PT</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: t.name_en ? 'var(--surface-2)' : 'transparent', color: t.name_en ? 'var(--text)' : 'var(--muted)', opacity: t.name_en ? 1 : 0.45, border: t.name_en ? 'none' : '1px dashed var(--border)' }}>EN</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: t.name_fr ? 'var(--surface-2)' : 'transparent', color: t.name_fr ? 'var(--text)' : 'var(--muted)', opacity: t.name_fr ? 1 : 0.45, border: t.name_fr ? 'none' : '1px dashed var(--border)' }}>FR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
