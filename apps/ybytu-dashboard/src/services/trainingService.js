import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-trainings', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error === 'molde_deactivation_blocked') throw new Error('Este treino é um molde ativo (fonte do gerador) — não pode ser desativado.');
  if (data?.error) throw new Error(data.error);
  return data;
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
