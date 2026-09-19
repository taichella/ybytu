// Extraído de UserDetail.jsx (cards de parecer Personal/Nutricionista)
// Quatro estados por seção:
//   1. Nunca respondeu -> "Não informado" (alerta)
//   2. Declarou "Nenhuma" -> "Nenhuma (declarado pelo aluno)"
//   3. Declarou condições, nenhuma relevante para esta especialidade -> "Nenhuma relevante para nutrição (X declaradas)" (tom neutro)
//   4. Tem condições relevantes -> lista de tags

// ID fixo da opção "Nenhuma" no catálogo health_conditions (confirmado no banco)
export const NONE_OPTION_ID_HEALTH = 'f2d72dfc-6065-4357-842e-1ccb6474e2dc';

// Catálogo real de health_conditions (fonte da verdade: tabela public.health_conditions do Supabase)
// Mapeamento explícito de IDs (UUIDs e slugs) para as especialidades médicas/profissionais.
export const HEALTH_CONDITIONS_CATALOG = {
  // Diabetes: hipoglicemia no treino; contagem de carboidratos, IG e glicemia na nutrição
  '3a567725-3e69-4269-ac68-949b54a43b03': {
    slug: 'diabetes',
    label: 'Diabetes',
    specialties: ['training', 'nutrition'],
  },
  // Hipertensão: pico pressórico e Valsalva no treino; controle de sódio/DASH na nutrição
  '3802d595-4880-454d-a9d4-93dc7c4d00fb': {
    slug: 'high_blood_pressure',
    label: 'Hipertensão',
    specialties: ['training', 'nutrition'],
  },
  // Gravidez: postura, frouxidão e FC no treino; calorias por trimestre e micronutrientes na nutrição
  '7a298e56-1036-40c7-85f7-e615c5012091': {
    slug: 'pregnancy',
    label: 'Gravidez',
    specialties: ['training', 'nutrition'],
  },
  // Pós-parto: assoalho pélvico e diástase no treino; demanda calórica/hídrica na lactação
  '801533a8-c762-4d0e-8275-a99e7db6c3f7': {
    slug: 'pregnancy_postpartum',
    label: 'Pós-parto',
    specialties: ['training', 'nutrition'],
  },
  // Obesidade: proteção articular no treino; balanço energético e saciedade na nutrição
  '6470cb69-0bb6-462f-9c16-dcebb4bf84ca': {
    slug: 'obesity',
    label: 'Obesidade',
    specialties: ['training', 'nutrition'],
  },
  // Condição Cardíaca: limites de FC e intensidade no treino; controle de lípides/sódio/estimulantes
  '2d342a06-83fd-44f6-bb70-a25a864de876': {
    slug: 'heart_condition',
    label: 'Condição Cardíaca',
    specialties: ['training', 'nutrition'],
  },
  // Asma: broncoespasmo induzido por esforço; sem impacto dietético direto
  '10a8b1c6-3602-481b-923b-0cf6277b9bea': {
    slug: 'asthma',
    label: 'Asma',
    specialties: ['training'],
  },
  // Ansiedade: classificação provisória, pendente de validação da nutricionista, ver docs/POS_PILOTO.md
  'ba4bd85c-6569-40ac-a467-d94f19eb8e1d': {
    slug: 'anxiety',
    label: 'Ansiedade',
    specialties: ['training', 'nutrition'],
  },
  // Depressão: classificação provisória, pendente de validação da nutricionista, ver docs/POS_PILOTO.md
  'ba1eb16d-6a89-40e3-8f61-071cfd7bf2a9': {
    slug: 'depression',
    label: 'Depressão',
    specialties: ['training', 'nutrition'],
  },
  // Problemas de Equilíbrio: seleção biomecânica de exercícios seguros e apoio
  'b805a72f-d11c-41a8-8b03-b4e4ebf8983b': {
    slug: 'balance_issues',
    label: 'Problemas de Equilíbrio',
    specialties: ['training'],
  },
  // Outra: por precaução clínica, visível para ambos
  'bee3f528-7bd5-47c5-8835-bedb5def29a1': {
    slug: 'other',
    label: 'Outra',
    specialties: ['training', 'nutrition'],
  },
  // Nenhuma: gerenciada via flag declaredNoneHealth
  'f2d72dfc-6065-4357-842e-1ccb6474e2dc': {
    slug: 'none',
    label: 'Nenhuma',
    specialties: ['training', 'nutrition'],
  },
};

// REGRA DE PRECAUÇÃO CLÍNICA (FAIL-SAFE):
// Qualquer condição nova no banco sem classificação prévia no mapa DEVE aparecer
// nos DOIS cards por segurança do paciente/aluno, NUNCA em nenhum.
export function isHealthConditionForSpecialty(identifier, specialty) {
  if (!identifier) return false;
  const str = String(identifier).trim();

  // 1. Busca por UUID exato
  if (HEALTH_CONDITIONS_CATALOG[str]) {
    return HEALTH_CONDITIONS_CATALOG[str].specialties.includes(specialty);
  }

  // 2. Busca secundária por slug ou nome (caso o catálogo receba string resolvida)
  const norm = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const item of Object.values(HEALTH_CONDITIONS_CATALOG)) {
    const itemNorm = item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (item.slug === norm || itemNorm === norm) {
      return item.specialties.includes(specialty);
    }
  }

  // 3. Condição nova/não classificada: PRECAUÇÃO MÁXIMA -> aparece nos DOIS cards
  return true;
}

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

  // Fallback padrão se não informado specialty
  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Limitações declaradas</p>
      <LimitationGroup title="Físicas & Lesões" items={physicalConditions} declaredNone={declaredNonePhysical} colorFor={physicalColor} />
      <LimitationGroup title="Alimentares" items={dietaryRestrictions} declaredNone={declaredNoneDietary} colorFor={dietaryColor} />
    </div>
  );
}
