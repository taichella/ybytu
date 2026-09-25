import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { trainingService } from '../services/trainingService.js';
import { exerciseService } from '../services/exerciseService.js';
import ChipMultiSelect from './ChipMultiSelect.jsx';
import ThemeToggle from './ThemeToggle';
import ExerciseThumb from './ExerciseThumb.jsx';
import EnvironmentTag from './EnvironmentTag.jsx';
import { thumbSources } from '../lib/media.js';

// exercises.load_type (2026-09-19): 'bodyweight' e 'band' não usam carga em kg,
// então o campo de carga some pra esses exercícios. Tipo ausente (resposta de
// servidor antiga) ou desconhecido = usa kg, o mesmo default do banco: errar por
// mostrar o campo é visível; errar por esconder deixaria o aluno sem carga.
const NO_KG_HINT = { bodyweight: 'Peso corporal', band: 'Elástico' };
const usesKg = (exercise) => !(exercise?.load_type in NO_KG_HINT);

const EMPTY_PLAN = {
  training_plan_id: '', name_ptbr: '', name_en: '', name_fr: '',
  goals_ids: [], exercise_environments_ids: [], exercise_equipment_ids: [], exercise_level_id: '',
  days_per_week: 3, duration_minutes: '', instruction_ptbr: '', instruction_en: '', instruction_fr: '',
  is_active: true,
};

const EMPTY_SLOTS = [];

