import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { thumbSources } from '../lib/media';
import { readFunctionError } from '../lib/functionError';
import ExerciseThumb from './ExerciseThumb';
import YbytuLogo from './YbytuLogo';
import UserVideoModal from './UserVideoModal';
import { useExerciseCheckin, SessionProgress, ExerciseCheckinCard, CheckinDialog, UndoToast, AutoClosedNotice } from './ExerciseCheckin';
import { describeCheckinError } from '../lib/checkinErrors';
import { MealTracker, AllRegisteredNotice, MealCard, mealWithArticle } from './MealCheckin';
import '../user.css';

/**
 * Calcula o índice do próximo dia a exibir ao abrir a tela.
 * Regra do produto: O dia padrão ao abrir é o PRÓXIMO dia depois do último concluído.
 * Ninguém treina a mesma sessão duas vezes. Concluído o dia 3, abre no 4;
 * concluído o último do plano, volta ao 1 (índice 0).
 */
function calculateNextDayIndex(days, lastCompletedDayNumber) {
  if (!days || days.length === 0) return 0;
  if (lastCompletedDayNumber == null) return 0;

  const lastNum = Number(lastCompletedDayNumber);
  const foundIdx = days.findIndex(d => Number(d.day_number) === lastNum);

  if (foundIdx !== -1) {
    return (foundIdx + 1) % days.length;
  }

  const nextDayIdx = days.findIndex(d => Number(d.day_number) > lastNum);
  if (nextDayIdx !== -1) {
    return nextDayIdx;
  }

  return 0;
}

/**
 * Casa os check-ins de refeição de HOJE com as refeições do cardápio de um dia
 * pelo PRATO (meal_id), não pela posição (2026-10-15): se a nutricionista
 * reordenar ou editar o cardápio durante o dia, o ✓ continua no prato que o
 * aluno comeu. Prato repetido no mesmo dia: cada check-in marca um só lugar,
 * preferindo a mesma posição. Check-in antigo sem meal_id (antes de
 * 2026-10-04) cai na posição, como antes.
 * Devolve Map meal_order -> check-in.
 */
function matchMealCheckins(meals, completedMeals, dayOrder) {
  const result = new Map();
  const sameDay = completedMeals.filter(cm => Number(cm.day_order) === Number(dayOrder));
  const used = new Set();
  const claim = (cm, meal) => { result.set(Number(meal.meal_order), cm); used.add(cm.id); };
  // 1. mesmo prato na mesma posição
  for (const cm of sameDay) {
    const meal = meals.find(m => cm.meal_id && m.meal_id === cm.meal_id && Number(m.meal_order) === Number(cm.meal_order));
    if (meal && !result.has(Number(meal.meal_order))) claim(cm, meal);
  }
  // 2. mesmo prato em outra posição (cardápio reordenado)
  for (const cm of sameDay) {
    if (used.has(cm.id) || !cm.meal_id) continue;
    const meal = meals.find(m => m.meal_id === cm.meal_id && !result.has(Number(m.meal_order)));
    if (meal) claim(cm, meal);
  }
  // 3. check-in antigo, sem prato gravado: posição
  for (const cm of sameDay) {
    if (used.has(cm.id) || cm.meal_id) continue;
    const meal = meals.find(m => Number(m.meal_order) === Number(cm.meal_order) && !result.has(Number(m.meal_order)));
    if (meal) claim(cm, meal);
  }
  return result;
}

