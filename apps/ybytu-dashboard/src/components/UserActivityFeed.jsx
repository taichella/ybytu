import { useState, useEffect } from 'react';
import { invokeFunction } from '../services/apiClient.js';

// Aba "Atividade & adesão" do UserDetail -- layout de UsuarioDetalhe.dc.html
// (mapa de calor de 12 semanas + listas Treinos Concluídos / Refeições
// Registradas). Dado real de ybytu-get-user-activity (check-ins do PWA).

const WEEKS = 12;
const HEAT_COLORS = ['var(--surface-2)', 'rgba(245,95,22,.3)', 'rgba(245,95,22,.6)', '#F55F16'];
const LIST_LIMIT = 10;

// Mesmo mapa de ícones da tela de nutrição do PWA (UserToday.jsx).
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

function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatWhen(dateString) {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);
  if (diffDays === 0) return `hoje, ${time}`;
  if (diffDays === 1) return `ontem, ${time}`;
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Mensagem de lista vazia: separa "nunca entrou no app" de "entrou, mas não
// marcou nada" -- são situações diferentes pro profissional.
function emptyMessage(lastSignInAt, what) {
  if (!lastSignInAt) return 'O aluno ainda não acessou o app.';
  return `O aluno já acessou o app (último acesso: ${formatDateTime(lastSignInAt)}), mas ainda não registrou nenhum${what === 'meal' ? 'a refeição' : ' treino'}.`;
}

// Colunas = semanas (segunda a domingo), a última é a semana atual.
// Intensidade = nº de treinos registrados no dia (0, 1, 2, 3+).
function Heatmap({ workouts }) {
  const countByDay = new Map();
  for (const w of workouts) {
    const key = localDayKey(new Date(w.completed_at));
    countByDay.set(key, (countByDay.get(key) || 0) + 1);
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (startOfToday.getDay() + 6) % 7;
  const firstMonday = new Date(startOfToday);
  firstMonday.setDate(startOfToday.getDate() - mondayOffset - (WEEKS - 1) * 7);

  const columns = [];
  for (let w = 0; w < WEEKS; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(firstMonday);
      day.setDate(firstMonday.getDate() + w * 7 + d);
      const isFuture = day > startOfToday;
      const count = countByDay.get(localDayKey(day)) || 0;
      const label = day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      cells.push(
        <div
          key={d}
          title={isFuture ? label : `${label}: ${count === 0 ? 'nenhum treino' : count === 1 ? '1 treino' : `${count} treinos`}`}
          style={{ width: 15, height: 15, borderRadius: 3, background: HEAT_COLORS[Math.min(count, 3)], opacity: isFuture ? 0.35 : 1 }}
        />
      );
    }
    columns.push(<div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{cells}</div>);
  }

  return <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>{columns}</div>;
}

const sectionTitle = { margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' };
const rowStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 22px', borderBottom: '1px solid var(--border)' };
const emptyStyle = { padding: '22px', fontSize: '13px', color: 'var(--muted)' };

export default function UserActivityFeed({ userId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchActivity = async () => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await invokeFunction('ybytu-get-user-activity', { body: { userId } });
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted) setError(err.message || 'Erro ao carregar as atividades do aluno.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchActivity();
    return () => { isMounted = false; };
  }, [userId]);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        Carregando registros do aluno...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 0', color: 'var(--danger)', fontSize: '12.5px' }}>
        Não foi possível carregar os registros de atividade: {error}
      </div>
    );
  }

  const { summary = {}, workouts = [], meals = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Mapa de calor */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
          <div>
            <h3 style={sectionTitle}>Adesão aos Treinos</h3>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>Treinos concluídos nas últimas 12 semanas</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
            Menos
            {HEAT_COLORS.map(c => <span key={c} style={{ width: 13, height: 13, borderRadius: 3, background: c }} />)}
            Mais
          </div>
        </div>
        <Heatmap workouts={workouts} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {/* Treinos concluídos */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={sectionTitle}>Treinos Concluídos</h3></div>
          <div>
            {workouts.length === 0 ? (
              <p style={emptyStyle}>{emptyMessage(summary.last_sign_in_at, 'workout')}</p>
            ) : workouts.slice(0, LIST_LIMIT).map(w => (
              <div key={w.id} style={rowStyle}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{w.session_name || `Treino · Dia ${w.day_number ?? '—'}`}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    {[
                      w.exercise_count ? `${w.exercise_count} exercícios` : null,
                      w.day_number != null ? `Dia ${w.day_number}` : null,
                      w.is_current_plan === false ? 'plano anterior' : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatWhen(w.completed_at)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Refeições registradas */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={sectionTitle}>Refeições Registradas</h3></div>
          <div>
            {meals.length === 0 ? (
              <p style={emptyStyle}>{emptyMessage(summary.last_sign_in_at, 'meal')}</p>
            ) : meals.slice(0, LIST_LIMIT).map(m => (
              <div key={m.id} style={rowStyle}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(22,163,74,.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '15px' }}>
                  {MEAL_ICONS[m.meal_type_ptbr] || '🍽️'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{m.meal_name || m.meal_type_ptbr || `Refeição ${m.meal_order ?? '—'}`}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    {[
                      m.kcal != null ? `${m.kcal} kcal consumidas` : m.meal_type_ptbr,
                      m.is_current_plan === false ? 'plano anterior' : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatWhen(m.completed_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
