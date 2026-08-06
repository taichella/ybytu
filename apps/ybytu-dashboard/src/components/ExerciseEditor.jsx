import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { exerciseService } from '../services/exerciseService.js';

const EMPTY = {
  exercise_id: '', name_ptbr: '', name_en: '', name_fr: '',
  instruction_ptbr: '', instruction_en: '', instruction_fr: '',
  muscle_groups_ids: [], exercise_equipments_ids: [], exercise_level_id: '',
  avoid_health_conditions_ids: [], caution_health_condition_ids: [],
  calories: '', image_url: '', video_url: '',
};

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function ChipMultiSelect({ options, codeField, selected, onToggle, activeColor }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((opt) => {
        const code = opt[codeField];
        const isActive = selected.includes(code);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(code)}
            style={{
              padding: '6px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: isActive ? (activeColor ?? 'var(--brand)') : 'var(--surface-2)',
              color: isActive ? '#fff' : 'var(--text)',
              border: isActive ? 'none' : '1px solid var(--border)',
            }}
          >
            {opt.name_ptbr}
          </button>
        );
      })}
    </div>
  );
}

export default function ExerciseEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('pt');
  const [lookups, setLookups] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const lk = await exerciseService.getLookups();
        if (cancelled) return;
        setLookups(lk);
        if (!isNew) {
          const ex = await exerciseService.getById(id);
          if (cancelled) return;
          setForm({
            ...EMPTY,
            ...ex,
            muscle_groups_ids: ex.muscle_groups_ids ?? [],
            exercise_equipments_ids: ex.exercise_equipments_ids ?? [],
            avoid_health_conditions_ids: ex.avoid_health_conditions_ids ?? [],
            caution_health_condition_ids: ex.caution_health_condition_ids ?? [],
            calories: ex.calories ?? '',
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar exercício');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isNew]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, calories: form.calories === '' ? null : Number(form.calories) };
      if (isNew) {
        const created = await exerciseService.create(payload);
        navigate(`/exercise-editor/${created.id}`);
      } else {
        await exerciseService.update(id, payload);
        navigate('/exercises');
      }
    } catch (e) {
      setError(e.message || 'Falha ao salvar exercício');
    } finally {
      setSaving(false);
    }
  }

  const langBtnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '8px 14px', borderRadius: '7px',
    background: isActive ? 'var(--brand)' : 'transparent',
    color: isActive ? '#fff' : 'var(--muted)'
  });

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' };
  const sectionStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' };

  if (loading) return <div style={{ padding: '28px', color: 'var(--muted)' }}>Carregando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/exercises')} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{isNew ? 'Novo Exercício' : (form.name_ptbr || 'Editar')}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => navigate('/exercises')} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : (isNew ? 'Criar' : 'Salvar')}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          {error && <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setLang('pt')} style={langBtnStyle(lang === 'pt')}>🇧🇷 Português</button>
              <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>🇬🇧 English</button>
              <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>🇫🇷 Français</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)', gap: '22px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Mídia</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={labelStyle}>video_url</label><input style={inputStyle} value={form.video_url ?? ''} onChange={(e) => set('video_url', e.target.value)} /></div>
                  <div><label style={labelStyle}>image_url</label><input style={inputStyle} value={form.image_url ?? ''} onChange={(e) => set('image_url', e.target.value)} /></div>
                </div>
              </section>

              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Instruções ({lang.toUpperCase()})</h3>
                <textarea rows="7" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  value={form[`instruction_${lang === 'pt' ? 'ptbr' : lang}`] ?? ''}
                  onChange={(e) => set(`instruction_${lang === 'pt' ? 'ptbr' : lang}`, e.target.value)} />
              </section>

              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Condições de Saúde</h3>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--muted)' }}>O app oculta ou alerta o exercício conforme as condições do usuário.</p>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Evitar — contraindicado</p>
                <ChipMultiSelect
                  options={lookups?.health_conditions ?? []} codeField="health_condition_id"
                  selected={form.avoid_health_conditions_ids}
                  onToggle={(code) => set('avoid_health_conditions_ids', toggleInArray(form.avoid_health_conditions_ids, code))}
                  activeColor="#ef4444"
                />
                <p style={{ margin: '18px 0 8px', fontSize: '12px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Cautela — orientar adaptação</p>
                <ChipMultiSelect
                  options={lookups?.health_conditions ?? []} codeField="health_condition_id"
                  selected={form.caution_health_condition_ids}
                  onToggle={(code) => set('caution_health_condition_ids', toggleInArray(form.caution_health_condition_ids, code))}
                  activeColor="#d97706"
                />
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Identificação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nome ({lang.toUpperCase()})</label>
                    <input style={inputStyle} value={form[`name_${lang === 'pt' ? 'ptbr' : lang}`] ?? ''} onChange={(e) => set(`name_${lang === 'pt' ? 'ptbr' : lang}`, e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Código de referência (exercise_id)</label>
                    <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.exercise_id ?? ''} onChange={(e) => set('exercise_id', e.target.value)} />
                  </div>
                </div>
              </section>

              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Classificação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nível</label>
                    <select style={inputStyle} value={form.exercise_level_id ?? ''} onChange={(e) => set('exercise_level_id', e.target.value)}>
                      <option value="">Selecione</option>
                      {(lookups?.exercise_levels ?? []).map((l) => <option key={l.id} value={l.exercise_level_id}>{l.name_ptbr}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Calorias</label>
                    <input type="number" style={inputStyle} value={form.calories ?? ''} onChange={(e) => set('calories', e.target.value)} />
                  </div>
                </div>
              </section>

              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Grupos Musculares</h3>
                <ChipMultiSelect
                  options={lookups?.muscle_groups ?? []} codeField="muscle_group_id"
                  selected={form.muscle_groups_ids}
                  onToggle={(code) => set('muscle_groups_ids', toggleInArray(form.muscle_groups_ids, code))}
                />
              </section>

              <section style={sectionStyle}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Equipamentos</h3>
                <ChipMultiSelect
                  options={lookups?.exercise_equipments ?? []} codeField="exercise_equipment_id"
                  selected={form.exercise_equipments_ids}
                  onToggle={(code) => set('exercise_equipments_ids', toggleInArray(form.exercise_equipments_ids, code))}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
