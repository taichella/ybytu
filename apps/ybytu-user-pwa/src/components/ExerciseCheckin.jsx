import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { describeCheckinError } from '../lib/checkinErrors';
import '../checkin.css';

// Marcação por exercício (2026-10-15) — desenho: designs/AlunoTreinoCheckin.dc.html.
// Banco: completed_exercises + close_workout_session / reopen_workout_session
// (migration 20261015120000). Chave estável plano + dia + exercise_id.
//
// Regras do desenho:
// - marcar o último exercício fecha a sessão sozinho (com aviso se já houve
//   outro treino hoje);
// - desmarcar com a sessão aberta: 1 toque + "Desfazer" por 4s;
// - desmarcar depois do fechamento: confirmação "Deseja reabrir este treino?"
//   (o banco só reabre até 3h);
// - carga opcional, só em exercício com peso, pré-preenchida com a última
//   usada; só é gravada quando o aluno confirma (nunca grava o valor sugerido
//   como se ele tivesse usado);
// - linguagem separada: "Prescrito: X" x "✓ Registrado por você: Y".

const UNDO_MS = 4000;

function formatKg(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return null;
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

// "12,5 kg" -> 12.5 ; "a definir" / "Peso corporal" -> null
function prescribedKg(ex) {
  const m = String(ex?.load_display_ptbr || '').match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}

function formatMarkTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay ? `às ${time}` : `em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${time}`;
}

