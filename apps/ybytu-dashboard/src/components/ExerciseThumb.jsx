import { useState } from 'react';

// Miniatura de exercício que NUNCA mostra imagem quebrada.
//   sources: URLs em ordem de preferência (miniatura, original). Se a 1ª
//            falha (404 -- a miniatura ainda não foi enviada ao R2), tenta a
//            próxima; se todas falham (ou não há nenhuma), mostra o espaço
//            reservado.
//   label:   texto do espaço reservado. Com `label` e caixa larga o suficiente
//            mostra o NOME do exercício; caixa pequena mostra as iniciais.
//            Sem `label`, mostra o ícone genérico.
// Usado no card de inserir exercício (construtor), na ficha do dia, na lista
// de exercícios e no PDF/tela do aluno (UserPlan).

function initials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return (words[0][0] + (words[1]?.[0] ?? words[0][1] ?? '')).toUpperCase();
}

export default function ExerciseThumb({ sources = [], label = '', width = 44, height = 44, radius = 9, className = '', style = {}, renderEmpty = null }) {
  const px = (v) => (typeof v === 'number' ? `${v}px` : v);
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  // Chave da lista: se as fontes mudam (outro exercício na mesma célula), volta a tentar do início.
  const listKey = list.join('|');
  const [state, setState] = useState({ key: listKey, index: 0 });
  const index = state.key === listKey ? state.index : 0;
  const src = list[index];

  const box = {
    width: px(width), height: px(height), borderRadius: px(radius), overflow: 'hidden', flexShrink: 0,
    background: 'var(--surface-2, #f1f5f9)', border: '1px solid var(--border, #e2e8f0)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', ...style,
  };

  if (!src) {
    // Espaço reservado próprio de quem chama (ex: card da grade de exercícios).
    if (renderEmpty) return <div className={`ex-thumb ex-thumb-empty ${className}`.trim()} style={{ width: px(width), height: px(height), ...style }} data-thumb="placeholder">{renderEmpty()}</div>;
    const wide = label && (typeof width !== 'number' || width >= 64);
    return (
      <div className={`ex-thumb ex-thumb-empty ${className}`.trim()} style={box} title={label || undefined} data-thumb="placeholder">
        {wide ? (
          <span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1.15, color: 'var(--muted, #64748b)', textAlign: 'center', padding: '3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{label}</span>
        ) : label ? (
          <span style={{ fontSize: `${Math.max(10, Math.round((typeof width === 'number' ? width : 44) / 3.2))}px`, fontWeight: 800, color: 'var(--muted, #64748b)' }}>{initials(label)}</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted, #64748b)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>
        )}
      </div>
    );
  }

  return (
    <div className={`ex-thumb ${className}`.trim()} style={box} data-thumb="image">
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        onError={() => setState({ key: listKey, index: index + 1 })}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
