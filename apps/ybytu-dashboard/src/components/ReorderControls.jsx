// Reordenação de itens nos construtores (treino e alimentação), 2026-10-15.
// Desenho: designs/ConstrutorPlano.dc.html usa a alça de arrastar (6 pontos,
// cursor:grab) à esquerda da letra. Arrastar não funciona bem no toque, então
// no celular (≤860px, mesmo corte de index.css) a alça some e aparecem ▲▼
// (decisão da revisão de 2026-10-04). As classes .yb-reorder-grip /
// .yb-reorder-arrows trocam um pelo outro em index.css.
//
// A ordem gravada é a posição na lista: o save dos dois construtores já manda
// order_within_day / meal_order = índice + 1.

export function DragGrip({ index, onDragStart, onDragEnd, label }) {
  return (
    <span
      className="yb-reorder-grip"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index)); // Firefox só arrasta com setData
        onDragStart(index);
      }}
      onDragEnd={onDragEnd}
      title={`Arraste para mudar a ordem (${label})`}
      aria-label={`Arrastar ${label}`}
      style={{ color: 'var(--muted)', cursor: 'grab', display: 'flex', flexShrink: 0 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
        <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
      </svg>
    </span>
  );
}

const arrowStyle = (disabled) => ({
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1,
});

export function MoveArrows({ index, count, onMove, label }) {
  const first = index === 0;
  const last = index === count - 1;
  return (
    <div className="yb-reorder-arrows" style={{ alignItems: 'center', gap: '3px', flexShrink: 0 }}>
      <button type="button" disabled={first} onClick={() => onMove(index, index - 1)} style={arrowStyle(first)} aria-label={`Mover ${label} para cima`}>▲</button>
      <button type="button" disabled={last} onClick={() => onMove(index, index + 1)} style={arrowStyle(last)} aria-label={`Mover ${label} para baixo`}>▼</button>
    </div>
  );
}
