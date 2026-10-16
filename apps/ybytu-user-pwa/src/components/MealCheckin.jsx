import '../checkin.css';

// Acompanhamento alimentar no app (2026-10-16) — desenho:
// designs/AlunoAlimentacaoCheckin.dc.html. Regras (docs/PRINCIPIOS_DE_PRODUTO.md):
// registrar é acompanhar, não cumprir — contador sem fração nem porcentagem,
// bolinhas em vez de barra, sem fechamento do dia, refeição não registrada fica
// limpa (sem "pendente", sem cor de alerta). Desfazer: aviso de 4s logo depois
// de registrar e link "Desfazer registro" no rodapé do cartão, os dois só no
// mesmo dia (unmark_meal).

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

export function AllRegisteredNotice() {
  return (
    <div className="ck-meal-all" role="status">
      <span aria-hidden="true">✓</span>
      <span>Você registrou todas as refeições de hoje.</span>
    </div>
  );
}

export function MealCard({ meal, match, saving, onRegister, onUndo }) {
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
          onClick={registered ? undefined : onRegister}
          disabled={registered || saving}
          aria-pressed={registered}
          aria-label={registered ? `${typeName} registrada` : `Registrar ${typeName}`}
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

      <div className="ck-meal-footer">
        {registered ? (
          <>
            <span className="ck-meal-footer-note">Registrada hoje</span>
            <button type="button" className="ck-meal-unmark" onClick={onUndo} disabled={saving}>Desfazer registro</button>
          </>
        ) : (
          <>
            <span className="ck-meal-footer-note">{meal.time_ptbr ? `Sugerido para ~${meal.time_ptbr}` : ''}</span>
            <button type="button" className="ck-meal-register" onClick={onRegister} disabled={saving}>
              {saving ? 'Registrando…' : 'Registrar refeição →'}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