export function useExerciseCheckin({ payload, activeDay, completedWorkouts, setCompletedWorkouts, onError, onSessionExpired }) {
  const [marks, setMarks] = useState(payload?.exercise_marks || []);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // { title, text, confirmLabel, onConfirm }
  const [toast, setToast] = useState(null); // { text, onUndo }
  const [drafts, setDrafts] = useState({}); // exercise_id -> carga confirmada antes de marcar
  const toastTimer = useRef(null);

  useEffect(() => { setMarks(payload?.exercise_marks || []); }, [payload]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const planId = payload?.training?.id || null;
  const lastLoads = payload?.last_exercise_loads || {};
  const day = activeDay ? Number(activeDay.day_number) : null;
  const exercises = useMemo(() => activeDay?.exercises || [], [activeDay]);

  const dayWorkout = useMemo(
    () => completedWorkouts.find(cw => Number(cw.day_number) === day) || null,
    [completedWorkouts, day]
  );
  const dayMarks = useMemo(() => marks.filter(m => Number(m.day_number) === day), [marks, day]);
  const openMarks = useMemo(() => dayMarks.filter(m => !m.workout_id), [dayMarks]);
  // Fechado hoje e sem sessão nova aberta: mostra as marcações do treino fechado.
  const closed = !!dayWorkout && openMarks.length === 0;
  const visibleMarks = closed ? dayMarks.filter(m => m.workout_id === dayWorkout.id) : openMarks;
  const markByExercise = useMemo(() => new Map(visibleMarks.map(m => [m.exercise_id, m])), [visibleMarks]);
  const markedCount = exercises.filter(ex => markByExercise.has(ex.exercise_id)).length;

  const handleError = (err) => {
    const { kind, text } = describeCheckinError(err);
    if (kind === 'session_expired') { onSessionExpired(); return; }
    onError(text);
  };

  const showToast = (text, onUndo) => {
    clearTimeout(toastTimer.current);
    setToast({ text, onUndo });
    toastTimer.current = setTimeout(() => setToast(null), UNDO_MS);
  };

  async function doClose() {
    setBusy(true);
    try {
      const sessionTitle = activeDay.title_ptbr || activeDay.region_label_ptbr || `Treino Dia ${day}`;
      const { data, error } = await supabase.rpc('close_workout_session', {
        p_training_plan_id: planId, p_day_number: day, p_session_name: sessionTitle,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setCompletedWorkouts(prev => [row, ...prev]);
      setMarks(prev => prev.map(m => (Number(m.day_number) === day && !m.workout_id ? { ...m, workout_id: row.id } : m)));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  // Fecha a sessão; se já houve outro treino hoje, pergunta antes (sem bloquear).
  function closeSession() {
    if (!activeDay || !planId || closed) return;
    if (completedWorkouts.length > 0) {
      setDialog({
        title: 'Segunda sessão hoje',
        text: 'Você já concluiu um treino hoje. Deseja registrar este segundo treino no seu histórico?',
        confirmLabel: 'Sim, registrar',
        onConfirm: doClose,
      });
      return;
    }
    doClose();
  }

  async function insertMark(ex, loadKg) {
    const { data, error } = await supabase
      .from('completed_exercises')
      .insert({ training_plan_id: planId, day_number: day, exercise_id: ex.exercise_id, load_kg: loadKg ?? null })
      .select('id, day_number, exercise_id, load_kg, completed_at, workout_id')
      .single();
    if (error) throw error;
    return data;
  }

  async function mark(ex) {
    if (!planId || !ex.exercise_id || busy || closed) return;
    setBusy(true);
    let row = null;
    try {
      row = await insertMark(ex, drafts[ex.exercise_id]);
      setMarks(prev => [...prev, row]);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
    if (!row) return;
    // Último exercício marcado: fecha sozinho.
    const nowMarked = new Set([...openMarks.map(m => m.exercise_id), row.exercise_id]);
    if (exercises.length > 0 && exercises.every(e => nowMarked.has(e.exercise_id))) closeSession();
  }

  async function unmarkOpen(ex, m) {
    setBusy(true);
    try {
      const { error } = await supabase.from('completed_exercises').delete().eq('id', m.id);
      if (error) throw error;
      setMarks(prev => prev.filter(x => x.id !== m.id));
      showToast(`Exercício ${ex.order} desmarcado`, async () => {
        setToast(null);
        try {
          const back = await insertMark(ex, m.load_kg);
          setMarks(prev => [...prev, back]);
        } catch (err) {
          handleError(err);
        }
      });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  function unmarkClosed(ex, m) {
    setDialog({
      title: 'Deseja reabrir este treino?',
      text: `O treino de hoje já foi gravado. Ao desmarcar o exercício ${ex.order}, ele volta a ficar em andamento até você marcar de novo ou concluir.`,
      confirmLabel: 'Reabrir treino',
      onConfirm: async () => {
        setBusy(true);
        try {
          const { error } = await supabase.rpc('reopen_workout_session', { p_workout_id: dayWorkout.id });
          if (error) throw error;
          setCompletedWorkouts(prev => prev.filter(cw => cw.id !== dayWorkout.id));
          const { error: delErr } = await supabase.from('completed_exercises').delete().eq('id', m.id);
          if (delErr) throw delErr;
          setMarks(prev => prev
            .filter(x => x.id !== m.id)
            .map(x => (x.workout_id === dayWorkout.id ? { ...x, workout_id: null } : x)));
        } catch (err) {
          handleError(err);
        } finally {
          setBusy(false);
        }
      },
    });
  }

  function toggle(ex) {
    const m = markByExercise.get(ex.exercise_id);
    if (!m) return mark(ex);
    return closed ? unmarkClosed(ex, m) : unmarkOpen(ex, m);
  }

  // Carga confirmada: grava na marcação aberta ou guarda para quando marcar.
  async function confirmLoad(ex, value) {
    const kg = value === '' || value == null ? null : Math.max(0, Math.round(Number(value) * 100) / 100);
    const m = markByExercise.get(ex.exercise_id);
    if (m && !closed) {
      try {
        const { error } = await supabase.from('completed_exercises').update({ load_kg: kg }).eq('id', m.id);
        if (error) throw error;
        setMarks(prev => prev.map(x => (x.id === m.id ? { ...x, load_kg: kg } : x)));
      } catch (err) {
        handleError(err);
      }
    } else {
      setDrafts(prev => ({ ...prev, [ex.exercise_id]: kg }));
    }
  }

  // Duração real: da 1ª marcação ao fechamento (só com marcações).
  const durationMin = useMemo(() => {
    if (!closed || !dayWorkout?.completed_at || visibleMarks.length === 0) return null;
    const first = Math.min(...visibleMarks.map(m => new Date(m.completed_at).getTime()));
    const mins = Math.round((new Date(dayWorkout.completed_at).getTime() - first) / 60000);
    return mins > 0 ? mins : null;
  }, [closed, dayWorkout, visibleMarks]);

  return {
    closed, busy, markedCount, total: exercises.length, markByExercise, lastLoads, drafts, dayWorkout, durationMin,
    toggle, closeSession, confirmLoad,
    dialog, closeDialog: () => setDialog(null), toast,
  };
}

export function SessionProgress({ markedCount, total }) {
  if (!total) return null;
  const pct = Math.round((markedCount / total) * 100);
  const full = markedCount === total;
  return (
    <div className="ck-progress-box">
      <div className="ck-progress-label-row">
        <span style={{ fontWeight: 700, color: 'var(--yb-muted, #718096)' }}>Progresso da sessão</span>
        <span className={`ck-progress-counter${full ? ' full' : ''}`}>{markedCount}/{total}{markedCount > 0 ? ` · ${pct}%` : ''}</span>
      </div>
      <div className="ck-progress-track">
        <div className={`ck-progress-fill${full ? ' success' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadPanel({ ex, initial, fromLast, prescribed, onConfirm }) {
  const [value, setValue] = useState(initial ?? '');
  const step = (delta) => setValue(v => {
    const n = Number(String(v).replace(',', '.')) || 0;
    return String(Math.max(0, Math.round((n + delta) * 100) / 100));
  });
  const parsed = String(value).replace(',', '.');
  return (
    <div className="ck-load-panel">
      <div className="ck-load-header">
        <span style={{ fontWeight: 800 }}>Carga usada neste treino:</span>
        <span style={{ color: 'var(--yb-muted, #718096)', fontWeight: 600 }}>Opcional</span>
      </div>
      <div className="ck-load-header" style={{ justifyContent: 'flex-start' }}>
        {prescribed != null && <span>Prescrito pelo personal: <strong>{formatKg(prescribed)}</strong></span>}
        {fromLast != null && <span>Última usada: <strong>{formatKg(fromLast)}</strong></span>}
      </div>
      <div className="ck-stepper-row">
        <button type="button" className="ck-stepper-btn" onClick={() => step(-1)}>–1</button>
        <button type="button" className="ck-stepper-btn" onClick={() => step(-0.5)}>–0,5</button>
        <input
          className="ck-load-input"
          inputMode="decimal"
          value={String(value).replace('.', ',')}
          onChange={(e) => setValue(e.target.value.replace(/[^\d,.]/g, ''))}
          aria-label={`Carga usada em ${ex.name_ptbr}, em kg`}
        />
        <button type="button" className="ck-stepper-btn" onClick={() => step(0.5)}>+0,5</button>
        <button type="button" className="ck-stepper-btn" onClick={() => step(1)}>+1</button>
      </div>
      {fromLast != null && initial === fromLast && <p className="ck-load-note">Já vem preenchido com seu último registro.</p>}
      <button type="button" className="ck-load-confirm" onClick={() => onConfirm(parsed === '' ? null : Number(parsed))}>
        {parsed === '' || Number.isNaN(Number(parsed)) ? 'Sem carga' : `Confirmar ${formatKg(parsed)}`}
      </button>
    </div>
  );
}

// Cartão de um exercício com a caixa de marcar. children = miniatura (com o
// botão de vídeo) que o UserToday já monta.
export function ExerciseCheckinCard({ ex, checkin, thumb, onVideo, renderLoad }) {
  const [loadOpen, setLoadOpen] = useState(false);
  const m = checkin.markByExercise.get(ex.exercise_id);
  const checked = !!m;
  const weighted = ex.load_type === 'weighted';
  const prescribed = prescribedKg(ex);
  const last = checkin.lastLoads[ex.exercise_id]?.load_kg ?? null;
  const draft = checkin.drafts[ex.exercise_id];
  const logged = m?.load_kg ?? null;
  const suggestion = logged ?? draft ?? last ?? prescribed;
  const canToggle = !!ex.exercise_id && !checkin.busy;

  return (
    <article className={`ck-card${checked ? ' checked' : ''}`}>
      <div className="ck-top-row">
        <button
          type="button"
          className={`ck-check${checked ? ' checked' : ''}`}
          onClick={() => checkin.toggle(ex)}
          disabled={!canToggle}
          aria-pressed={checked}
          aria-label={checked ? `Desmarcar exercício ${ex.order}` : `Marcar exercício ${ex.order} como feito`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        {thumb}
        <div className="ck-meta-col">
          <h3 className="ck-title"><span className="ck-title-letter">{ex.order}</span> {ex.name_ptbr}</h3>
          <div className="ck-tags-row">
            {!checked && <span className="ck-pill prescribed">Prescrito: {ex.sets} séries × {ex.reps_ptbr || ex.reps}</span>}
            {weighted && prescribed != null
              ? <span className={`ck-pill ${checked ? 'prescribed' : 'pending-load'}`}>Prescrito: {formatKg(prescribed)}</span>
              : renderLoad(ex)}
            {checked && logged != null && <span className="ck-pill user-logged">✓ Registrado por você: {formatKg(logged)}</span>}
            {!checked && ex.rest_seconds > 0 && <span className="ck-pill">{ex.rest_seconds}s descanso</span>}
          </div>
          {checked && (
            <div className="ck-time-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Concluído por você {formatMarkTime(m.completed_at)}
            </div>
          )}
          {!checked && ex.instruction_ptbr && <div className="exercise-instructions">{ex.instruction_ptbr}</div>}
          <div className="ck-actions-row">
            {ex.video_url && (
              <button type="button" className="ck-vid-link" onClick={onVideo} aria-label={`Ver vídeo de ${ex.name_ptbr}`}>▶ Ver vídeo</button>
            )}
            {weighted && !checkin.closed && (
              <button type="button" className="ck-load-toggle" onClick={() => setLoadOpen(o => !o)} aria-expanded={loadOpen}>
                {checked ? 'Ajustar carga usada' : 'Anotar carga usada'}{suggestion != null ? ` (${formatKg(suggestion)})` : ''} {loadOpen ? '▴' : '▾'}
              </button>
            )}
          </div>
        </div>
      </div>
      {loadOpen && weighted && !checkin.closed && (
        <LoadPanel
          ex={ex}
          initial={suggestion}
          fromLast={last}
          prescribed={prescribed}
          onConfirm={(kg) => { checkin.confirmLoad(ex, kg); setLoadOpen(false); }}
        />
      )}
    </article>
  );
}

export function CheckinDialog({ dialog, onClose }) {
  if (!dialog) return null;
  return (
    <div className="ck-dialog-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ck-dialog-sheet" onClick={(e) => e.stopPropagation()}>
        <h4 className="ck-dialog-title">{dialog.title}</h4>
        <p className="ck-dialog-text">{dialog.text}</p>
        <div className="ck-dialog-actions">
          <button type="button" className="ck-dialog-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="ck-dialog-confirm" onClick={() => { onClose(); dialog.onConfirm(); }}>{dialog.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function UndoToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="ck-undo-toast" role="status">
      <span>{toast.text}</span>
      <button type="button" className="ck-undo-btn" onClick={toast.onUndo}>Desfazer</button>
    </div>
  );
}

// Aviso de treino fechado pelo sistema na virada do dia (2026-10-15): o aluno
// deixou a sessão aberta e, ao abrir o app no dia seguinte, vê o que
// aconteceu. Some com "Entendi" (lembrado neste aparelho; se o armazenamento
// falhar, o aviso só volta a aparecer, nada quebra).
const SEEN_KEY = 'ybytu_seen_auto_closed_workouts';

function readSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}

export function AutoClosedNotice({ workouts }) {
  const [seen, setSeen] = useState(readSeen);
  const pending = (workouts || []).filter(w => !seen.includes(w.id));
  if (pending.length === 0) return null;
  const w = pending[0];
  const when = new Date(w.completed_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const dismiss = () => {
    const next = [...seen, ...pending.map(p => p.id)];
    setSeen(next);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(next.slice(-50))); } catch { /* sem armazenamento: tudo bem */ }
  };
  return (
    <div className="ck-done-banner" role="status" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#1E3A8A', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span aria-hidden="true" style={{ fontSize: '18px' }}>🌙</span>
      <div style={{ flex: 1 }}>
        Seu treino de {when} ({w.session_name || `Dia ${w.day_number}`}) ficou em andamento e foi encerrado na virada do dia
        {w.exercises_done != null && w.exercise_count ? ` com ${w.exercises_done} de ${w.exercise_count} exercícios` : ''}.
        <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>
          Ele está no seu histórico como treino parcial. Hoje a marcação começa do zero.
        </div>
        <button type="button" onClick={dismiss} style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, color: '#1D4ED8', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}>
          Entendi
        </button>
      </div>
    </div>
  );
}