export default function UserToday({ mockPayload = null } = {}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!mockPayload);
  const [errorMessage, setErrorMessage] = useState(null);
  const [payload, setPayload] = useState(mockPayload);
  const [activeTab, setActiveTab] = useState('training'); // 'training' | 'nutrition'

  const initialDayIdx = useMemo(() => {
    if (!mockPayload) return 0;
    const days = mockPayload.training?.days || [];
    const workouts = mockPayload.activity_today?.completed_workouts || [];
    const lastDay = mockPayload.last_completed_workout?.day_number ?? workouts[0]?.day_number;
    return calculateNextDayIndex(days, lastDay);
  }, [mockPayload]);

  const [selectedDayIdx, setSelectedDayIdx] = useState(initialDayIdx);
  const [selectedMenuIdx, setSelectedMenuIdx] = useState(0);

  // Status de check-in de hoje
  const [completedWorkouts, setCompletedWorkouts] = useState(mockPayload?.activity_today?.completed_workouts || []);
  const [completedMeals, setCompletedMeals] = useState(mockPayload?.activity_today?.completed_meals || []);
  const [checkingInMeal, setCheckingInMeal] = useState({});
  const [checkinError, setCheckinError] = useState(null);
  // "Desfazer" por 4s depois de registrar refeição (2026-10-16), igual ao do
  // treino. O banco só deixa desfazer no mesmo dia, no fuso do aluno
  // (unmark_meal, migration 20261015190000).
  const [mealToast, setMealToast] = useState(null);
  const mealToastTimer = useRef(null);
  useEffect(() => () => clearTimeout(mealToastTimer.current), []);

  // Modal de vídeo
  const [activeVideo, setActiveVideo] = useState(null); // { url, title }

  // 1. Carrega plano do usuário autenticado
  useEffect(() => {
    if (mockPayload) return;
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/login', { replace: true });
          return;
        }

        // Envia o fuso local do navegador via query param (?timezone=...)
        // Mantém os headers padronizados do CORS sem exigir x-timezone no Allow-Headers
        const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
        const { data, error } = await supabase.functions.invoke(`ybytu-get-user-plan?timezone=${encodeURIComponent(clientTz)}`);

        if (cancelled) return;

        // Em resposta não-2xx o supabase-js devolve data=null e o status HTTP só
        // em error.context (Response) -- error.status não existe e a mensagem é
        // genérica ("non-2xx status code"), então as checagens antigas nunca batiam.
        const httpStatus = error?.context?.status;

        // Trata erro de autorização
        if (httpStatus === 401) {
          await supabase.auth.signOut();
          navigate('/login', { replace: true });
          return;
        }

        // Plano não encontrado (404) ou ainda sem parecer dos profissionais
        // (regra de aprovação no servidor) -> tela "Plano em Preparação"
        if (httpStatus === 404 || data?.awaiting_review) {
          navigate('/bloqueio', { replace: true });
          return;
        }

        // Trata qualquer erro (mesmo com HTTP 200 e success: false)
        if (error || !data || data.success === false || data.error) {
          // Não-2xx: o motivo ({ error, message }) está no corpo da resposta;
          // error.message é sempre o genérico "non-2xx" (mesmo conserto do login).
          const { body } = error ? await readFunctionError(error) : { body: null };
          if (cancelled) return;
          const info = body || data;
          setErrorMessage(info?.message || 'Não foi possível carregar seu plano no momento. Tente novamente em instantes.');
          return;
        }

        setPayload(data);
        const todayWorkouts = data.activity_today?.completed_workouts || [];
        setCompletedWorkouts(todayWorkouts);
        setCompletedMeals(data.activity_today?.completed_meals || []);

        // Define o dia padrão ao abrir: o PRÓXIMO dia depois do último concluído
        // Ordem estrita de precedência:
        // 1. data.last_completed_workout?.day_number (último treino concluído no plano ativo)
        // 2. todayWorkouts[0]?.day_number (se concluído hoje)
        // 3. Fallback: null -> calculateNextDayIndex retorna 0 (Dia 1, indicando plano novo)
        const lastCompletedDay = data.last_completed_workout?.day_number ?? todayWorkouts[0]?.day_number ?? null;

        const days = data.training?.days || [];
        const nextDayIdx = calculateNextDayIndex(days, lastCompletedDay);
        setSelectedDayIdx(nextDayIdx);

      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || 'Falha de comunicação com o servidor.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();
    return () => { cancelled = true; };
  }, [navigate]);

  // Lista de dias de treino
  const trainingDays = useMemo(() => {
    return payload?.training?.days || [];
  }, [payload]);

  const activeDay = trainingDays[selectedDayIdx] || trainingDays[0] || null;

  // Lista de cardápios de nutrição
  const nutritionMenus = useMemo(() => {
    return payload?.nutrition?.menus || [];
  }, [payload]);

  const activeMenu = nutritionMenus[selectedMenuIdx] || nutritionMenus[0] || null;

  // Verifica se o dia atual já teve check-in realizado hoje
  const isWorkoutCompletedToday = useMemo(() => {
    if (!activeDay) return false;
    return completedWorkouts.some(cw => Number(cw.day_number) === Number(activeDay.day_number));
  }, [completedWorkouts, activeDay]);

  const completedWorkoutTimestamp = useMemo(() => {
    if (!activeDay) return null;
    const match = completedWorkouts.find(cw => Number(cw.day_number) === Number(activeDay.day_number));
    if (!match?.completed_at) return null;
    const d = new Date(match.completed_at);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, [completedWorkouts, activeDay]);

  // Check-in do treino: marcação por exercício + "Concluir treino" (2026-10-15).
  // As duas fecham a sessão pela mesma função do banco (close_workout_session),
  // que liga as marcações abertas ao treino gravado. O aviso de 2ª sessão no
  // dia virou diálogo do app (antes era window.confirm).
  const checkin = useExerciseCheckin({
    payload,
    activeDay,
    completedWorkouts,
    setCompletedWorkouts,
    onError: (text) => setCheckinError(`Treino não registrado. ${text}`),
    onSessionExpired: async () => {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    },
  });

  const handleCheckinWorkout = () => {
    if (!activeDay || isWorkoutCompletedToday) return;
    setCheckinError(null);
    if (!payload?.training?.id) {
      setCheckinError('Não foi possível identificar o plano de treino ativo para registrar o check-in. Atualize a página e tente novamente.');
      return;
    }
    checkin.closeSession();
  };

  // Check-in de Refeição
  const handleCheckinMeal = async (meal, dayOrder, { silent = false } = {}) => {
    const mealKey = `${dayOrder}_${meal.meal_order}`;
    setCheckinError(null);

    const mealPlanId = payload?.nutrition?.id || null;
    if (!mealPlanId) {
      setCheckinError('Não foi possível identificar o plano alimentar ativo para registrar a refeição. Atualize a página e tente novamente.');
      return;
    }

    setCheckingInMeal(prev => ({ ...prev, [mealKey]: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const mealName = meal.meal_name_ptbr || meal.name_ptbr || `Refeição ${meal.meal_order}`;

      const { data: inserted, error: insertErr } = await supabase
        .from('completed_meals')
        .insert({
          user_id: user.id,
          meal_plan_id: mealPlanId,
          day_order: Number(dayOrder),
          meal_order: Number(meal.meal_order),
          meal_name: mealName,
        })
        .select('id, day_order, meal_order, meal_name, meal_id, completed_at')
        .single();

      if (insertErr) throw insertErr;

      setCompletedMeals(prev => [inserted, ...prev]);
      if (silent) return;
      clearTimeout(mealToastTimer.current);
      setMealToast({
        text: `Refeição registrada: ${mealName}`,
        onUndo: async () => {
          clearTimeout(mealToastTimer.current);
          setMealToast(null);
          const { error: undoErr } = await supabase.rpc('unmark_meal', { p_completed_meal_id: inserted.id });
          if (undoErr) {
            const { kind, text } = describeCheckinError(undoErr);
            if (kind === 'session_expired') {
              await supabase.auth.signOut();
              navigate('/login', { replace: true });
              return;
            }
            setCheckinError(`Registro não desfeito. ${text}`);
            return;
          }
          setCompletedMeals(prev => prev.filter(cm => cm.id !== inserted.id));
        },
      });
      mealToastTimer.current = setTimeout(() => setMealToast(null), 4000);
    } catch (err) {
      const { kind, text } = describeCheckinError(err);
      if (kind === 'session_expired') {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
        return;
      }
      setCheckinError(kind === 'plan_changed' ? text : `Refeição não registrada. ${text}`);
    } finally {
      setCheckingInMeal(prev => ({ ...prev, [mealKey]: false }));
    }
  };

  // "Desfazer registro" no rodapé do cartão (desenho AlunoAlimentacaoCheckin):
  // para quando o aluno percebe o engano depois, ainda no mesmo dia. O aviso
  // "Registro do jantar removido" deixa refazer por 4s (um registro novo, com a
  // hora de agora -- o banco sempre grava a hora do servidor).
  const handleUndoMeal = async (meal, match, dayOrder) => {
    setCheckinError(null);
    const mealKey = `${dayOrder}_${meal.meal_order}`;
    setCheckingInMeal(prev => ({ ...prev, [mealKey]: true }));
    try {
      const { error } = await supabase.rpc('unmark_meal', { p_completed_meal_id: match.id });
      if (error) throw error;
      setCompletedMeals(prev => prev.filter(cm => cm.id !== match.id));
      clearTimeout(mealToastTimer.current);
      setMealToast({
        text: `Registro ${mealWithArticle(meal.name_ptbr)} removido`,
        onUndo: async () => {
          clearTimeout(mealToastTimer.current);
          setMealToast(null);
          await handleCheckinMeal(meal, dayOrder, { silent: true });
        },
      });
      mealToastTimer.current = setTimeout(() => setMealToast(null), 4000);
    } catch (err) {
      const { kind, text } = describeCheckinError(err);
      if (kind === 'session_expired') {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
        return;
      }
      setCheckinError(`Registro não desfeito. ${text}`);
    } finally {
      setCheckingInMeal(prev => ({ ...prev, [mealKey]: false }));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  // Formatação de data no topo
  const todayFormatted = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  // Regra de Carga estrita (lê load_display_ptbr do servidor: '12,5 kg' | 'Peso corporal' | 'Elástico' | 'a definir')
  const renderExerciseLoad = (ex) => {
    const text = ex.load_display_ptbr || (
      ex.load_type === 'bodyweight' ? 'Peso corporal' :
      ex.load_type === 'band' ? 'Elástico' : 'Carga a definir'
    );
    const isSpecial = ex.load_type === 'bodyweight' || ex.load_type === 'band';
    return (
      <span className={`exercise-stat-tag ${isSpecial ? '' : 'load'}`}>
        {text === 'a definir' ? 'Carga a definir' : text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="user-pwa-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <YbytuLogo size={40} />
        <span style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: 'var(--yb-muted, #718096)' }}>
          Carregando seu plano…
        </span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="user-pwa-container" style={{ padding: '24px 16px', justifyContent: 'center' }}>
        <div className="user-card" style={{ textAlign: 'center' }}>
          <div className="user-error-banner" style={{ justifyContent: 'center' }}>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="checkin-btn primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '12px' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const studentName = payload?.profile?.name?.trim() || null;
  const firstName = studentName ? studentName.split(' ')[0] : null;
  const monogram = studentName ? studentName[0].toUpperCase() : 'Y';

  return (
    <div className="user-pwa-container">
      
      {/* Header Fixo do Usuário */}
      <header className="user-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div className="user-avatar-badge" aria-hidden="true">
            {monogram}
          </div>
          <div className="user-header-title" style={{ minWidth: 0 }}>
            <span className="user-kicker">{todayFormatted}</span>
            <h1 className="user-name-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firstName ? `Olá, ${firstName}!` : 'Bem-vindo(a)'}
            </h1>
          </div>
        </div>

        <div className="user-header-actions">
          <button
            type="button"
            className="user-icon-btn"
            onClick={handleLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Seletor de Categoria: Treino vs Nutrição */}
      <nav className="user-tabs" aria-label="Abas de conteúdo">
        <button
          type="button"
          className={`user-tab-btn ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => { setActiveTab('training'); setCheckinError(null); }}
        >
          <span aria-hidden="true">🏋️</span> Treino de Hoje
        </button>
        <button
          type="button"
          className={`user-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => { setActiveTab('nutrition'); setCheckinError(null); }}
        >
          <span aria-hidden="true">🥗</span> Alimentação
        </button>
      </nav>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      <main className="user-main-content">
        {/* Banner de Erro Visível de Check-in */}
        {checkinError && (
          <div className="user-error-banner" role="alert" style={{ marginBottom: '16px' }}>
            <svg className="user-error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ flex: 1 }}>{checkinError}</span>
            <button
              type="button"
              onClick={() => setCheckinError(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px', fontSize: '14px', fontWeight: 'bold' }}
              title="Fechar"
              aria-label="Fechar mensagem de erro"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* -------------------- ABA 1: TREINO -------------------- */}
        {activeTab === 'training' && (
          <>
            {trainingDays.length === 0 ? (
              <div className="user-card" style={{ textAlign: 'center', color: 'var(--yb-muted, #718096)' }}>
                Nenhum treino disponível no seu plano ativo.
              </div>
            ) : (
              <>
                {/* Se houver múltiplos dias no split, permite alternar */}
                {trainingDays.length > 1 && (
                  <div className="day-selector-scroll">
                    {trainingDays.map((d, idx) => (
                      <button
                        key={d.day_number}
                        type="button"
                        className={`day-chip ${selectedDayIdx === idx ? 'active' : ''}`}
                        onClick={() => setSelectedDayIdx(idx)}
                      >
                        Dia {d.day_number} {d.region_label_ptbr ? `· ${d.region_label_ptbr}` : ''}
                      </button>
                    ))}
                  </div>
                )}

                <AutoClosedNotice workouts={payload?.auto_closed_workouts} />

                {/* Resumo da Sessão */}
                {activeDay && (
                  <div className="workout-summary-card">
                    <span className="workout-session-badge">
                      {activeDay.region_label_ptbr || `Dia ${activeDay.day_number}`}
                    </span>
                    <h2 className="workout-session-title">
                      {activeDay.title_ptbr || `Treino Dia ${activeDay.day_number}`}
                    </h2>
                    <div className="workout-meta-row">
                      {activeDay.estimated_minutes && (
                        <span className="workout-meta-item">
                          ⏱ ~{activeDay.estimated_minutes} min
                        </span>
                      )}
                      {activeDay.exercises && (
                        <span className="workout-meta-item">
                          🎯 {activeDay.exercises.length} exercícios
                        </span>
                      )}
                      {activeDay.weekday_ptbr && (
                        <span className="workout-meta-item">
                          📅 {activeDay.weekday_ptbr}
                        </span>
                      )}
                    </div>
                    <SessionProgress markedCount={checkin.markedCount} total={checkin.total} />
                  </div>
                )}

                {/* Avisos de Cautela do Dia */}
                {activeDay?.adapted_note_ptbr && (
                  <div className="caution-alert-card">
                    <span style={{ fontSize: '15px' }} aria-hidden="true">⚠️</span>
                    <div>{activeDay.adapted_note_ptbr}</div>
                  </div>
                )}

                {/* Nota de Slot Pulado (Mensagem amigável para o usuário) */}
                {activeDay?.skipped_note_ptbr && (
                  <div className="caution-alert-card" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#1D4ED8' }}>
                    <span aria-hidden="true">ℹ️</span>
                    <div>{activeDay.skipped_note_ptbr}</div>
                  </div>
                )}

                {/* Lista de Exercícios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeDay?.exercises?.map((ex, idx) => (
                    <ExerciseCheckinCard
                      key={ex.exercise_id || ex.id || idx}
                      ex={ex}
                      checkin={checkin}
                      onVideo={() => setActiveVideo({ url: ex.video_url, title: ex.name_ptbr })}
                      renderLoad={renderExerciseLoad}
                      thumb={(
                        <div className="exercise-thumb-wrap">
                          <ExerciseThumb
                            sources={[ex.image_thumb_url, ex.image_url, ...thumbSources(ex.image_url)].filter(Boolean)}
                            label={ex.name_ptbr}
                            width={50}
                            height={50}
                            radius={10}
                          />
                          {ex.video_url && (
                            <button
                              type="button"
                              className="exercise-play-badge"
                              onClick={() => setActiveVideo({ url: ex.video_url, title: ex.name_ptbr })}
                              title="Assistir execução"
                              aria-label={`Assistir execução do exercício ${ex.name_ptbr}`}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    />
                  ))}
                </div>

                {/* BOTÃO DE CHECK-IN DO TREINO */}
                <div style={{ marginTop: '8px' }}>
                  {isWorkoutCompletedToday && checkin.closed && (
                    <div className="ck-done-banner" style={{ marginBottom: '10px' }}>
                      <span aria-hidden="true" style={{ fontSize: '20px' }}>🎉</span>
                      <div>
                        Treino concluído e gravado no seu histórico.
                        <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                          {checkin.markedCount === checkin.total
                            ? `Todos os ${checkin.total} exercícios concluídos`
                            : `${checkin.markedCount} de ${checkin.total} exercícios marcados`}
                          {checkin.durationMin ? ` · ⏱ ${checkin.durationMin} min realizados` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                  {isWorkoutCompletedToday ? (
                    <div className="checkin-btn done">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Treino concluído hoje{completedWorkoutTimestamp ? ` às ${completedWorkoutTimestamp}` : ''}!
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="checkin-btn primary"
                      disabled={checkin.busy}
                      onClick={handleCheckinWorkout}
                    >
                      {checkin.busy ? (
                        'Registrando…'
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {checkin.markedCount > 0
                            ? `Concluir treino inteiro agora (${checkin.total - checkin.markedCount} ${checkin.total - checkin.markedCount === 1 ? 'restante' : 'restantes'})`
                            : 'Concluir Treino de Hoje'}
                        </>
                      )}
                    </button>
                  )}
                  {!isWorkoutCompletedToday && checkin.markedCount === 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--yb-muted, #718096)', textAlign: 'center' }}>
                      Opção para quem não quer marcar exercício por exercício.
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* -------------------- ABA 2: NUTRIÇÃO -------------------- */}
        {activeTab === 'nutrition' && (
          <>
            {nutritionMenus.length === 0 ? (
              <div className="user-card" style={{ textAlign: 'center', color: 'var(--yb-muted, #718096)' }}>
                Nenhum plano alimentar cadastrado no momento.
              </div>
            ) : (
              <>
                {/* Seletor de Cardápios (permite alternar entre os menus disponíveis) */}
                {nutritionMenus.length > 1 && (
                  <div className="day-selector-scroll">
                    {nutritionMenus.map((m, idx) => (
                      <button
                        key={m.menu_day}
                        type="button"
                        className={`day-chip ${selectedMenuIdx === idx ? 'active' : ''}`}
                        onClick={() => setSelectedMenuIdx(idx)}
                      >
                        Cardápio {m.menu_day}
                      </button>
                    ))}
                  </div>
                )}

                {/* Resumo do cardápio: metas do plano (referência) + contador do dia
                    sem fração nem porcentagem, com uma bolinha por refeição do
                    cardápio (designs/AlunoAlimentacaoCheckin.dc.html). */}
                {activeMenu && (() => {
                  const matches = matchMealCheckins(activeMenu.meals || [], completedMeals, activeMenu.menu_day);
                  const dots = (activeMenu.meals || []).map(m => matches.has(Number(m.meal_order)));
                  const allRegistered = dots.length > 0 && dots.every(Boolean);
                  const macros = payload?.nutrition?.macro_distribution;
                  return (
                    <>
                      <div className="workout-summary-card" style={{ background: 'linear-gradient(140deg, rgba(5, 150, 105, 0.07) 0%, rgba(5, 150, 105, 0.02) 100%)', borderColor: 'rgba(5, 150, 105, 0.20)' }}>
                        <span className="workout-session-badge" style={{ background: '#059669' }}>
                          Cardápio {activeMenu.menu_day}
                        </span>
                        <h2 className="workout-session-title">
                          {payload.nutrition.name_ptbr || `Cardápio Dia ${activeMenu.menu_day}`}
                        </h2>
                        {(payload.nutrition.daily_kcal_target || macros) && (
                          <div className="ck-meal-macros">
                            {payload.nutrition.daily_kcal_target && <span className="ck-pill">⚡ {payload.nutrition.daily_kcal_target} kcal</span>}
                            {macros?.protein_g > 0 && <span className="ck-pill" style={{ color: '#2563EB' }}>🥩 {macros.protein_g}g prot</span>}
                            {macros?.carb_g > 0 && <span className="ck-pill" style={{ color: '#D97706' }}>🍞 {macros.carb_g}g carb</span>}
                            {macros?.fat_g > 0 && <span className="ck-pill" style={{ color: '#7C3AED' }}>🥑 {macros.fat_g}g gord</span>}
                          </div>
                        )}
                        <MealTracker registeredToday={completedMeals.length} dots={dots} />
                      </div>

                      {allRegistered && <AllRegisteredNotice />}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(activeMenu.meals || []).map((meal) => {
                          const match = matches.get(Number(meal.meal_order));
                          const mealKey = `${activeMenu.menu_day}_${meal.meal_order}`;
                          return (
                            <MealCard
                              key={meal.meal_order}
                              meal={meal}
                              match={match}
                              saving={!!checkingInMeal[mealKey]}
                              onRegister={() => handleCheckinMeal(meal, activeMenu.menu_day)}
                              onUndo={() => handleUndoMeal(meal, match, activeMenu.menu_day)}
                            />
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

      </main>

      {/* Modal de Vídeo R2 */}
      <CheckinDialog dialog={checkin.dialog} onClose={checkin.closeDialog} />
      <UndoToast toast={checkin.toast ?? mealToast} />

      {activeVideo && (
        <UserVideoModal
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}

    </div>
  );
}
