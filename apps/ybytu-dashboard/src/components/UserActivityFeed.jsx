import { useState, useEffect } from 'react';
import { invokeFunction } from '../services/apiClient.js';

// Aba "Atividade & adesão" do UserDetail -- layout de UsuarioDetalhe.dc.html
// (mapa de calor de 12 semanas + listas Treinos Concluídos / Refeições
// Registradas). Dado real de ybytu-get-user-activity (check-ins do PWA).

const WEEKS = 12;
const HEAT_COLORS = ['var(--surface-2)', 'rgba(245,95,22,.3)', 'rgba(245,95,22,.6)', '#F55F16'];

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

// ─── Refeições por dia (2026-10-16, designs/AlunoAlimentacaoCheckin.dc.html) ──
// Uma linha por data no fuso do ALUNO (ybytu-get-user-activity.meal_days),
// recolhida/expandida. Regras (docs/PRINCIPIOS_DE_PRODUTO.md): contagem factual
// "3 de 5 refeições registradas", kcal só do que foi registrado e NUNCA
// comparada com a meta; dia sem registro aparece neutro ("Sem registros").
const MEAL_DAYS_SHOWN = 14;

function parseLocalDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftYmd(ymd, days) {
  const d = parseLocalDate(ymd);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(ymd) {
  const label = parseLocalDate(ymd).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function countLabel(registered, planned) {
  const noun = (planned ?? registered) === 1 ? 'refeição registrada' : 'refeições registradas';
  return planned ? `${registered} de ${planned} ${noun}` : `${registered} ${noun}`;
}

// Encerramento do registro do dia (2026-10-17, desenho
// designs/AlunoAlimentacaoCheckin.dc.html, estado 5): encerrado pelo aluno,
// encerrado ao registrar a última refeição, não encerrado (neutro, cinza) e sem
// registros. Comparação de macros com o cardápio SÓ em dia encerrado, sempre
// com "registrado" -- nunca "comeu", "consumiu", "parcial", "meta".
const DAY_BADGE = {
  closed: { label: 'Encerrado pelo aluno', style: { background: 'rgba(5,150,105,0.12)', color: '#065F46', border: '1px solid rgba(5,150,105,0.3)' } },
  full: { label: 'Todas registradas', style: { background: '#059669', color: '#FFFFFF' } },
  unclosed: { label: 'Registro não encerrado', style: { background: 'rgba(100,116,139,0.14)', color: '#475569', border: '1px solid rgba(100,116,139,0.25)' } },
};
function DayBadge({ kind }) {
  const b = DAY_BADGE[kind];
  return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap', ...b.style }}>{b.label}</span>;
}

function MacroComparison({ comparison }) {
  const items = [
    ['Proteína registrada', comparison.registered.protein_g, comparison.menu.protein_g, '#2563EB'],
    ['Carboidrato registrado', comparison.registered.carb_g, comparison.menu.carb_g, '#D97706'],
    ['Gordura registrada', comparison.registered.fat_g, comparison.menu.fat_g, '#7C3AED'],
  ];
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
      {items.map(([label, reg, menu, color]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
          <span style={{ fontSize: '12.5px', fontWeight: 900, color }}>{reg}g</span>
          <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748B' }}>de {menu}g do cardápio</span>
        </div>
      ))}
    </div>
  );
}

function MealDayRow({ day, isToday, isYesterday, mealsById, timeZone }) {
  const [open, setOpen] = useState(false);
  const clock = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone });
  const closure = day.closure;
  const badgeKind = !closure ? 'unclosed' : (closure.closed_by === 'auto_last_meal' ? 'full' : 'closed');
  const menuDay = closure?.menu_day ?? (day.groups.length === 1 ? day.groups[0].menu_day : null);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', padding: '13px 22px', background: open ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left', font: 'inherit' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800 }}>
          {dayLabel(day.date)}
          {isToday && <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(5,150,105,0.12)', color: '#065F46', padding: '2px 8px', borderRadius: '6px' }}>Hoje</span>}
          {isYesterday && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Ontem</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--muted)', flexWrap: 'wrap' }}>
          {menuDay != null && <><span>Cardápio {menuDay}</span><span>·</span></>}
          {closure && <><strong style={{ color: 'var(--text)' }}>Registro encerrado pelo aluno às {clock(closure.closed_at)}</strong><span>·</span></>}
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
            {badgeKind === 'full'
              ? `todas as ${day.registered} refeições do cardápio registradas`
              : countLabel(day.registered, day.planned)}
          </span>
          {!closure && <span>(<strong>registro não encerrado pelo aluno</strong>)</span>}
          <span>·</span>
          <span>{day.kcal_registered.toLocaleString('pt-BR')} kcal registradas</span>
          <DayBadge kind={badgeKind} />
          <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {closure && day.macro_comparison && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Distribuição de macros registrados vs prescrito no cardápio</span>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>✓ Declarado encerrado pelo aluno</span>
              </div>
              <MacroComparison comparison={day.macro_comparison} />
            </>
          )}
          {closure && !day.macro_comparison && (
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Sem comparação com o cardápio: ele foi alterado depois dos registros deste dia.</div>
          )}
          {!closure && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '11.5px', color: 'var(--muted)' }}>
              ℹ️ <strong>Registro não encerrado pelo aluno:</strong> este dia não exibe comparação de macros ou cumprimento de cardápio, pois ausência de registro não significa ausência de consumo.
            </div>
          )}
          {day.groups.map((g, gi) => {
            const registered = g.registered_ids.map(id => mealsById.get(id)).filter(Boolean)
              .map(m => ({ kind: 'reg', order: m.meal_order ?? 99, m }));
            const missing = (g.unregistered || []).map(u => ({ kind: 'miss', order: u.meal_order, u }));
            const rows = [...registered, ...missing].sort((a, b) => a.order - b.order);
            return (
              <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginTop: gi ? '8px' : 0 }}>
                  Detalhamento do dia{g.menu_day != null ? ` (Cardápio ${g.menu_day})` : ''}{registered[0]?.m.is_current_plan === false ? ' · plano anterior' : ''}
                </div>
                {rows.map((r, i) => r.kind === 'reg' ? (
                  <div key={i} title={r.m.meal_name || undefined} style={mealItemRow}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{MEAL_ICONS[r.m.meal_type_ptbr] || '🍽️'}</span>
                      <span>{r.m.meal_type_ptbr || r.m.meal_name || `Refeição ${r.m.meal_order ?? '—'}`}</span>
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
                      Registrada às {clock(r.m.completed_at)}
                      {r.m.kcal != null && <> <span style={{ margin: '0 6px' }}>·</span><strong style={{ color: 'var(--text)' }}>{r.m.kcal} kcal</strong></>}
                    </span>
                  </div>
                ) : (
                  <div key={i} style={{ ...mealItemRow, background: 'var(--surface-2)', borderStyle: 'dashed', color: '#94A3B8' }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ opacity: 0.6 }}>{MEAL_ICONS[r.u.meal_type_ptbr] || '🍽️'}</span>
                      <span>{r.u.meal_type_ptbr || `Refeição ${r.u.meal_order}`}</span>
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Sem registro</span>
                  </div>
                ))}
                {/* Cardápio do dia mudou depois do registro: não dá para dizer QUAIS
                    ficaram sem registro, só quantas. */}
                {g.unregistered == null && g.unregistered_count > 0 && (
                  <div style={{ ...mealItemRow, background: 'var(--surface-2)', borderStyle: 'dashed', color: '#94A3B8' }}>
                    <span style={{ fontWeight: 700 }}>{g.unregistered_count} {g.unregistered_count === 1 ? 'refeição' : 'refeições'} do cardápio</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Sem registro</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Treinos por dia (2026-10-16): mesmo formato das refeições ────────────────
// Uma linha por data (fuso do aluno) com os treinos do dia; ao expandir, cada
// sessão com os exercícios marcados e a carga registrada pelo aluno. Só dias
// com treino (dia sem treino costuma ser descanso; o mapa de calor mostra a
// frequência).
function workoutMeta(w) {
  return [
    w.exercises_done != null && w.exercise_count
      ? `${w.exercises_done} de ${w.exercise_count} exercícios`
      : (w.exercise_count ? `${w.exercise_count} exercícios` : null),
    w.auto_closed ? 'parcial · encerrado na virada do dia' : null,
    w.day_number != null ? `Dia ${w.day_number}` : null,
    w.is_current_plan === false ? 'plano anterior' : null,
  ].filter(Boolean).join(' · ');
}

function WorkoutDayRow({ day, isToday, isYesterday, timeZone }) {
  const [open, setOpen] = useState(false);
  const clock = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone });
  const first = day.workouts[0];
  const summary = day.workouts.length === 1
    ? [first.session_name || `Treino · Dia ${first.day_number ?? '—'}`, workoutMeta(first)].filter(Boolean).join(' · ')
    : `${day.workouts.length} treinos`;
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', padding: '13px 22px', background: open ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left', font: 'inherit' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800 }}>
          {dayLabel(day.date)}
          {isToday && <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)', padding: '2px 8px', borderRadius: '6px' }}>Hoje</span>}
          {isYesterday && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Ontem</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{summary}</span>
          <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {day.workouts.map(w => (
            <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
                {w.session_name || `Treino · Dia ${w.day_number ?? '—'}`} · concluído às {clock(w.completed_at)}
              </div>
              {day.workouts.length > 1 && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{workoutMeta(w)}</div>}
              {w.exercises.length === 0 ? (
                <div style={{ ...mealItemRow, background: 'var(--surface-2)', borderStyle: 'dashed', color: '#94A3B8' }}>
                  <span style={{ fontWeight: 600 }}>Concluído sem marcação por exercício</span>
                </div>
              ) : w.exercises.map((e, i) => (
                <div key={i} style={mealItemRow}>
                  <span style={{ fontWeight: 700 }}>{e.name_ptbr || e.exercise_id}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>
                    Marcado às {clock(e.completed_at)}
                    {e.load_kg != null && <> <span style={{ margin: '0 6px' }}>·</span><strong style={{ color: 'var(--text)' }}>{Number(e.load_kg).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg registrados</strong></>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const mealItemRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '6px 10px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12.5px' };

function MealDays({ mealDays, meals, todayLocal, timeZone, emptyText }) {
  if (!mealDays.length) return <p style={emptyStyle}>{emptyText}</p>;
  const mealsById = new Map(meals.map(m => [m.id, m]));
  const byDate = new Map(mealDays.map(d => [d.date, d]));
  const oldest = mealDays[mealDays.length - 1].date;
  const today = todayLocal || mealDays[0].date;
  const dates = [];
  for (let d = today; d >= oldest && dates.length < MEAL_DAYS_SHOWN; d = shiftYmd(d, -1)) dates.push(d);
  const yesterday = shiftYmd(today, -1);
  return (
    <div>
      {dates.map(date => {
        const day = byDate.get(date);
        if (!day) {
          return (
            <div key={date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '12px 22px', borderBottom: '1px solid var(--border)', fontSize: '12.5px', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700 }}>{dayLabel(date)}</span>
                {date === today && <span style={{ fontSize: '11px', fontWeight: 700 }}>Hoje</span>}
                <span>·</span>
                <span>Sem registros</span>
              </span>
              <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Nenhuma refeição registrada pelo aluno</span>
            </div>
          );
        }
        return <MealDayRow key={date} day={day} isToday={date === today} isYesterday={date === yesterday} mealsById={mealsById} timeZone={timeZone} />;
      })}
    </div>
  );
}

// ─── Frequência semanal de treino (2026-10-16, Opção A aprovada) ─────────────
// Fatos lado a lado, sem placar: "Esta semana: 2 treinos registrados ·
// combinado: 4 por semana". "Atingida" só aparece quando é verdade; nenhum
// texto diz "faltam", "atrasado" ou "não atingida". A nota "treino sem registro
// não é treino não feito" fica UMA vez, no cabeçalho do cartão.
function shortDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function weekText(w) {
  const label = w.since
    ? `Primeira semana (desde ${dayLabel(w.since).toLowerCase()})`
    : (w.is_current ? 'Esta semana' : `Semana de ${shortDate(w.week_start)}`);
  if (w.registered === 0) return `${label}: nenhum treino registrado${w.is_current ? ' ainda' : ''}`;
  const noun = w.registered === 1 ? 'treino registrado' : 'treinos registrados';
  const partial = w.partial ? ` (${w.partial} ${w.partial === 1 ? 'parcial' : 'parciais'})` : '';
  return `${label}: ${w.registered} ${noun}${partial}`;
}

function WeeklyFrequency({ weeks, combined }) {
  if (!weeks.length) return null;
  const current = weeks.find(w => w.is_current);
  const previous = weeks.filter(w => !w.is_current);
  const side = (w, long) => {
    if (combined && w.registered >= combined) return <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ frequência combinada atingida</span>;
    if (combined) return <span>combinado: {combined}{long ? ' por semana' : ''}</span>;
    return null;
  };
  return (
    <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {current && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', padding: '12px 14px', borderRadius: '12px', background: 'var(--surface-2)' }}>
          <span style={{ fontSize: '14px', fontWeight: 800 }}>{weekText(current)}</span>
          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>{side(current, true)}</span>
        </div>
      )}
      {previous.map(w => (
        <div key={w.week_start} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', padding: '0 14px', fontSize: '12.5px', color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{weekText(w)}</span>
          <span style={{ fontWeight: 600 }}>{side(w, false)}</span>
        </div>
      ))}
    </div>
  );
}

const sectionTitle = { margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' };
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

  const { summary = {}, workouts = [], workout_days: workoutDays = [], training_weeks: trainingWeeks = [], meals = [], meal_days: mealDays = [], today_local: todayLocal, timezone: studentTz } = data || {};
  const yesterdayLocal = todayLocal ? shiftYmd(todayLocal, -1) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Mapa de calor */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
          <div>
            <h3 style={sectionTitle}>Adesão aos Treinos</h3>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>Treinos concluídos nas últimas 12 semanas</p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>Conta só o que o aluno marcou no app; treino sem registro não é treino não feito.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
            Menos
            {HEAT_COLORS.map(c => <span key={c} style={{ width: 13, height: 13, borderRadius: 3, background: c }} />)}
            Mais
          </div>
        </div>
        <WeeklyFrequency weeks={trainingWeeks} combined={summary.training_days_per_week} />
        <Heatmap workouts={workouts} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {/* Treinos concluídos */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h3 style={sectionTitle}>Treinos Concluídos por Dia</h3></div>
          <div>
            {workoutDays.length === 0 ? (
              <p style={emptyStyle}>{emptyMessage(summary.last_sign_in_at, 'workout')}</p>
            ) : workoutDays.slice(0, MEAL_DAYS_SHOWN).map(day => (
              <WorkoutDayRow key={day.date} day={day} isToday={day.date === todayLocal} isYesterday={day.date === yesterdayLocal} timeZone={studentTz} />
            ))}
          </div>
        </section>

        {/* Refeições registradas por dia */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={sectionTitle}>Refeições Registradas por Dia</h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              Histórico diário com contagem factual. Kcal representam estritamente o que foi registrado.
            </p>
          </div>
          <MealDays
            mealDays={mealDays}
            meals={meals}
            todayLocal={todayLocal}
            timeZone={studentTz}
            emptyText={emptyMessage(summary.last_sign_in_at, 'meal')}
          />
        </section>
      </div>
    </div>
  );
}
