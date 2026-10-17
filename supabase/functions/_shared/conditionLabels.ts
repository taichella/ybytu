// Nome em português (minúsculo, para meio de frase) de cada condição usada nas
// marcações de "evitar"/"cautela" dos exercícios (exercise_effective_cautions).
// Usado nas mensagens do construtor de treino (2026-10-17). Sete slugs não têm
// nome em nenhuma tabela (vêm da ponte physical_condition_exercise_slugs), por
// isso a lista é explícita; slug fora da lista aparece como está.
export const CONDITION_LABEL_PTBR: Record<string, string> = {
  pregnancy: 'gravidez',
  pregnancy_postpartum: 'pós-parto',
  back_pain: 'dor nas costas',
  cervical_hernia: 'hérnia cervical',
  lumbar_hernia: 'hérnia lombar',
  lumbar_pain: 'dor lombar',
  neck_pain: 'dor no pescoço',
  joint_problems_severe: 'problemas articulares graves',
  ankle_pain: 'dor no tornozelo',
  knee_pain: 'dor no joelho',
  shoulder_pain: 'dor no ombro',
  elbow_pain: 'dor no cotovelo',
  wrist_pain: 'dor no pulso',
  hip_pain: 'dor no quadril',
  groin_pain: 'dor na virilha',
  hamstring_injury: 'lesão no isquiotibial',
  pelvic_floor_issues: 'problemas no assoalho pélvico',
  asthma: 'asma',
  diabetes: 'diabetes',
  heart_condition: 'condição cardíaca',
  high_blood_pressure: 'hipertensão',
  obesity: 'obesidade',
}

export function conditionLabel(slug: string): string {
  return CONDITION_LABEL_PTBR[slug] ?? slug
}
