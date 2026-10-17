import '../checkin.css';
import '../mealDay.css';

// Acompanhamento alimentar no app (2026-10-16) — desenho:
// designs/AlunoAlimentacaoCheckin.dc.html. Regras (docs/PRINCIPIOS_DE_PRODUTO.md):
// registrar é acompanhar, não cumprir — contador sem fração nem porcentagem,
// bolinhas em vez de barra, refeição não registrada fica
// limpa (sem "pendente", sem cor de alerta). Desde 2026-10-17 a caixa é o
// único controle do cartão, como no treino: toca para registrar, toca de novo
// para desfazer (só no mesmo dia, unmark_meal); o aviso de 4s permite voltar
// atrás nos dois sentidos. O rodapé com "Registrar refeição →" / "Desfazer
// registro" saiu (decisão da Taina).

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

export function mealIcon(name) {
  return MEAL_ICONS[name] || '🍽️';
}

export function formatClock(iso) {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
}

// "do jantar" / "da ceia" para o aviso de registro removido.
export function mealWithArticle(name) {
  const n = String(name || 'refeição').trim();
  const lower = n.charAt(0).toLowerCase() + n.slice(1);
  return /^(ceia|refeição|janta)\b/i.test(n) ? `da ${lower}` : `do ${lower}`;
}

export function MealTracker({ registeredToday, dots }) {
  const text = registeredToday === 0
    ? 'Nenhuma refeição registrada hoje'
    : `${registeredToday} ${registeredToday === 1 ? 'refeição registrada' : 'refeições registradas'} hoje`;
  return (
    <div className="ck-meal-tracker">
      <span className="ck-meal-counter">{text}</span>
      {dots.length > 0 && (
        <div className="ck-meal-dots" aria-hidden="true">
          {dots.map((filled, i) => <span key={i} className={`ck-meal-dot ${filled ? 'filled' : 'empty'}`} />)}
        </div>
      )}
    </div>
  );
}

// Encerrar o registro do dia (2026-10-17, briefing
// docs/propostas/20261017_briefing_fechamento_dia_alimentar.md): o aluno declara
// que terminou de REGISTRAR -- nunca "comeu", "concluiu", "parcial". Sem fração,
// sem destacar o que ficou sem registro. Registrar a última refeição do cardápio
// encerra sozinho (substitui o antigo aviso "Você registrou todas as refeições").

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function MealDayClosedBanner({ closure, registeredToday }) {
  if (!closure?.closed_at) return null;
  const auto = closure.closed_by === 'auto_last_meal';
  const clock = formatClock(closure.closed_at);
  return (
    <div className={`md-closed-banner${auto ? ' full' : ''}`} role="status">
      <span className="md-closed-icon" aria-hidden="true">✓</span>
      <div>
        <div className="md-closed-title">{auto ? 'Registro de hoje encerrado' : `Registro de hoje encerrado às ${clock}`}</div>
        <div className="md-closed-sub">
          {auto
            ? `Todas as refeições do cardápio registradas às ${clock}`
            : [plural(registeredToday, 'refeição registrada', 'refeições registradas'), closure.day_order != null ? `Cardápio ${closure.day_order}` : null].filter(Boolean).join(' · ')}
        </div>
      </div>
    </div>
  );
}

export function CloseMealDayControl({ onClose, saving }) {
  return (
    <div className="md-close-box">
      <button type="button" className="md-close-btn" onClick={onClose} disabled={saving}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        Encerrar o registro de hoje
      </button>
      <span className="md-close-hint">Use quando terminar de registrar as refeições de hoje.</span>
    </div>
  );
}

export function MealDayClosedFooter({ closure, onReopen }) {
  if (!closure?.closed_at) return null;
  const auto = closure.closed_by === 'auto_last_meal';
  return (
    <div className="md-closed-footer">
      <span className={`md-closed-footer-text${auto ? ' full' : ''}`}>{auto ? 'Todas as refeições do cardápio registradas.' : 'Registro de hoje encerrado.'}</span>
      <button type="button" className="md-reopen-link" onClick={onReopen}>{auto ? 'Reabrir se precisar ajustar algo' : 'Reabrir registro do dia'}</button>
      {!auto && <span className="md-closed-footer-hint">Você pode reabrir para registrar ou desfazer até meia-noite.</span>}
    </div>
  );
}

