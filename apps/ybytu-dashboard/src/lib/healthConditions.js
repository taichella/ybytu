// Catálogo de health_conditions por especialidade (Treino / Nutrição).
// Movido de components/UserLimitationsList.jsx em 2026-09-25: um arquivo .jsx que
// exporta constantes/funções além do componente quebra o fast refresh e o lint
// (react-refresh/only-export-components).

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
