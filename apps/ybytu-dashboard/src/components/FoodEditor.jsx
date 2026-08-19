import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { foodService } from '../services/foodService.js';

const MACRO_FIELDS = [
  { name: 'calories_per_unit', label: 'Calorias', unit: 'kcal' },
  { name: 'protein_g', label: 'Proteínas', unit: 'g' },
  { name: 'carbs_g', label: 'Carboidratos', unit: 'g' },
  { name: 'fat_g', label: 'Gorduras totais', unit: 'g' },
  { name: 'fat_sat_g', label: 'Gord. saturadas', unit: 'g' },
  { name: 'fat_trans_g', label: 'Gord. trans', unit: 'g' },
  { name: 'fiber_g', label: 'Fibras', unit: 'g' },
  { name: 'sugar_g', label: 'Açúcares', unit: 'g' },
  { name: 'cholesterol_mg', label: 'Colesterol', unit: 'mg' },
];

const MICRO_FIELDS = [
  { name: 'sodium_mg', label: 'Sódio', unit: 'mg' },
  { name: 'calcium_mg', label: 'Cálcio', unit: 'mg' },
  { name: 'iron_mg', label: 'Ferro', unit: 'mg' },
  { name: 'potassium_mg', label: 'Potássio', unit: 'mg' },
  { name: 'magnesium_mg', label: 'Magnésio', unit: 'mg' },
];

