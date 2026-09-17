// Extraído de UserDetail.jsx (cards de parecer Personal/Nutricionista) --
// achado 2026-09-17 (revisão Antigravity): array vazio/null era tratado
// igual a "aluno declarou não ter nenhuma limitação", mesmo texto de quando
// o aluno realmente marca a opção "Nenhuma" no onboarding. 3 estados reais:
//   1. declaredNone (backend confirmou via id, ver buildPlanPayload.ts /
//      ybytu-admin-users) -- aluno respondeu, marcou que não tem
//   2. array vazio/null e !declaredNone -- nunca respondeu -- NÃO É a mesma coisa
//   3. array com itens -- lista normal
function LimitationGroup({ title, items, declaredNone, colorFor }) {
  const hasItems = items && items.length > 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{title}</p>
      {declaredNone ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Nenhuma (declarado pelo aluno)</span>
      ) : hasItems ? (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {items.map((g, i) => {
            const { bg, color, border } = colorFor(g);
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 700, background: bg, color, border: `1px solid ${border}` }}>{g}</span>
            );
          })}
        </div>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--danger)', fontWeight: 700 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01"></path><circle cx="12" cy="12" r="9"></circle></svg>
          Não informado
        </span>
      )}
    </div>
  );
}

function physicalColor(g) {
  if (g.toLowerCase().includes('outra')) return { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'rgba(239,68,68,.2)' };
  return { bg: 'rgba(217,119,6,.12)', color: '#d97706', border: 'rgba(217,119,6,.2)' };
}

function dietaryColor(g) {
  if (g.toLowerCase().includes('outra')) return { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'rgba(239,68,68,.2)' };
  return { bg: 'var(--surface-2)', color: 'var(--text)', border: 'var(--border)' };
}

export default function UserLimitationsList({ physicalConditions, dietaryRestrictions, declaredNonePhysical, declaredNoneDietary }) {
  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Limitações declaradas</p>
      <LimitationGroup title="Físicas & Lesões" items={physicalConditions} declaredNone={declaredNonePhysical} colorFor={physicalColor} />
      <LimitationGroup title="Alimentares" items={dietaryRestrictions} declaredNone={declaredNoneDietary} colorFor={dietaryColor} />
    </div>
  );
}
