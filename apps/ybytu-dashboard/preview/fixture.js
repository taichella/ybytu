// Fixture de preview -- dados REAIS do catálogo (consultados no banco em
// 2026-09-05), usados só pra renderizar a tela sem depender de login de staff
// (o ambiente local não autentica, ver docs/DEBITO_AMBIENTE_LOCAL_20260901.md).
// Esta pasta não faz parte do build da app.

const EXERCISES = [
  {
    id: '2137a13c-1f41-48c3-82b3-cc52139e4476', exercise_id: 'ex_001',
    name_ptbr: 'Agachamento livre', name_en: 'Bodyweight Squat', name_fr: 'Squat au poids du corps',
    muscle_groups_ids: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    exercise_equipments_ids: ['none_bodyweight'], exercise_level_id: 'beginner',
    calories: 150, image_url: null,
    avoid_health_conditions_ids: ['pregnancy'],
    caution_health_condition_ids: ['asthma', 'diabetes', 'knee_pain', 'high_blood_pressure', 'lumbar_hernia', 'obesity', 'heart_condition', 'pregnancy_postpartum'],
  },
  {
    id: '37c3fa93-e840-41cc-8daa-187e33385e9b', exercise_id: 'ex_007',
    name_ptbr: 'Leg press', name_en: 'Leg Press', name_fr: 'Presse à cuisses',
    muscle_groups_ids: ['quadriceps', 'glutes', 'hamstrings'],
    exercise_equipments_ids: ['leg_press'], exercise_level_id: 'intermediate',
    calories: 160, image_url: null,
    // sentinela 'none' -- exercício SEM restrição; antes da correção o badge
    // mostrava "2" aqui.
    avoid_health_conditions_ids: ['none'],
    caution_health_condition_ids: ['none'],
  },
  {
    id: 'd0735049-9994-416a-9bd5-70a5d46be667', exercise_id: 'ex_174',
    name_ptbr: 'Flexão de braço tradicional', name_en: 'Push-up', name_fr: 'Pompe classique',
    muscle_groups_ids: ['pectoralis_major', 'triceps_brachii', 'deltoids', 'core'],
    exercise_equipments_ids: ['none_bodyweight'], exercise_level_id: 'beginner',
    calories: 170, image_url: null,
    avoid_health_conditions_ids: ['pregnancy'],
    caution_health_condition_ids: ['asthma', 'diabetes', 'high_blood_pressure', 'obesity', 'heart_condition', 'shoulder_pain', 'pregnancy_postpartum'],
  },
  {
    id: '4ef93daf-a76f-4211-8294-e1056b0f3e8b', exercise_id: 'ex_194',
    name_ptbr: 'Flexão de braço com pegada fechada', name_en: 'Close-grip push-up', name_fr: 'Pompes prise serrée',
    muscle_groups_ids: ['biceps_brachii', 'chest', 'triceps_brachii', 'deltoids'],
    exercise_equipments_ids: ['none_bodyweight'], exercise_level_id: 'beginner',
    calories: 150, image_url: null,
    avoid_health_conditions_ids: ['pregnancy'],
    caution_health_condition_ids: ['asthma', 'diabetes', 'high_blood_pressure', 'obesity', 'heart_condition', 'shoulder_pain', 'pregnancy_postpartum'],
  },
  {
    id: 'f4a9e69c-e5d3-40af-899e-233d27ce6872', exercise_id: 'ex_216',
    name_ptbr: 'Flexão de braço com pegada fechada', name_en: 'Close-Grip Push-Up', name_fr: 'Pompes prise serrée',
    muscle_groups_ids: ['triceps_brachii', 'chest', 'deltoids', 'core'],
    exercise_equipments_ids: ['none_bodyweight'], exercise_level_id: 'beginner',
    calories: 150, image_url: null,
    avoid_health_conditions_ids: ['pregnancy'],
    caution_health_condition_ids: ['asthma', 'diabetes', 'high_blood_pressure', 'obesity', 'heart_condition', 'shoulder_pain', 'pregnancy_postpartum'],
  },
  {
    id: '2993af20-b65b-4cca-a52f-a7c892916530', exercise_id: 'ex_285',
    name_ptbr: 'Wall Ball', name_en: 'Wall Ball', name_fr: 'Wall Ball',
    muscle_groups_ids: ['full_body'],
    exercise_equipments_ids: ['medicine_ball'], exercise_level_id: 'intermediate',
    calories: 280, image_url: null,
    avoid_health_conditions_ids: ['pregnancy'],
    caution_health_condition_ids: ['asthma', 'high_blood_pressure', 'obesity', 'heart_condition', 'pregnancy_postpartum'],
  },
];

const LOOKUPS = {
  muscle_groups: [
    { id: '1', muscle_group_id: 'quadriceps', name_ptbr: 'Quadríceps' },
    { id: '2', muscle_group_id: 'glutes', name_ptbr: 'Glúteos' },
    { id: '3', muscle_group_id: 'hamstrings', name_ptbr: 'Posteriores' },
    { id: '4', muscle_group_id: 'core', name_ptbr: 'Core' },
    { id: '5', muscle_group_id: 'pectoralis_major', name_ptbr: 'Peitoral' },
    { id: '6', muscle_group_id: 'chest', name_ptbr: 'Peito' },
    { id: '7', muscle_group_id: 'triceps_brachii', name_ptbr: 'Tríceps' },
    { id: '8', muscle_group_id: 'biceps_brachii', name_ptbr: 'Bíceps' },
    { id: '9', muscle_group_id: 'deltoids', name_ptbr: 'Ombros' },
    { id: '10', muscle_group_id: 'full_body', name_ptbr: 'Corpo inteiro' },
  ],
  exercise_equipments: [
    { id: '1', exercise_equipment_id: 'none_bodyweight', name_ptbr: 'Peso corporal' },
    { id: '2', exercise_equipment_id: 'leg_press', name_ptbr: 'Leg press' },
    { id: '3', exercise_equipment_id: 'medicine_ball', name_ptbr: 'Medicine ball' },
  ],
  exercise_levels: [
    { id: '1', exercise_level_id: 'beginner', name_ptbr: 'Iniciante' },
    { id: '2', exercise_level_id: 'intermediate', name_ptbr: 'Intermediário' },
    { id: '3', exercise_level_id: 'advanced', name_ptbr: 'Avançado' },
  ],
  health_conditions: [
    { id: '1', health_condition_id: 'pregnancy', name_ptbr: 'Gravidez' },
    { id: '2', health_condition_id: 'asthma', name_ptbr: 'Asma' },
    { id: '3', health_condition_id: 'diabetes', name_ptbr: 'Diabetes' },
    { id: '4', health_condition_id: 'knee_pain', name_ptbr: 'Dor no joelho' },
    { id: '5', health_condition_id: 'high_blood_pressure', name_ptbr: 'Hipertensão' },
    { id: '6', health_condition_id: 'lumbar_hernia', name_ptbr: 'Hérnia lombar' },
    { id: '7', health_condition_id: 'obesity', name_ptbr: 'Obesidade' },
    { id: '8', health_condition_id: 'heart_condition', name_ptbr: 'Condição cardíaca' },
    { id: '9', health_condition_id: 'shoulder_pain', name_ptbr: 'Dor no ombro' },
    { id: '10', health_condition_id: 'pregnancy_postpartum', name_ptbr: 'Pós-parto' },
  ],
};

export const exerciseService = {
  async getAll() { return EXERCISES; },
  async getLookups() { return LOOKUPS; },
  async getById(id) { return EXERCISES.find((e) => e.id === id); },
};
