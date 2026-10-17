// Reordenação de itens nos construtores (treino e alimentação).
// 2026-10-15: alça de arrastar no computador, ▲▼ no celular.
// 2026-10-17 (decisão da Taina): SÓ ▲▼, no computador e no celular. Arrastar
// brigava com a rolagem no celular e quebrava fácil no computador; com ~6 itens,
// dois cliques bastam. Desenho atualizado: designs/ConstrutorPlano.dc.html.
//
// - "Subir" do primeiro item e "descer" do último ficam DESABILITADAS, não
//   escondidas: esconder mudaria o alinhamento da lista a cada item.
// - Depois de mover, o foco acompanha o item (mesma seta, na nova posição), para
//   dar vários cliques seguidos sem procurar o botão. Se a seta ficou
//   desabilitada (chegou ao topo/fim), o foco vai para a outra seta do item.
//
// A ordem gravada é a posição na lista: o save dos dois construtores já manda
// order_within_day / meal_order = índice + 1.

const arrowStyle = (disabled) => ({
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px',
  minWidth: '30px', minHeight: '28px', padding: '4px 8px',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1,
});

function focusArrow(itemId, dir) {
  // Espera o React reposicionar o item na lista.
  requestAnimationFrame(() => {
    const pick = (d) => document.querySelector(`[data-reorder-item="${CSS.escape(String(itemId))}"][data-reorder-dir="${d}"]`);
    const same = pick(dir);
    const other = pick(dir === 'up' ? 'down' : 'up');
    if (same && !same.disabled) same.focus();
    else if (other && !other.disabled) other.focus();
  });
}

export function MoveArrows({ index, count, onMove, label, itemId }) {
  const first = index === 0;
  const last = index === count - 1;
  const move = (to, dir) => {
    onMove(index, to);
    if (itemId != null) focusArrow(itemId, dir);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
      <button type="button" disabled={first} onClick={() => move(index - 1, 'up')} style={arrowStyle(first)}
        data-reorder-item={itemId} data-reorder-dir="up" aria-label={`Mover ${label} para cima`} title="Mover para cima">▲</button>
      <button type="button" disabled={last} onClick={() => move(index + 1, 'down')} style={arrowStyle(last)}
        data-reorder-item={itemId} data-reorder-dir="down" aria-label={`Mover ${label} para baixo`} title="Mover para baixo">▼</button>
    </div>
  );
}
