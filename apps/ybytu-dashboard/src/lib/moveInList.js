// Move um item de posição numa lista (reordenação dos construtores,
// ver components/ReorderControls.jsx). Índice inválido devolve a lista igual.
export function moveInList(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
