import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { thumbSources } from '../lib/media';
import ExerciseThumb from './ExerciseThumb';
import YbytuLogo from './YbytuLogo';
import UserVideoModal from './UserVideoModal';
import '../user.css';

const MEAL_ICONS = {
  'Café da manhã': '🥞',
  'Lanche': '🍎',
  'Lanche da manhã': '🍎',
  'Lanche da tarde': '🥪',
  'Almoço': '🥗',
  'Janta': '🍽️',
  'Jantar': '🍽️',
  'Ceia': '🌙',
};

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
    const lastDay = workouts[0]?.day_number;
    return calculateNextDayIndex(days, lastDay);
  }, [mockPayload]);

  const [selectedDayIdx, setSelectedDayIdx] = useState(initialDayIdx);
  const [selectedMenuIdx, setSelectedMenuIdx] = useState(0);

  // Status de check-in de hoje
  const [completedWorkouts, setCompletedWorkouts] = useState(mockPayload?.activity_today?.completed_workouts || []);
  const [completedMeals, setCompletedMeals] = useState(mockPayload?.activity_today?.completed_meals || []);
  const [checkingInWorkout, setCheckingInWorkout] = useState(false);
  const [checkingInMeal, setCheckingInMeal] = useState({});
  const [checkinError, setCheckinError] = useState(null);

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
          const msg = data?.message || data?.error || error?.message || 'Não foi possível carregar seu plano no momento.';
          setErrorMessage(msg);
          return;
        }

        setPayload(data);
        const todayWorkouts = data.activity_today?.completed_workouts || [];
        setCompletedWorkouts(todayWorkouts);
        setCompletedMeals(data.activity_today?.completed_meals || []);

        // Define o dia padrão ao abrir: o PRÓXIMO dia depois do último concluído
        let lastCompletedDay = todayWorkouts[0]?.day_number;

        // Se nenhum treino foi concluído hoje, busca o último treino histórico no banco
        if (lastCompletedDay == null && session?.user?.id) {
          try {
            const { data: lastWk } = await supabase
              .from('completed_workouts')
              .select('day_number')
              .eq('user_id', session.user.id)
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastWk?.day_number != null) {
              lastCompletedDay = lastWk.day_number;
            }
          } catch (e) {
            // Silencioso em caso de falha de rede/permissão na consulta auxiliar
          }
        }

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

  // Check-in do Treino
  const handleCheckinWorkout = async () => {
    if (!activeDay || isWorkoutCompletedToday) return;

    setCheckinError(null);

    // Se o aluno já concluiu qualquer treino hoje, solicita confirmação amigável antes de registrar outra sessão
    if (completedWorkouts.length > 0) {
      const confirmAnother = window.confirm('Você já concluiu um treino hoje, deseja registrar outro?');
      if (!confirmAnother) {
        return;
      }
    }

    const planId = payload?.training?.id || null;
    if (!planId) {
      setCheckinError('Não foi possível identificar o plano de treino ativo para registrar o check-in. Atualize a página e tente novamente.');
      return;
    }

    setCheckingInWorkout(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const dayNum = Number(activeDay.day_number);
      const sessionTitle = activeDay.title_ptbr || activeDay.region_label_ptbr || `Treino Dia ${dayNum}`;

      const { data: inserted, error: insertErr } = await supabase
        .from('completed_workouts')
        .insert({
          user_id: user.id,
          training_plan_id: planId,
          day_number: dayNum,
          session_name: sessionTitle,
        })
        .select('id, day_number, session_name, completed_at')
        .single();

      if (insertErr) throw insertErr;

      setCompletedWorkouts(prev => [inserted, ...prev]);
    } catch (err) {
      setCheckinError(`Erro ao registrar check-in: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setCheckingInWorkout(false);
    }
  };

  // Check-in de Refeição
  const handleCheckinMeal = async (meal, dayOrder) => {
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
        .select('id, day_order, meal_order, meal_name, completed_at')
        .single();

      if (insertErr) throw insertErr;

      setCompletedMeals(prev => [inserted, ...prev]);
    } catch (err) {
      setCheckinError(`Erro ao marcar refeição: ${err?.message || 'Tente novamente.'}`);
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

  const firstName = payload?.profile?.name ? payload.profile.name.split(' ')[0] : 'Você';

  return (
    <div className="user-pwa-container">
      
      {/* Header Fixo do Usuário */}
      <header className="user-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <YbytuLogo size={32} />
          <div className="user-header-title">
            <span className="user-greeting">Olá, {firstName}!</span>
            <span className="user-subdate">{todayFormatted}</span>
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
                    <article key={ex.id || ex.order || idx} className="exercise-item-card">
                      
                      {/* Miniatura com fallback seguro */}
                      <div className="exercise-thumb-wrap">
                        <ExerciseThumb
                          sources={[ex.image_thumb_url, ex.image_url, ...thumbSources(ex.image_url)].filter(Boolean)}
                          label={ex.name_ptbr}
                          width={54}
                          height={54}
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

                      {/* Informações de Execução */}
                      <div className="exercise-info">
                        <h3 className="exercise-name">{ex.name_ptbr}</h3>
                        
                        <div className="exercise-stats-grid">
                          <span className="exercise-stat-tag">
                            {ex.sets} séries × {ex.reps_ptbr || ex.reps}
                          </span>
                          
                          {/* Carga conforme load_type e load_display_ptbr */}
                          {renderExerciseLoad(ex)}

                          {ex.rest_seconds > 0 && (
                            <span className="exercise-stat-tag">
                              {ex.rest_seconds}s descanso
                            </span>
                          )}
                        </div>

                        {/* Instrução se disponível */}
                        {ex.instruction_ptbr && (
                          <div className="exercise-instructions">
                            {ex.instruction_ptbr}
                          </div>
                        )}

                        {/* Botão de vídeo visível com rótulo "▶ Ver vídeo" como no Dashboard */}
                        {ex.video_url && (
                          <button
                            type="button"
                            className="exercise-video-btn"
                            onClick={() => setActiveVideo({ url: ex.video_url, title: ex.name_ptbr })}
                            aria-label={`Ver vídeo de ${ex.name_ptbr}`}
                          >
                            <span aria-hidden="true" style={{ fontSize: '10px' }}>▶</span> Ver vídeo
                          </button>
                        )}
                      </div>

                    </article>
                  ))}
                </div>

                {/* BOTÃO DE CHECK-IN DO TREINO */}
                <div style={{ marginTop: '8px' }}>
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
                      disabled={checkingInWorkout}
                      onClick={handleCheckinWorkout}
                    >
                      {checkingInWorkout ? (
                        'Registrando…'
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Concluir Treino de Hoje
                        </>
                      )}
                    </button>
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
                {/* Meta Diária de Calorias e Macros do Plano (lida uma vez só fora da lista) */}
                {(payload?.nutrition?.daily_kcal_target || payload?.nutrition?.macro_distribution) && (
                  <div className="user-card" style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--yb-muted, #718096)', letterSpacing: '0.04em' }}>
                      Metas Diárias
                    </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {payload.nutrition.daily_kcal_target && (
                        <span className="exercise-stat-tag">⚡ {payload.nutrition.daily_kcal_target} kcal</span>
                      )}
                      {payload.nutrition.macro_distribution?.protein_g > 0 && (
                        <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-protein, #3B82F6)' }}>
                          🥩 {payload.nutrition.macro_distribution.protein_g}g prot
                        </span>
                      )}
                      {payload.nutrition.macro_distribution?.carb_g > 0 && (
                        <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-carb, #F59E0B)' }}>
                          🍞 {payload.nutrition.macro_distribution.carb_g}g carb
                        </span>
                      )}
                      {payload.nutrition.macro_distribution?.fat_g > 0 && (
                        <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-fat, #A855F7)' }}>
                          🥑 {payload.nutrition.macro_distribution.fat_g}g gord
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Resumo do Cardápio Selecionado */}
                {activeMenu && (
                  <div className="workout-summary-card" style={{ background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(22, 163, 74, 0.02) 100%)', borderColor: 'rgba(22, 163, 74, 0.2)' }}>
                    <span className="workout-session-badge" style={{ background: '#16a34a' }}>
                      Cardápio {activeMenu.menu_day}
                    </span>
                    <h2 className="workout-session-title">
                      {payload.nutrition.name_ptbr || `Cardápio Dia ${activeMenu.menu_day}`}
                    </h2>
                    <div className="workout-meta-row">
                      {activeMenu.meals && (
                        <span className="workout-meta-item">
                          🥗 {activeMenu.meals.length} refeições
                        </span>
                      )}
                      {payload.nutrition.preference_ptbr && (
                        <span className="workout-meta-item">
                          🌱 {payload.nutrition.preference_ptbr}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Refeições do Cardápio Ativo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeMenu?.meals?.map((meal) => {
                    const mealDoneMatch = completedMeals.find(
                      cm => Number(cm.day_order) === Number(activeMenu.menu_day) && Number(cm.meal_order) === Number(meal.meal_order)
                    );
                    const isMealDone = !!mealDoneMatch;
                    const doneTime = mealDoneMatch?.completed_at
                      ? new Date(mealDoneMatch.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : null;

                    const mealKey = `${activeMenu.menu_day}_${meal.meal_order}`;
                    const isSaving = checkingInMeal[mealKey];

                    return (
                      <article key={meal.meal_order} className="meal-item-card">
                        
                        <div className="meal-header-row">
                          <div className="meal-title-wrap">
                            <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">
                              {MEAL_ICONS[meal.name_ptbr] || '🍽️'}
                            </span>
                            <div>
                              <h3 className="meal-name">
                                {meal.name_ptbr || meal.meal_name_ptbr || `Refeição ${meal.meal_order}`}
                              </h3>
                              {meal.meal_name_ptbr && meal.name_ptbr && meal.meal_name_ptbr !== meal.name_ptbr && (
                                <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--yb-muted, #718096)', marginTop: '2px' }}>
                                  {meal.meal_name_ptbr}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {meal.kcal && (
                              <span className="exercise-stat-tag" style={{ fontSize: '11px' }}>
                                {meal.kcal} kcal
                              </span>
                            )}
                            {meal.time_ptbr && (
                              <span className="meal-time-badge">{meal.time_ptbr}</span>
                            )}
                          </div>
                        </div>

                        {/* Ingredientes da Refeição */}
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="meal-foods-list">
                            {meal.ingredients.map((ing, ingIdx) => (
                              <div key={ingIdx} className="meal-food-row">
                                <span className="meal-food-name">{ing.name_ptbr || '—'}</span>
                                <span className="meal-food-qty">{ing.quantity_ptbr}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Modo de preparo se houver */}
                        {meal.prep_ptbr && (
                          <div className="exercise-instructions" style={{ marginTop: '2px' }}>
                            <strong>Preparo:</strong> {meal.prep_ptbr}
                          </div>
                        )}

                        {/* Check-in Individual da Refeição */}
                        <div style={{ marginTop: '4px' }}>
                          {isMealDone ? (
                            <span className="meal-checkin-btn done">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Refeição feita{doneTime ? ` às ${doneTime}` : ''}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="meal-checkin-btn"
                              disabled={isSaving}
                              onClick={() => handleCheckinMeal(meal, activeMenu.menu_day)}
                            >
                              {isSaving ? (
                                'Salvando…'
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  Marcar como realizada
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

      </main>

      {/* Modal de Vídeo R2 */}
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
