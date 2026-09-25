// Extraído de UserDetail.jsx (cards de parecer Personal/Nutricionista)
// Quatro estados por seção:
//   1. Nunca respondeu -> "Não informado" (alerta)
//   2. Declarou "Nenhuma" -> "Nenhuma (declarado pelo aluno)"
//   3. Declarou condições, nenhuma relevante para esta especialidade -> "Nenhuma relevante para nutrição (X declaradas)" (tom neutro)
//   4. Tem condições relevantes -> lista de tags

import { NONE_OPTION_ID_HEALTH, HEALTH_CONDITIONS_CATALOG, isHealthConditionForSpecialty } from '../lib/healthConditions.js';

function LimitationGroup({ title, items, declaredNone, emptyDeclaredMessage, colorFor }) {
  const hasItems = items && items.length > 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{title}</p>
      {declaredNone ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          Nenhuma (declarado pelo aluno)
        </span>
      ) : emptyDeclaredMessage ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          {emptyDeclaredMessage}
        </span>
      ) : hasItems ? (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {items.map((g, i) => {
            const { bg, color, border } = colorFor(g);
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 700, background: bg, color, border: `1px solid ${border}` }}>
                {g}
              </span>
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
  if (typeof g === 'string' && g.toLowerCase().includes('outra')) return { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'rgba(239,68,68,.2)' };
  return { bg: 'rgba(217,119,6,.12)', color: '#d97706', border: 'rgba(217,119,6,.2)' };
}

function dietaryColor(g) {
  if (typeof g === 'string' && g.toLowerCase().includes('outra')) return { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'rgba(239,68,68,.2)' };
  return { bg: 'var(--surface-2)', color: 'var(--text)', border: 'var(--border)' };
}

function healthColor() {
  return { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'rgba(239,68,68,.2)' };
}

function preferenceColor() {
  return { bg: 'rgba(22,163,74,.12)', color: '#16a34a', border: 'rgba(22,163,74,.24)' };
}

export default function UserLimitationsList({
  specialty,
  physicalConditions,
  dietaryRestrictions,
  healthConditions,
  healthConditionIds,
  dietaryPreference,
  declaredNonePhysical,
  declaredNoneDietary,
  declaredNoneHealth,
}) {
  // 1. Apuração das condições de saúde
  // Suporta IDs reais do banco (UUIDs em healthConditionIds) ou strings resolvidas
  const activeIds = (healthConditionIds ?? []).filter((id) => id !== NONE_OPTION_ID_HEALTH);
  const rawLabels = (healthConditions ?? []).filter((label) => {
    const trimmed = typeof label === 'string' ? label.trim().toLowerCase() : '';
    return trimmed !== 'nenhuma' && trimmed !== 'none';
  });

  // Total real de condições declaradas pelo aluno (excluindo "Nenhuma")
  const totalHealthDeclared = activeIds.length > 0 ? activeIds.length : rawLabels.length;

  // Questionário foi respondido?
  const healthAnswered = Boolean(declaredNoneHealth || totalHealthDeclared > 0);

  // Alerta explícito caso ocorra regressão no backend e os IDs deixem de ser enviados
  if (rawLabels.length > 0 && activeIds.length === 0) {
    console.warn(
      '[UserLimitationsList] healthConditions fornecido com itens, mas healthConditionIds está vazio ou ausente. ' +
      'Possível regressão no backend (ybytu-admin-users); recorrendo provisoriamente ao casamento por rótulo.'
    );
  }

  // Filtra as condições pertinentes para a especialidade atual
  let specialtyHealthItems = [];
  if (activeIds.length > 0) {
    const matchingIds = activeIds.filter((id) => isHealthConditionForSpecialty(id, specialty));
    specialtyHealthItems = matchingIds.map((id) => HEALTH_CONDITIONS_CATALOG[id]?.label || id);
  } else if (rawLabels.length > 0) {
    specialtyHealthItems = rawLabels.filter((label) => isHealthConditionForSpecialty(label, specialty));
  }

  // Quatro estados para Condições de Saúde:
  // - Estado 1: nunca respondeu -> "Não informado" (!healthAnswered)
  // - Estado 2: declarou "Nenhuma" -> declaredNone = true
  // - Estado 3: declarou condições, mas nenhuma relevante para esta especialidade -> emptyDeclaredMessage
  // - Estado 4: tem itens relevantes -> lista
  let healthEmptyDeclaredMessage = null;
  if (!declaredNoneHealth && healthAnswered && specialtyHealthItems.length === 0 && totalHealthDeclared > 0) {
    const specName = specialty === 'nutrition' ? 'nutrição' : 'treino';
    healthEmptyDeclaredMessage = `Nenhuma relevante para ${specName} (${totalHealthDeclared} declarada${totalHealthDeclared > 1 ? 's' : ''})`;
  }

  if (specialty === 'training') {
    return (
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Limitações declaradas · Treino</p>
        <LimitationGroup
          title="Físicas & Lesões"
          items={physicalConditions}
          declaredNone={declaredNonePhysical}
          colorFor={physicalColor}
        />
        <LimitationGroup
          title="Condições de Saúde"
          items={specialtyHealthItems}
          declaredNone={declaredNoneHealth}
          emptyDeclaredMessage={healthEmptyDeclaredMessage}
          colorFor={healthColor}
        />
      </div>
    );
  }

  if (specialty === 'nutrition') {
    return (
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Limitações declaradas · Nutrição</p>
        <LimitationGroup
          title="Restrições Alimentares"
          items={dietaryRestrictions}
          declaredNone={declaredNoneDietary}
          colorFor={dietaryColor}
        />
        <LimitationGroup
          title="Preferência Alimentar"
          items={dietaryPreference ? [dietaryPreference] : []}
          declaredNone={false}
          colorFor={preferenceColor}
        />
        <LimitationGroup
          title="Condições de Saúde"
          items={specialtyHealthItems}
          declaredNone={declaredNoneHealth}
          emptyDeclaredMessage={healthEmptyDeclaredMessage}
          colorFor={healthColor}
        />
      </div>
    );
  }

  // specialty="all" (aba Saúde & metas do detalhe do aluno, 2026-09-25): mostra
  // TUDO que o aluno declarou, sem filtro de especialidade, com os mesmos
  // estados dos cards de parecer -- "Nenhuma" declarada não vira alerta
  // vermelho e vazio não vira "Não informado" quando o aluno marcou Nenhuma.
  if (specialty === 'all') {
    // Rótulos resolvidos no servidor (nomes reais da tabela, "Nenhuma" já fora);
    // catálogo local só se o servidor não mandar os rótulos.
    const allHealthItems = rawLabels.length > 0
      ? rawLabels
      : activeIds.map((hid) => HEALTH_CONDITIONS_CATALOG[hid]?.label || hid);
    return (
      <div>
        <LimitationGroup title="Condições de Saúde" items={allHealthItems} declaredNone={declaredNoneHealth} colorFor={healthColor} />
        <LimitationGroup title="Condições Físicas & Lesões" items={physicalConditions} declaredNone={declaredNonePhysical} colorFor={physicalColor} />
        <LimitationGroup title="Restrições Alimentares" items={dietaryRestrictions} declaredNone={declaredNoneDietary} colorFor={dietaryColor} />
      </div>
    );
  }

  // Fallback padrão se não informado specialty
  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Limitações declaradas</p>
      <LimitationGroup title="Físicas & Lesões" items={physicalConditions} declaredNone={declaredNonePhysical} colorFor={physicalColor} />
      <LimitationGroup title="Alimentares" items={dietaryRestrictions} declaredNone={declaredNoneDietary} colorFor={dietaryColor} />
    </div>
  );
}