export default function TrainingPlanCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id;
  // Vindo de "Editar treino" no documento do aluno (UserPlanPage) -- este
  // training_plans.id É o plano ATRIBUÍDO a um aluno específico, não um
  // molde nem um item de catálogo. Decisão 2026-08-25: sem estado de
  // rascunho/publicado aqui, salva e já vale na hora pro aluno.
  const forUser = searchParams.get('forUser');
  const forUserName = searchParams.get('forUserName') || '';
  const isStudentPlan = Boolean(forUser);

  const [day, setDay] = useState(1);
  const [settings, setSettings] = useState(false);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [isMolde, setIsMolde] = useState(false);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [lookups, setLookups] = useState(null);
  const [exLookups, setExLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Filtros da Biblioteca de Exercícios
  const [allExercises, setAllExercises] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [filterSectionOpen, setFilterSectionOpen] = useState(false);
  const [exResults, setExResults] = useState([]);
  const [mobileTab, setMobileTab] = useState('slots'); // 'slots' | 'library'

  const nextUid = useRef(0);
  const searchDebounce = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [lk, exList, exLk] = await Promise.all([
          trainingService.getLookups(),
          exerciseService.getAll().catch(() => null),
          exerciseService.getLookups().catch(() => null),
        ]);
        if (cancelled) return;
        setLookups(lk);
        setExLookups(exLk);
        if (Array.isArray(exList)) setAllExercises(exList);

        if (!isNew) {
          const { training_plan, slots, is_molde } = await trainingService.getById(id);
          if (cancelled) return;
          setPlan({ ...EMPTY_PLAN, ...training_plan });
          setIsMolde(is_molde);
          const grouped = {};
          (slots ?? []).forEach((s) => {
            const d = s.day_number ?? 1;
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push({
              uniqueId: `s${nextUid.current++}`, exercise_id: s.exercise_id, exercise: s.exercise,
              sets: s.sets, reps: s.reps, rest_seconds: s.rest_seconds, order_within_day: s.order_within_day,
              load_kg: s.sets_detail?.[0]?.load_kg ?? '',
            });
          });
          setSlotsByDay(grouped);
        } else {
          // Plano novo começa com painel de configurações aberto
          setSettings(true);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar plano de treino');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isNew]);

  // Fallback de busca remota se allExercises não estiver populado
  useEffect(() => {
    if (allExercises.length > 0) return;
    let cancelled = false;
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await trainingService.searchExercises(exSearch.trim());
        if (!cancelled) setExResults(results ?? []);
      } catch { /* autocomplete fallback */ }
    }, exSearch.trim() ? 300 : 0);
    return () => { cancelled = true; clearTimeout(searchDebounce.current); };
  }, [exSearch, allExercises.length]);

  const setPlanField = (field, value) => setPlan((p) => ({ ...p, [field]: value }));

  const currentSlots = slotsByDay[day] ?? EMPTY_SLOTS;

  // Mapas de Lookups para nomes legíveis
  const muscleGroupOptions = useMemo(() => exLookups?.muscle_groups ?? [], [exLookups]);
  const muscleGroupMap = useMemo(() => new Map(muscleGroupOptions.map(m => [m.muscle_group_id, m.name_ptbr])), [muscleGroupOptions]);
  const equipmentOptions = useMemo(() => lookups?.exercise_equipments ?? exLookups?.exercise_equipments ?? [], [lookups, exLookups]);
  const equipMap = useMemo(() => new Map(equipmentOptions.map(e => [e.exercise_equipment_id, e.name_ptbr])), [equipmentOptions]);
  const levelOptions = useMemo(() => lookups?.exercise_levels ?? exLookups?.exercise_levels ?? [], [lookups, exLookups]);
  const levelMap = useMemo(() => new Map(levelOptions.map(l => [l.exercise_level_id, l.name_ptbr])), [levelOptions]);
  const goalMap = useMemo(() => new Map((lookups?.goals ?? []).map(g => [g.goal_id, g.name_ptbr])), [lookups]);
  const envMap = useMemo(() => new Map((lookups?.exercise_environments ?? []).map(e => [e.exercise_environment_id, e.name_ptbr])), [lookups]);

  // Contagem de exercícios do catálogo por categoria (para exibir nos botões de filtro)
  const exerciseCountByMuscle = useMemo(() => {
    const counts = new Map();
    allExercises.forEach(ex => {
      (ex.muscle_groups_ids ?? []).forEach(mid => {
        counts.set(mid, (counts.get(mid) ?? 0) + 1);
      });
    });
    return counts;
  }, [allExercises]);

  const exerciseCountByEquipment = useMemo(() => {
    const counts = new Map();
    allExercises.forEach(ex => {
      (ex.exercise_equipments_ids ?? []).forEach(eid => {
        counts.set(eid, (counts.get(eid) ?? 0) + 1);
      });
    });
    return counts;
  }, [allExercises]);

  const exerciseCountByLevel = useMemo(() => {
    const counts = new Map();
    allExercises.forEach(ex => {
      if (ex.exercise_level_id) {
        counts.set(ex.exercise_level_id, (counts.get(ex.exercise_level_id) ?? 0) + 1);
      }
    });
    return counts;
  }, [allExercises]);

  // Filtragem dos exercícios na biblioteca
  const filteredExercises = useMemo(() => {
    const list = allExercises.length > 0 ? allExercises : exResults;
    const q = exSearch.trim().toLowerCase();
    return list.filter((ex) => {
      if (q) {
        const inName = (ex.name_ptbr ?? '').toLowerCase().includes(q);
        const inId = (ex.exercise_id ?? '').toLowerCase().includes(q);
        if (!inName && !inId) return false;
      }
      if (selectedMuscles.length > 0) {
        const mg = ex.muscle_groups_ids ?? [];
        if (!selectedMuscles.some(m => mg.includes(m))) return false;
      }
      if (selectedEquipments.length > 0) {
        const eq = ex.exercise_equipments_ids ?? [];
        if (!selectedEquipments.some(e => eq.includes(e))) return false;
      }
      if (selectedLevel) {
        if (ex.exercise_level_id !== selectedLevel) return false;
      }
      return true;
    });
  }, [allExercises, exResults, exSearch, selectedMuscles, selectedEquipments, selectedLevel]);

  // Gestão de filtros ativos
  const hasActiveFilters = Boolean(
    exSearch.trim() ||
    selectedMuscles.length > 0 ||
    selectedEquipments.length > 0 ||
    selectedLevel
  );

  const activeFilterCount = (exSearch.trim() ? 1 : 0) +
    selectedMuscles.length +
    selectedEquipments.length +
    (selectedLevel ? 1 : 0);

  const clearAllFilters = () => {
    setExSearch('');
    setSelectedMuscles([]);
    setSelectedEquipments([]);
    setSelectedLevel('');
  };

  const toggleMuscle = (mid) => {
    setSelectedMuscles(prev => prev.includes(mid) ? prev.filter(m => m !== mid) : [...prev, mid]);
  };

  const toggleEquipment = (eid) => {
    setSelectedEquipments(prev => prev.includes(eid) ? prev.filter(e => e !== eid) : [...prev, eid]);
  };

  // Descritores legíveis de filtros ativos (usados na barra visível quando recolhido)
  const activeFilterSummaries = useMemo(() => {
    const list = [];
    if (selectedMuscles.length > 0) {
      list.push({
        label: `Grupo muscular: ${selectedMuscles.map(m => muscleGroupMap.get(m) || m).join(', ')}`,
        onRemove: () => setSelectedMuscles([]),
      });
    }
    if (selectedEquipments.length > 0) {
      list.push({
        label: `Equipamento: ${selectedEquipments.map(e => equipMap.get(e) || e).join(', ')}`,
        onRemove: () => setSelectedEquipments([]),
      });
    }
    if (selectedLevel) {
      list.push({
        label: `Nível: ${levelMap.get(selectedLevel) || selectedLevel}`,
        onRemove: () => setSelectedLevel(''),
      });
    }
    if (exSearch.trim()) {
      list.push({
        label: `Busca: "${exSearch.trim()}"`,
        onRemove: () => setExSearch(''),
      });
    }
    return list;
  }, [selectedMuscles, selectedEquipments, selectedLevel, exSearch, muscleGroupMap, equipMap, levelMap]);

  // Foco muscular computado do dia
  const dayMuscleGroups = useMemo(() => {
    const groups = new Set();
    currentSlots.forEach(slot => {
      const mg = slot.exercise?.muscle_groups;
      if (Array.isArray(mg)) {
        mg.forEach(g => { if (g) groups.add(g); });
      }
    });
    return Array.from(groups).sort();
  }, [currentSlots]);

  // Resumo das configurações do plano quando recolhido
  const planSettingsSummary = useMemo(() => {
    const parts = [];
    const goals = (plan.goals_ids ?? []).map(g => goalMap.get(g) || g).filter(Boolean);
    if (goals.length > 0) parts.push(`Objetivos: ${goals.join(', ')}`);
    const envs = (plan.exercise_environments_ids ?? []).map(e => envMap.get(e) || e).filter(Boolean);
    if (envs.length > 0) parts.push(`Ambiente: ${envs.join(', ')}`);
    if (plan.exercise_level_id) parts.push(`Nível: ${levelMap.get(plan.exercise_level_id) || plan.exercise_level_id}`);
    if (plan.days_per_week) parts.push(`${plan.days_per_week} dias/sem`);
    if (plan.duration_minutes) parts.push(`${plan.duration_minutes} min/sessão`);
    return parts.length > 0 ? parts.join(' · ') : 'Nenhuma configuração preenchida';
  }, [plan, goalMap, envMap, levelMap]);

  const addExercise = (ex) => {
    setSlotsByDay((prev) => {
      const list = prev[day] ?? [];
      return {
        ...prev,
        [day]: [...list, { uniqueId: `s${nextUid.current++}`, exercise_id: ex.exercise_id, exercise: ex, sets: 3, reps: 10, rest_seconds: 60, load_kg: '', order_within_day: list.length + 1 }],
      };
    });
  };

  const removeSlot = (uniqueId) => {
    setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((s) => s.uniqueId !== uniqueId) }));
  };

  const updateSlot = (uniqueId, field, value) => {
    setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).map((s) => s.uniqueId === uniqueId ? { ...s, [field]: value } : s) }));
  };

  async function handleSave(publish) {
    if (isMolde) {
      const ok = window.confirm('Este treino é um dos moldes ativos (fonte do gerador). Editar afeta todo plano novo gerado a partir de agora para os objetivos que usam este molde. Continuar?');
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    try {
      const isActive = isMolde ? true : (publish ?? plan.is_active);
      const payload = { ...plan, is_active: isActive, days_per_week: Number(plan.days_per_week) || null, duration_minutes: plan.duration_minutes === '' ? null : Number(plan.duration_minutes) };
      const allSlots = Object.entries(slotsByDay).flatMap(([dayNumber, slots]) =>
        slots.map((s, i) => {
          const sets = Number(s.sets) || 0;
          const reps = Number(s.reps) || 0;
          const restSeconds = s.rest_seconds === '' ? null : Number(s.rest_seconds);
          // Exercício sem carga (peso corporal/elástico) nunca grava kg, mesmo que exista
          // um valor antigo no slot -- o campo está escondido, o valor não pode sobreviver.
          const loadKg = !usesKg(s.exercise) || s.load_kg === '' || s.load_kg === null || s.load_kg === undefined ? null : Number(s.load_kg);
          const setsDetail = loadKg === null ? null : Array.from({ length: sets }, (_, setIdx) => ({
            set_number: setIdx + 1, reps, load_kg: loadKg, rest_seconds: restSeconds, set_type: 'normal',
          }));
          return {
            exercise_id: s.exercise_id, exercise_order: i + 1, sets, reps,
            rest_seconds: restSeconds, day_number: Number(dayNumber), order_within_day: i + 1,
            sets_detail: setsDetail,
          };
        })
      );
      if (isNew) {
        const created = await trainingService.create(payload, allSlots);
        navigate(`/training-creator/${created.id}`);
      } else {
        await trainingService.update(id, payload, allSlots);
        navigate(isStudentPlan ? `/users/${forUser}/plano` : '/trainings');
      }
    } catch (e) {
      setError(e.message || 'Falha ao salvar plano de treino');
    } finally {
      setSaving(false);
    }
  }

  const dayStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, padding: '16px 14px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', boxSizing: 'border-box' };

  if (loading) return <div style={{ padding: '28px', color: 'var(--muted)' }}>Carregando…</div>;

  const days = Array.from({ length: Number(plan.days_per_week) || 3 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <style>{`
        .yb-creator-header {
          min-height: 68px;
          flex-shrink: 0;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          gap: 14px;
          flex-wrap: wrap;
        }
        .yb-creator-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .yb-creator-body {
          flex: 1;
          display: flex;
          min-height: 0;
        }
        .yb-creator-aside {
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .yb-creator-main {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          min-width: 0;
        }
        .yb-mobile-toggle-bar {
          display: none;
        }
        .yb-sets-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 12px 16px;
        }
        @media (max-width: 768px) {
          .yb-creator-header {
            padding: 10px 14px;
            gap: 10px;
          }
          .yb-creator-actions {
            width: 100%;
            justify-content: space-between;
          }
          .yb-mobile-toggle-bar {
            display: flex;
            background: var(--surface-2);
            padding: 4px;
            border-radius: 10px;
            margin: 0 14px 10px;
            gap: 4px;
          }
          .yb-creator-body {
            flex-direction: column;
          }
          .yb-creator-aside {
            width: 100% !important;
            border-right: none;
            border-bottom: 1px solid var(--border);
            display: ${mobileTab === 'library' ? 'flex' : 'none'};
            flex: 1;
          }
          .yb-creator-main {
            display: ${mobileTab === 'slots' ? 'block' : 'none'};
            padding: 14px;
          }
          .yb-sets-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
        @media (max-width: 360px) {
          .yb-creator-header {
            padding: 8px 10px;
          }
          .yb-creator-actions button {
            padding: 8px 10px !important;
            font-size: 12px !important;
          }
          .yb-sets-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            padding: 10px;
          }
          .yb-sets-grid input {
            font-size: 12px !important;
            padding: 7px 6px !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="yb-creator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate(isStudentPlan ? `/users/${forUser}/plano` : '/trainings')}
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Voltar"
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={plan.name_ptbr}
              onChange={(e) => setPlanField('name_ptbr', e.target.value)}
              placeholder="Nome do plano de treino…"
              style={{ fontSize: '17px', fontWeight: 900, background: 'none', border: 'none', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          {!isNew && !isMolde && !isStudentPlan && (
            <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', whiteSpace: 'nowrap', background: plan.is_active ? 'rgba(22,163,74,.1)' : 'var(--surface-2)', color: plan.is_active ? '#16a34a' : 'var(--muted)' }}>
              {plan.is_active ? 'Publicado' : 'Rascunho'}
            </span>
          )}
        </div>

        <div className="yb-creator-actions">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSettings((s) => !s)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', padding: '9px 14px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              background: settings ? 'var(--brand-soft)' : 'var(--surface)', color: settings ? 'var(--brand)' : 'var(--text)', border: `1px solid ${settings ? 'rgba(245,95,22,.4)' : 'var(--border)'}`
            }}
            title={settings ? 'Recolher configurações do plano' : 'Expandir configurações do plano'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Configurações</span>
            <span style={{ fontSize: '10px', opacity: .7 }}>{settings ? '▲' : '▼'}</span>
          </button>

          {isMolde || isStudentPlan ? (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12.5px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', fontSize: '12.5px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}
              >
                {saving ? 'Salvando…' : 'Salvar rascunho'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12.5px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}
              >
                {saving ? 'Salvando…' : (isNew ? 'Criar e publicar' : 'Publicar')}
              </button>
            </>
          )}
        </div>
      </header>

      {/* AVISOS DE STATUS */}
      {isMolde && (
        <div style={{ flexShrink: 0, background: 'rgba(245,95,22,.1)', borderBottom: '1px solid rgba(245,95,22,.3)', padding: '8px 24px', fontSize: '12px', fontWeight: 700, color: '#F55F16' }}>
          ⚠️ Molde ativo ({plan.training_plan_id}) — fonte do gerador. Alterações afetam novos planos gerados a partir de agora.
        </div>
      )}
      {isStudentPlan && (
        <div style={{ flexShrink: 0, background: 'rgba(59,130,246,.1)', borderBottom: '1px solid rgba(59,130,246,.3)', padding: '8px 24px', fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>
          Editando o plano de treino de {forUserName || 'aluno'}. Alterações valem na hora no app e PDF do aluno.
        </div>
      )}
      {error && <p style={{ color: '#ef4444', padding: '8px 24px 0', margin: 0, fontSize: '13px' }}>{error}</p>}

      {/* CONFIGURAÇÕES DO PLANO: EXPANDIDO OU SUMÁRIO RECOLHIDO */}
      {settings ? (
        <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
              Configurações do Plano
            </h3>
            <button
              onClick={() => setSettings(false)}
              style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Recolher ▲
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Objetivos</label>
              <ChipMultiSelect options={lookups?.goals ?? []} value={plan.goals_ids} onChange={(v) => setPlanField('goals_ids', v)} getValue={(g) => g.goal_id} getLabel={(g) => g.name_ptbr} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Ambiente</label>
              <ChipMultiSelect options={(lookups?.exercise_environments ?? []).filter(e => e.is_active !== false || (plan.exercise_environments_ids ?? []).includes(e.exercise_environment_id))} value={plan.exercise_environments_ids} onChange={(v) => setPlanField('exercise_environments_ids', v)} getValue={(e) => e.exercise_environment_id} getLabel={(e) => e.name_ptbr} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Equipamentos</label>
              <ChipMultiSelect options={lookups?.exercise_equipments ?? []} value={plan.exercise_equipment_ids} onChange={(v) => setPlanField('exercise_equipment_ids', v)} getValue={(eq) => eq.exercise_equipment_id} getLabel={(eq) => eq.name_ptbr} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Nível</label>
              <select value={plan.exercise_level_id ?? ''} onChange={(e) => setPlanField('exercise_level_id', e.target.value)} style={inputStyle}>
                <option value="">— Selecione —</option>
                {(lookups?.exercise_levels ?? []).map((l) => <option key={l.id} value={l.exercise_level_id}>{l.name_ptbr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Dias / semana</label>
              <input type="number" min="1" max="7" value={plan.days_per_week} onChange={(e) => setPlanField('days_per_week', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Duração (min)</label>
              <input type="number" value={plan.duration_minutes} onChange={(e) => setPlanField('duration_minutes', e.target.value)} placeholder="Ex: 50" style={inputStyle} />
            </div>
          </div>
        </div>
      ) : (
        /* BARRA RESUMO DE CONFIGURAÇÕES (visível quando recolhido) */
        <div
          onClick={() => setSettings(true)}
          style={{
            flexShrink: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 24px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: 'pointer',
          }}
          title="Clique para expandir as configurações"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', flexShrink: 0 }}>
              Configurações:
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {planSettingsSummary}
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Editar ▼
          </span>
        </div>
      )}

      {/* DIAS DO TREINO */}
      <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
        {days.map((d) => (
          <button key={d} onClick={() => setDay(d)} style={dayStyle(d === day)}>
            Dia {d}
          </button>
        ))}
      </div>

      {/* SEGMENTED TAB SWITCHER PARA DISPOSITIVOS MÓVEIS (<= 768px / 360px) */}
      <div className="yb-mobile-toggle-bar" style={{ marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => setMobileTab('slots')}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: mobileTab === 'slots' ? 'var(--surface)' : 'transparent',
            color: mobileTab === 'slots' ? 'var(--text)' : 'var(--muted)',
            boxShadow: mobileTab === 'slots' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
          }}
        >
          Ficha do Dia ({currentSlots.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('library')}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: mobileTab === 'library' ? 'var(--surface)' : 'transparent',
            color: mobileTab === 'library' ? 'var(--text)' : 'var(--muted)',
            boxShadow: mobileTab === 'library' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
          }}
        >
          + Adicionar Exercício ({filteredExercises.length})
        </button>
      </div>

      {/* CORPO DO CONSTRUTOR: ASIDE (BIBLIOTECA COM FILTROS) + MAIN (FICHA) */}
      <div className="yb-creator-body">
        {/* ASIDE: BIBLIOTECA DE EXERCÍCIOS */}
        <aside className="yb-creator-aside">
          {/* TOPO DA BIBLIOTECA: BUSCA + TOGGLE DE FILTROS RECOLHÍVEIS */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Biblioteca de Exercícios
              </p>
              <button
                type="button"
                onClick={() => setFilterSectionOpen(o => !o)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: hasActiveFilters ? 'var(--brand)' : 'var(--muted)', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px'
                }}
                title={filterSectionOpen ? 'Recolher filtros' : 'Expandir filtros'}
              >
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontSize: '10px', fontWeight: 900 }}>
                    {activeFilterCount}
                  </span>
                )}
                <span>{filterSectionOpen ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* CAMPO DE BUSCA TEXTUAL COM BOTÃO LIMPAR */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                placeholder="Buscar por nome ou código…"
                style={{ ...inputStyle, paddingRight: exSearch ? '30px' : '12px' }}
              />
              {exSearch && (
                <button
                  type="button"
                  onClick={() => setExSearch('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', fontWeight: 700 }}
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            {/* SEÇÃO RECOLHIDA: FILTRO EM USO SEMPRE VISÍVEL QUANDO RECOLHIDO (ex: "Grupo muscular: Peito, Costas") */}
            {!filterSectionOpen && hasActiveFilters && (
              <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Filtros ativos:
                  </span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    Limpar tudo
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeFilterSummaries.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)', border: '1px solid rgba(245,95,22,.25)'
                      }}
                    >
                      <span>{f.label}</span>
                      <button
                        type="button"
                        onClick={f.onRemove}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '11px', padding: '0 2px', lineHeight: 1 }}
                        title="Remover filtro"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO EXPANDIDA: SELETORES RECOLHÍVEIS DE GRUPO MUSCULAR, EQUIPAMENTO E NÍVEL */}
            {filterSectionOpen && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                {/* 1. GRUPO MUSCULAR */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Grupo Muscular
                    </label>
                    {selectedMuscles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedMuscles([])}
                        style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Limpar ({selectedMuscles.length})
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '110px', overflowY: 'auto' }}>
                    {muscleGroupOptions.map((mg) => {
                      const count = exerciseCountByMuscle.get(mg.muscle_group_id) ?? 0;
                      const isSel = selectedMuscles.includes(mg.muscle_group_id);
                      return (
                        <button
                          key={mg.muscle_group_id}
                          type="button"
                          onClick={() => toggleMuscle(mg.muscle_group_id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: isSel ? 800 : 600, border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                            background: isSel ? 'var(--brand)' : 'var(--field)', color: isSel ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit'
                          }}
                        >
                          <span>{mg.name_ptbr}</span>
                          <span style={{ fontSize: '9.5px', opacity: isSel ? .95 : .6, fontWeight: 700 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. EQUIPAMENTO */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Equipamento
                    </label>
                    {selectedEquipments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedEquipments([])}
                        style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Limpar ({selectedEquipments.length})
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '90px', overflowY: 'auto' }}>
                    {equipmentOptions.map((eq) => {
                      const count = exerciseCountByEquipment.get(eq.exercise_equipment_id) ?? 0;
                      const isSel = selectedEquipments.includes(eq.exercise_equipment_id);
                      return (
                        <button
                          key={eq.exercise_equipment_id}
                          type="button"
                          onClick={() => toggleEquipment(eq.exercise_equipment_id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: isSel ? 800 : 600, border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                            background: isSel ? 'var(--brand)' : 'var(--field)', color: isSel ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit'
                          }}
                        >
                          <span>{eq.name_ptbr}</span>
                          <span style={{ fontSize: '9.5px', opacity: isSel ? .95 : .6, fontWeight: 700 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. NÍVEL DE DIFICULDADE */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Nível
                    </label>
                    {selectedLevel && (
                      <button
                        type="button"
                        onClick={() => setSelectedLevel('')}
                        style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {levelOptions.map((lvl) => {
                      const count = exerciseCountByLevel.get(lvl.exercise_level_id) ?? 0;
                      const isSel = selectedLevel === lvl.exercise_level_id;
                      return (
                        <button
                          key={lvl.exercise_level_id}
                          type="button"
                          onClick={() => setSelectedLevel(isSel ? '' : lvl.exercise_level_id)}
                          style={{
                            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px', borderRadius: '7px', fontSize: '11px', fontWeight: isSel ? 800 : 600, border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                            background: isSel ? 'var(--brand)' : 'var(--field)', color: isSel ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap'
                          }}
                        >
                          <span>{lvl.name_ptbr}</span>
                          <span style={{ fontSize: '9.5px', opacity: isSel ? .95 : .6, fontWeight: 700 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BOTÃO LIMPAR TODOS OS FILTROS */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{ padding: '7px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ✕ Limpar todos os filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* BARRA DE CONTAGEM DE RESULTADOS & BOTÃO LIMPAR */}
          <div style={{ padding: '8px 16px', background: 'var(--field)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted)' }}>
            <span>
              <strong style={{ color: 'var(--text)' }}>{filteredExercises.length}</strong> {filteredExercises.length === 1 ? 'exercício' : 'exercícios'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 800, fontSize: '11px', padding: 0 }}
              >
                Limpar
              </button>
            )}
          </div>

          {/* LISTA DE EXERCÍCIOS ENCONTRADOS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredExercises.map((ex) => {
              const muscleNames = (ex.muscle_groups_ids ?? []).map(m => muscleGroupMap.get(m) || m).slice(0, 2);
              return (
                <div
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '11px', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color .15s' }}
                  title="Clique para adicionar à ficha do dia"
                >
                  <ExerciseThumb sources={thumbSources(ex.image_url)} label={ex.name_ptbr} width={44} height={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ex.name_ptbr}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0 0', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted)', fontFamily: 'monospace' }}>{ex.exercise_id}</span>
                      {muscleNames.length > 0 && (
                        <span style={{ fontSize: '10.5px', color: 'var(--brand)', fontWeight: 600 }}>· {muscleNames.join(', ')}</span>
                      )}
                    </div>
                    <div style={{ marginTop: '4px' }}><EnvironmentTag environments={ex.environments} labels={ex.environments_label_ptbr} small /></div>
                  </div>
                  <button
                    type="button"
                    style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    +
                  </button>
                </div>
              );
            })}

            {filteredExercises.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--muted)', fontSize: '12.5px' }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Nenhum exercício encontrado</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', border: 'none', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN: FICHA DO DIA */}
        <main className="yb-creator-main">
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>Dia {day}</h2>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                  {currentSlots.length} exercícios na ficha
                  {dayMuscleGroups.length > 0 && (
                    <span style={{ display: 'inline-block', marginLeft: '6px', color: 'var(--text)', fontWeight: 600 }}>
                      · Foco: {dayMuscleGroups.join(', ')}
                    </span>
                  )}
                </p>
              </div>
              {/* Botão de alternância rápido para mobile */}
              <button
                type="button"
                className="yb-mobile-toggle-bar"
                onClick={() => setMobileTab('library')}
                style={{ display: 'none', background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                + Adicionar exercício
              </button>
            </div>

            {/* LISTA DE SLOTS DO DIA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentSlots.map((s, i) => (
                <div key={s.uniqueId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--field)' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <ExerciseThumb sources={thumbSources(s.exercise?.image_url)} label={s.exercise?.name_ptbr ?? s.exercise_id} width={44} height={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.exercise?.name_ptbr ?? s.exercise_id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(s.uniqueId)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '15px' }}
                      title="Remover exercício da ficha"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="yb-sets-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Séries</label>
                      <input type="number" min="1" value={s.sets} onChange={(e) => updateSlot(s.uniqueId, 'sets', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Reps</label>
                      <input type="number" min="1" value={s.reps} onChange={(e) => updateSlot(s.uniqueId, 'reps', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Descanso (s)</label>
                      <input type="number" min="0" step="5" value={s.rest_seconds ?? ''} onChange={(e) => updateSlot(s.uniqueId, 'rest_seconds', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                    </div>
                    {usesKg(s.exercise) ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Carga (kg)</label>
                        <input type="number" min="0" step="0.5" value={s.load_kg ?? ''} onChange={(e) => updateSlot(s.uniqueId, 'load_kg', e.target.value)} placeholder="a definir" data-load-input="true" style={{ ...inputStyle, textAlign: 'center' }} />
                      </div>
                    ) : (
                      <div data-load-hidden={s.exercise?.load_type}>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Carga</label>
                        <p style={{ margin: 0, padding: '9px 4px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>{NO_KG_HINT[s.exercise?.load_type]} · sem kg</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentSlots.length === 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 18px', border: '2px dashed var(--border)', borderRadius: '14px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📋</span>
                <p style={{ margin: 0, fontWeight: 700 }}>A ficha do dia {day} está vazia.</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Busque e filtre exercícios na biblioteca para adicionar a este dia.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
