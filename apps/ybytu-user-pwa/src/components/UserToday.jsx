import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { thumbSources } from '../lib/media';
import ExerciseThumb from './ExerciseThumb';
import YbytuLogo from './YbytuLogo';
import UserVideoModal from './UserVideoModal';
import '../user.css';

export default function UserToday() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [payload, setPayload] = useState(null);
  const [activeTab, setActiveTab] = useState('training'); // 'training' | 'nutrition'
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Status de check-in de hoje
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [completedMeals, setCompletedMeals] = useState([]);
  const [checkingInWorkout, setCheckingInWorkout] = useState(false);
  const [checkingInMeal, setCheckingInMeal] = useState({});

  // Modal de vídeo
  const [activeVideo, setActiveVideo] = useState(null); // { url, title }

  // 1. Carrega plano do usuário autenticado
  useEffect(() => {
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
        setCompletedWorkouts(data.activity_today?.completed_workouts || []);
        setCompletedMeals(data.activity_today?.completed_meals || []);

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

    setCheckingInWorkout(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const planId = payload?.training?.id || null;
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
      alert(`Erro ao registrar check-in: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setCheckingInWorkout(false);
    }
  };

  // Check-in de Refeição
  const handleCheckinMeal = async (meal, dayOrder) => {
    const mealKey = `${dayOrder}_${meal.order}`;
    setCheckingInMeal(prev => ({ ...prev, [mealKey]: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const mealPlanId = payload?.nutrition?.id || null;
      const mealName = meal.meal_name || meal.name || `Refeição ${meal.order}`;

      const { data: inserted, error: insertErr } = await supabase
        .from('completed_meals')
        .insert({
          user_id: user.id,
          meal_plan_id: mealPlanId,
          day_order: Number(dayOrder),
          meal_order: Number(meal.order),
          meal_name: mealName,
        })
        .select('id, day_order, meal_order, meal_name, completed_at')
        .single();

      if (insertErr) throw insertErr;

      setCompletedMeals(prev => [inserted, ...prev]);
    } catch (err) {
      alert(`Erro ao marcar refeição: ${err?.message || 'Tente novamente.'}`);
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

  // Regra de Carga estrita (nunca 0 kg, 'a definir' se vazio)
  const renderExerciseLoad = (ex) => {
    if (ex.load_type === 'bodyweight') {
      return <span className="exercise-stat-tag">Peso corporal</span>;
    }
    if (ex.load_type === 'band') {
      return <span className="exercise-stat-tag">Elástico</span>;
    }
    const val = ex.load_kg || ex.load;
    if (val && Number(val) > 0) {
      return <span className="exercise-stat-tag load">{val} kg</span>;
    }
    return <span className="exercise-stat-tag load">Carga a definir</span>;
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
          onClick={() => setActiveTab('training')}
        >
          <span aria-hidden="true">🏋️</span> Treino de Hoje
        </button>
        <button
          type="button"
          className={`user-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          <span aria-hidden="true">🥗</span> Alimentação
        </button>
      </nav>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      <main className="user-main-content">
        
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
                {activeDay?.caution_warnings && activeDay.caution_warnings.length > 0 && (
                  <div className="caution-alert-card">
                    <span style={{ fontSize: '15px' }} aria-hidden="true">⚠️</span>
                    <div>
                      {activeDay.caution_warnings.map((c, i) => (
                        <div key={i}>{typeof c === 'string' ? c : c.mensagem}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nota de Slot Pulado (Mensagem amigável para o usuário) */}
                {activeDay?.skipped_note && (
                  <div className="caution-alert-card" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#1D4ED8' }}>
                    <span aria-hidden="true">ℹ️</span>
                    <div>{activeDay.skipped_note}</div>
                  </div>
                )}

                {/* Lista de Exercícios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeDay?.exercises?.map((ex, idx) => (
                    <article key={ex.exercise_id || idx} className="exercise-item-card">
                      
                      {/* Miniatura com fallback seguro */}
                      <div className="exercise-thumb-wrap">
                        <ExerciseThumb
                          sources={thumbSources(ex.image_url)}
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
                            {ex.sets} séries × {ex.reps}
                          </span>
                          
                          {/* Carga conforme load_type */}
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
            {!payload?.nutrition?.days || payload.nutrition.days.length === 0 ? (
              <div className="user-card" style={{ textAlign: 'center', color: 'var(--yb-muted, #718096)' }}>
                Nenhum plano alimentar cadastrado no momento.
              </div>
            ) : (
              <>
                {payload.nutrition.days.map((menuDay, dIdx) => (
                  <div key={menuDay.day_order || dIdx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Meta Diária de Calorias e Macros se informada */}
                    {menuDay.macros && (
                      <div className="user-card" style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--yb-muted, #718096)', letterSpacing: '0.04em' }}>
                          Metas Diárias
                        </span>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {menuDay.calories && (
                            <span className="exercise-stat-tag">⚡ {menuDay.calories} kcal</span>
                          )}
                          {menuDay.macros.protein_g && (
                            <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-protein, #3B82F6)' }}>
                              🥩 {menuDay.macros.protein_g}g prot
                            </span>
                          )}
                          {menuDay.macros.carb_g && (
                            <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-carb, #F59E0B)' }}>
                              🍞 {menuDay.macros.carb_g}g carb
                            </span>
                          )}
                          {menuDay.macros.fat_g && (
                            <span className="exercise-stat-tag" style={{ color: 'var(--yb-macro-fat, #A855F7)' }}>
                              🥑 {menuDay.macros.fat_g}g gord
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lista de Refeições */}
                    {menuDay.meals?.map((meal) => {
                      const mealDoneMatch = completedMeals.find(
                        cm => Number(cm.day_order) === Number(menuDay.day_order) && Number(cm.meal_order) === Number(meal.order)
                      );
                      const isMealDone = !!mealDoneMatch;
                      const doneTime = mealDoneMatch?.completed_at
                        ? new Date(mealDoneMatch.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : null;

                      const mealKey = `${menuDay.day_order}_${meal.order}`;
                      const isSaving = checkingInMeal[mealKey];

                      return (
                        <article key={meal.order} className="meal-item-card">
                          
                          <div className="meal-header-row">
                            <div className="meal-title-wrap">
                              <h3 className="meal-name">{meal.meal_name || meal.name}</h3>
                            </div>
                            {meal.scheduled_time && (
                              <span className="meal-time-badge">{meal.scheduled_time}</span>
                            )}
                          </div>

                          {/* Alimentos da Refeição */}
                          <div className="meal-foods-list">
                            {meal.foods?.map((f, fIdx) => (
                              <div key={fIdx} className="meal-food-row">
                                <span className="meal-food-name">{f.food_name || f.name}</span>
                                <span className="meal-food-qty">
                                  {f.quantity} {f.unit}
                                </span>
                              </div>
                            ))}
                          </div>

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
                                onClick={() => handleCheckinMeal(meal, menuDay.day_order)}
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
                ))}
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
