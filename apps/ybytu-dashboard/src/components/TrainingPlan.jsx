import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trainingService } from '../services/trainingService.js';

const DAY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export default function TrainingPlan() {
  const { id } = useParams();
  const [theme, setTheme] = useState('dark');
  const [plan, setPlan] = useState(null);
  const [isMolde, setIsMolde] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [slots, setSlots] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [lk, data] = await Promise.all([
          trainingService.getLookups(),
          trainingService.getById(id),
        ]);
        if (cancelled) return;
        setLookups(lk);
        setPlan(data.training_plan);
        setIsMolde(data.is_molde);
        setUsersCount(data.users_count ?? 0);
        setSlots(data.slots ?? []);
        const days = [...new Set((data.slots ?? []).map((s) => s.day_number ?? 1))].sort((a, b) => a - b);
        setDay(days[0] ?? 1);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar plano de treino');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const goalName = useMemo(() => {
    const map = new Map();
    (lookups?.goals ?? []).forEach((g) => map.set(g.goal_id, g.name_ptbr));
    return map;
  }, [lookups]);
  const envName = useMemo(() => {
    const map = new Map();
    (lookups?.exercise_environments ?? []).forEach((e) => map.set(e.exercise_environment_id, e.name_ptbr));
    return map;
  }, [lookups]);
  const levelName = useMemo(() => {
    const map = new Map();
    (lookups?.exercise_levels ?? []).forEach((l) => map.set(l.exercise_level_id, l.name_ptbr));
    return map;
  }, [lookups]);
  const equipName = useMemo(() => {
    const map = new Map();
    (lookups?.exercise_equipments ?? []).forEach((e) => map.set(e.exercise_equipment_id, e.name_ptbr));
    return map;
  }, [lookups]);

  const days = useMemo(() => [...new Set(slots.map((s) => s.day_number ?? 1))].sort((a, b) => a - b), [slots]);

  const daySlots = useMemo(() => slots
    .filter((s) => (s.day_number ?? 1) === day)
    .sort((a, b) => (a.order_within_day ?? 0) - (b.order_within_day ?? 0)),
  [slots, day]);

  const dayTotalSets = daySlots.reduce((acc, s) => acc + (Number(s.sets) || 0), 0);

  const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark');

  if (loading) return <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Carregando…</main>;
  if (error) return <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error}</main>;
  if (!plan) return null;

  const goals = (plan.goals_ids ?? []).map((g) => goalName.get(g) ?? g);
  const envs = (plan.exercise_environments_ids ?? []).map((e) => envName.get(e) ?? e);
  const equips = (plan.exercise_equipment_ids ?? []).map((e) => equipName.get(e) ?? e);
  const langs = [
    { code: 'PT', has: !!plan.name_ptbr },
    { code: 'EN', has: !!plan.name_en },
    { code: 'FR', has: !!plan.name_fr },
  ].filter((l) => l.has);
  const createdAt = plan.created_at ? new Date(plan.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <Link to="/trainings" style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <Link to="/trainings" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Planos</Link><span>/</span><span style={{ color: 'var(--text)' }}>Detalhe</span>
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.name_ptbr}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            disabled
            title="Atribuição direta de plano ainda não existe no app — precisa ser construída (fluxo de atribuição a usuário)"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'not-allowed', fontFamily: 'inherit', opacity: 0.6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6M22 11h-6"></path></svg> Atribuir
          </button>
          <Link to={`/training-creator/${plan.id}`} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg> Editar
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

          {/* Hero */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '22px' }}>
            <div style={{ background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', padding: '28px', position: 'relative', overflow: 'hidden', color: '#fff' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {goals.map((g, i) => (
                    <span key={i} style={{ display: 'inline-flex', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(0,0,0,.25)' }}>{g}</span>
                  ))}
                  {envs.map((e, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(0,0,0,.25)' }}>{e}</span>
                  ))}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: 'rgba(255,255,255,.22)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: plan.is_active ? '#4ade80' : '#9C9C9C' }}></span> {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  {isMolde && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: 'rgba(255,255,255,.92)', color: '#F55F16' }}>Molde</span>
                  )}
                  {plan.created_by_ai && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', background: 'rgba(255,255,255,.92)', color: '#7c3aed' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M5.6 18.4l1.4-1.4M12 19v2M17 12h2M18.4 5.6 17 7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"></path></svg> Gerado por IA
                    </span>
                  )}
                </div>
                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 900, letterSpacing: '-.02em' }}>{plan.name_ptbr}</h1>
                {plan.instruction_ptbr && <p style={{ margin: '8px 0 0', fontSize: '15px', opacity: 0.94, maxWidth: '560px', lineHeight: 1.55 }}>{plan.instruction_ptbr}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {langs.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {langs.map((l) => (
                        <span key={l.code} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,.92)', color: '#1A202C' }}>{l.code}</span>
                      ))}
                    </div>
                  )}
                  {createdAt && <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>Criado em {createdAt}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', background: 'var(--surface)' }}>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Frequência</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>{plan.days_per_week ?? '—'}×/sem</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Duração/sessão</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>{plan.duration_minutes ?? '—'} min</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nível</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>{levelName.get(plan.exercise_level_id) ?? '—'}</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Exercícios</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>{slots.length}</p></div>
              <div style={{ padding: '18px', borderRight: '1px solid var(--border)' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Equipamentos</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900 }}>{equips[0] ? (equips.length > 1 ? `${equips[0]} +${equips.length - 1}` : equips[0]) : '—'}</p></div>
              <div style={{ padding: '18px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Usuários</p><p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 900, color: 'var(--brand)' }}>{usersCount}</p></div>
            </div>
          </div>

          {/* Day nav */}
          {days.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {days.map((d, i) => {
                const on = d === day;
                const dMuscles = [...new Set(slots.filter((s) => (s.day_number ?? 1) === d).flatMap((s) => s.exercise?.muscle_groups ?? []))];
                return (
                  <button key={d} onClick={() => setDay(d)} style={{ border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'), background: on ? 'var(--brand-soft)' : 'var(--surface)', color: on ? 'var(--brand)' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', padding: '10px 16px', borderRadius: '11px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 900 }}>{DAY_LETTERS[i] ?? d}</span>
                    <span style={{ opacity: 0.7, fontWeight: 600, marginLeft: '6px' }}>{dMuscles.join(', ') || `Dia ${d}`}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Day content */}
          {day !== null && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>Dia {days.indexOf(day) + 1}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{daySlots.length} exercícios · {dayTotalSets} séries totais</p>
                </div>
                {plan.duration_minutes && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~{plan.duration_minutes} min
                  </span>
                )}
              </div>
              <div>
                {daySlots.map((s, i) => (
                  <div key={s.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', flexShrink: 0 }}>{DAY_LETTERS[i] ?? i + 1}</span>
                    <div style={{ width: '64px', height: '46px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0, overflow: 'hidden' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{s.exercise?.name_ptbr ?? s.exercise_id}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{(s.exercise?.muscle_groups ?? []).join(', ') || '—'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '22px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{s.sets ?? '—'}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Séries</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{s.reps ?? '—'}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Reps</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{s.rest_seconds ? `${s.rest_seconds}s` : '—'}</p><p style={{ margin: '1px 0 0', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Desc.</p></div>
                    </div>
                  </div>
                ))}
                {daySlots.length === 0 && <p style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}>Nenhum exercício neste dia.</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
