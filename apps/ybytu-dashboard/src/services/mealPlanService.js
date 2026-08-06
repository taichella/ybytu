import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-meal-plans', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const mealPlanService = {
  async getAll(filters = {}) {
    const { meal_plans } = await invoke('list', filters);
    return meal_plans;
  },
  async getById(id) {
    return invoke('get', { id });
  },
  async getLookups() {
    return invoke('lookups');
  },
  async searchMeals(search) {
    const { meals } = await invoke('search_meals', { search });
    return meals;
  },
  async create(planData, slots) {
    const { meal_plan } = await invoke('create', { data: planData, slots });
    return meal_plan;
  },
  async update(id, planData, slots) {
    const { meal_plan } = await invoke('update', { id, data: planData, slots });
    return meal_plan;
  },
  async setActive(id, isActive) {
    const { meal_plan } = await invoke('set_active', { id, is_active: isActive });
    return meal_plan;
  },
};