export default function FoodEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [lang, setLang] = useState('pt');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [lookups, setLookups] = useState(null);

  const [formData, setFormData] = useState({
    food_id: '', name_ptbr: '', name_en: '', name_fr: '',
    brand: '', food_group_id: '', food_source_id: '', food_type_id: '', food_preparation_method_id: '', dietary_preference: '',
    quantity: '100', food_measurement_unit_id: '', correction_factor: '1.00', cooking_factor: '1.00',
    calories_per_unit: '0', protein_g: '0', carbs_g: '0', fat_g: '0', fiber_g: '0', sugar_g: '0', fat_sat_g: '0', fat_trans_g: '0', cholesterol_mg: '0', sodium_mg: '0', calcium_mg: '0', iron_mg: '0', potassium_mg: '0', magnesium_mg: '0',
    diet_tags_ids: [], functional_tags_ids: []
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const lookupsData = await foodService.getLookups();
      setLookups(lookupsData);

      if (!isNew) {
        const foodData = await foodService.getById(id);
        setFormData({
            ...foodData,
            diet_tags_ids: foodData.diet_tags_ids ? (typeof foodData.diet_tags_ids === 'string' ? foodData.diet_tags_ids.split(',') : foodData.diet_tags_ids) : [],
            functional_tags_ids: foodData.functional_tags_ids ? (typeof foodData.functional_tags_ids === 'string' ? foodData.functional_tags_ids.split(',') : foodData.functional_tags_ids) : []
        });
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
          ...formData,
          diet_tags_ids: Array.isArray(formData.diet_tags_ids) ? formData.diet_tags_ids.join(',') : formData.diet_tags_ids,
          functional_tags_ids: Array.isArray(formData.functional_tags_ids) ? formData.functional_tags_ids.join(',') : formData.functional_tags_ids
      };

      if (isNew) {
        await foodService.create(payload);
      } else {
        await foodService.update(id, payload);
      }
      navigate('/foods');
    } catch (err) {
      setError(err.message || 'Falha ao salvar alimento.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const donut = useMemo(() => {
    const prot = parseFloat(formData.protein_g) || 0;
    const carb = parseFloat(formData.carbs_g) || 0;
    const fat = parseFloat(formData.fat_g) || 0;
    const pc = prot * 4, cc = carb * 4, fc = fat * 9;
    const tot = pc + cc + fc;
    if (!tot) return { gradient: 'conic-gradient(var(--border) 0 100%)', pProt: 0, pCarb: 0, pFat: 0 };
    const pProt = +(pc / tot * 100).toFixed(1);
    const pCarb = +(cc / tot * 100).toFixed(1);
    const pFat = +(100 - pProt - pCarb).toFixed(1);
    return {
      gradient: `conic-gradient(#3b82f6 0 ${pProt}%, #f59e0b ${pProt}% ${pProt + pCarb}%, #a855f7 ${pProt + pCarb}% 100%)`,
      pProt, pCarb, pFat,
    };
  }, [formData.protein_g, formData.carbs_g, formData.fat_g]);

  if (loading) return <div style={{ display: 'flex', height: '100%', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>
                <Link to="/foods" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Alimentos</Link><span>/</span><span style={{ color: 'var(--text)' }}>{isNew ? 'Novo Alimento' : formData.name_ptbr}</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>
                {isNew ? 'Criar Alimento' : 'Editar Alimento'}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setLang('pt')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: lang === 'pt' ? 'var(--field)' : 'transparent', color: lang === 'pt' ? 'var(--text)' : 'var(--muted)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}>🇧🇷 PT</button>
                <button onClick={() => setLang('en')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: lang === 'en' ? 'var(--field)' : 'transparent', color: lang === 'en' ? 'var(--text)' : 'var(--muted)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}>🇬🇧 EN</button>
                <button onClick={() => setLang('fr')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: lang === 'fr' ? 'var(--field)' : 'transparent', color: lang === 'fr' ? 'var(--text)' : 'var(--muted)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}>🇫🇷 FR</button>
              </div>
              <button onClick={() => navigate('/foods')} style={{ background: 'none', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </header>

          {error && <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '22px' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '22px', alignItems: 'start' }}>

            {/* LEFT COLUMN: Nutrition (sempre visível) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Macro summary + donut */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Resumo Nutricional <span style={{ color: 'var(--muted)', fontWeight: 600, textTransform: 'none', fontSize: '13px' }}>· por porção ({formData.quantity || 0}{lookups?.food_measurement_units?.find(u => u.id === formData.food_measurement_unit_id)?.name_ptbr || 'g'})</span></h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundImage: donut.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{formData.calories_per_unit || 0}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>kcal</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#3b82f6' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Proteínas</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{formData.protein_g || 0} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>{donut.pProt}%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#f59e0b' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Carboidratos</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{formData.carbs_g || 0} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>{donut.pCarb}%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#a855f7' }}></span><span style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>Gorduras</span><span style={{ fontSize: '15px', fontWeight: 800 }}>{formData.fat_g || 0} g</span><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '42px', textAlign: 'right' }}>{donut.pFat}%</span></div>
                  </div>
                </div>
              </section>

              {/* Full nutrient table */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Tabela Nutricional Completa</h3>

                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Macronutrientes</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {MACRO_FIELDS.map(f => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--field)', borderRadius: '11px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <input type="text" name={f.name} value={formData[f.name] ?? ''} onChange={handleChange} style={{ width: '64px', padding: '6px 8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 800, outline: 'none', textAlign: 'right' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '22px' }}>{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Minerais & Outros</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {MICRO_FIELDS.map(f => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--field)', borderRadius: '11px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <input type="text" name={f.name} value={formData[f.name] ?? ''} onChange={handleChange} style={{ width: '64px', padding: '6px 8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 800, outline: 'none', textAlign: 'right' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, width: '22px' }}>{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Identity, Classification, Portion & Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Identity */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Identidade ({lang.toUpperCase()})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome do Alimento</label>
                    {lang === 'pt' && <input type="text" name="name_ptbr" value={formData.name_ptbr} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'en' && <input type="text" name="name_en" value={formData.name_en || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                    {lang === 'fr' && <input type="text" name="name_fr" value={formData.name_fr || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Código (food_id)</label><input type="text" name="food_id" value={formData.food_id} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Marca</label><input type="text" name="brand" value={formData.brand || ''} onChange={handleChange} placeholder="—" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  </div>
                </div>
              </section>

              {/* Classification */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Classificação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Grupo</label>
                  <select name="food_group_id" value={formData.food_group_id || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    {lookups?.food_groups?.map(g => <option key={g.id} value={g.id}>{g.name_ptbr}</option>)}
                  </select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fonte</label>
                  <select name="food_source_id" value={formData.food_source_id || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    {lookups?.food_sources?.map(g => <option key={g.id} value={g.id}>{g.name_ptbr}</option>)}
                  </select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preparo</label>
                  <select name="food_preparation_method_id" value={formData.food_preparation_method_id || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    {lookups?.food_preparation_methods?.map(g => <option key={g.id} value={g.id}>{g.name_ptbr}</option>)}
                  </select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preferência</label>
                  <select name="dietary_preference" value={formData.dietary_preference || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    <option value="omnivore">Onívoro</option>
                    <option value="vegetarian">Vegetariano</option>
                    <option value="vegan">Vegano</option>
                  </select></div>
                </div>
              </section>

              {/* Portion & Factors */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Porção & Fatores</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Quantidade</label><input type="text" name="quantity" value={formData.quantity || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Unidade</label>
                  <select name="food_measurement_unit_id" value={formData.food_measurement_unit_id || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    {lookups?.food_measurement_units?.map(g => <option key={g.id} value={g.id}>{g.name_ptbr}</option>)}
                  </select></div>
                  <div><label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fator correção <span style={{ color: 'var(--brand)', cursor: 'help' }}>ⓘ</span></label><input type="text" name="correction_factor" value={formData.correction_factor || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                  <div><label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fator cocção <span style={{ color: 'var(--brand)', cursor: 'help' }}>ⓘ</span></label><input type="text" name="cooking_factor" value={formData.cooking_factor || ''} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }} /></div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Tags de Dieta</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' }}>
                  {formData.diet_tags_ids.map((id, i) => {
                      const tg = lookups?.diet_tags?.find(t => t.id === id);
                      return <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'rgba(22,163,74,.10)', color: '#16a34a' }}>{tg ? tg.name_ptbr : id}</span>
                  })}
                  <select onChange={(e) => {
                      if(e.target.value && !formData.diet_tags_ids.includes(e.target.value)) {
                          setFormData(prev => ({ ...prev, diet_tags_ids: [...prev.diet_tags_ids, e.target.value] }))
                      }
                      e.target.value = "";
                  }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <option value="">+ Add Tag</option>
                      {lookups?.diet_tags?.filter(t => !formData.diet_tags_ids.includes(t.id)).map(t => (
                          <option key={t.id} value={t.id}>{t.name_ptbr}</option>
                      ))}
                  </select>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Tags Funcionais</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {formData.functional_tags_ids.map((id, i) => {
                      const tg = lookups?.functional_tags?.find(t => t.id === id);
                      return <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)' }}>{tg ? tg.name_ptbr : id}</span>
                  })}
                  <select onChange={(e) => {
                      if(e.target.value && !formData.functional_tags_ids.includes(e.target.value)) {
                          setFormData(prev => ({ ...prev, functional_tags_ids: [...prev.functional_tags_ids, e.target.value] }))
                      }
                      e.target.value = "";
                  }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'none', border: '1px dashed var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <option value="">+ Add Funcional</option>
                      {lookups?.functional_tags?.filter(t => !formData.functional_tags_ids.includes(t.id)).map(t => (
                          <option key={t.id} value={t.id}>{t.name_ptbr}</option>
                      ))}
                  </select>
                </div>
              </section>
            </div>

          </div>
        </div>
    </main>
  );
}
