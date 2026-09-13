import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-trainings', {
    body: { action, ...extra },
    errorMap: {
      molde_deactivation_blocked: 'Este treino é um molde ativo (fonte do gerador) — não pode ser desativado.',
    },
  });
}

export const trainingService = {
  async getAll(filters = {}) {
    const { training_plans } = await invoke('list', filters);
    return training_plans;
  },
  async getById(id) {
    return invoke('get', { id });
  },
  async getLookups() {
    return invoke('lookups');
  },
  async searchExercises(search) {
    const { exercises } = await invoke('search_exercises', { search });
    return exercises;
  },
  async create(planData, slots) {
    const { training_plan } = await invoke('create', { data: planData, slots });
    return training_plan;
  },
  async update(id, planData, slots) {
    const { training_plan } = await invoke('update', { id, data: planData, slots });
    return training_plan;
  },
  async setActive(id, isActive) {
    const { training_plan } = await invoke('set_active', { id, is_active: isActive });
    return training_plan;
  },
};