// Folha de confirmação para reabrir (mesmo padrão visual do "Deseja reabrir
// este treino?"). registerMealName: tocou numa refeição NÃO registrada -- ao
// confirmar ela já entra registrada (briefing, estado 4).
export function ReopenMealDayDialog({ dialog, onClose }) {
  if (!dialog) return null;
  return (
    <div className="ck-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="md-reopen-title" onClick={onClose}>
      <div className="ck-dialog-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="md-dialog-icon" aria-hidden="true">🔄</div>
        <h4 className="ck-dialog-title" id="md-reopen-title">Reabrir o registro de hoje?</h4>
        <p className="ck-dialog-text">Você volta a poder registrar e desfazer refeições de hoje até o fim do dia (meia-noite no seu horário local).</p>
        {dialog.registerMealName && (() => {
          const theMeal = mealWithArticle(dialog.registerMealName).slice(1); // "o jantar" / "a ceia"
          return <div className="md-dialog-feedback">Ao confirmar, {theMeal} será registrad{theMeal.startsWith('a ') ? 'a' : 'o'} imediatamente no seu histórico.</div>;
        })()}
        {dialog.unmarkMealName && (
          <div className="md-dialog-feedback">Ao confirmar, o registro {mealWithArticle(dialog.unmarkMealName)} será desfeito.</div>
        )}
        <div className="ck-dialog-actions">
          <button type="button" className="ck-dialog-cancel" onClick={onClose}>Manter encerrado</button>
          <button type="button" className="md-dialog-confirm" onClick={() => { onClose(); dialog.onConfirm(); }}>Reabrir registro</button>
        </div>
      </div>
    </div>
  );
}

export function MealCard({ meal, match, saving, onToggle }) {
  const registered = !!match;
  const typeName = meal.name_ptbr || meal.meal_name_ptbr || `Refeição ${meal.meal_order}`;
  const protein = meal.macros?.protein_g;
  return (
    <article className={`ck-meal-card${registered ? ' registered' : ''}`}>
      <div className="ck-meal-top">
        <div className="ck-meal-icon" aria-hidden="true">{mealIcon(meal.name_ptbr)}</div>
        <div className="ck-meta-col">
          <h3 className="ck-meal-title">{typeName}</h3>
          {meal.meal_name_ptbr && meal.meal_name_ptbr !== typeName && (
            <span className="ck-meal-dish">{meal.meal_name_ptbr}</span>
          )}
          {meal.time_ptbr && <span className="ck-meal-time">{meal.time_ptbr}</span>}
          <div className="ck-tags-row" style={{ marginTop: '6px' }}>
            {meal.kcal != null && <span className="ck-pill">~{meal.kcal} kcal</span>}
            {registered
              ? <span className="ck-pill user-logged">Registrada às {formatClock(match.completed_at)}</span>
              : (protein > 0 && <span className="ck-pill">{Math.round(protein)}g prot</span>)}
          </div>
        </div>
        {/* Caixa no FIM do HTML (2026-10-16): leitor de tela e teclado chegam nela
            depois do nome do item, na mesma ordem em que ela aparece na tela (à
            direita, order: 3 no user.css). */}
        <button
          type="button"
          className={`ck-check${registered ? ' checked' : ''}`}
          onClick={onToggle}
          disabled={saving}
          aria-pressed={registered}
          aria-label={registered ? `Desfazer registro de ${typeName}` : `Registrar ${typeName}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      {meal.ingredients?.length > 0 && (
        <div className="ck-meal-foods">
          {meal.ingredients.map((ing, i) => (
            <div key={i} className="ck-meal-food">
              <span>{ing.name_ptbr || '—'}</span>
              <span className="ck-meal-food-qty">{ing.quantity_ptbr}</span>
            </div>
          ))}
        </div>
      )}

      {!registered && meal.prep_ptbr && (
        <div className="exercise-instructions" style={{ marginTop: '2px' }}>
          <strong>Preparo:</strong> {meal.prep_ptbr}
        </div>
      )}
    </article>
  );
}
