import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-meals', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error === 'invalid_ingredient_food_ids' ? `Ingredientes inválidos: ${data.missing.join(', ')}` : data.error);
  return data;
}

export const mealService = {
  async getAll(filters = {}) {
    const { meals } = await invoke('list', filters);
    return meals;
  },
  async getById(id) {
    const { meal } = await invoke('get', { id });
    return meal;
  },
  async getLookups() {
    return invoke('lookups');
  },
  async searchFoods(search) {
    const { foods } = await invoke('search_foods', { search });
    return foods;
  },
  async create(mealData) {
    const { meal } = await invoke('create', { data: mealData });
    return meal;
  },
  async update(id, mealData) {
    const { meal } = await invoke('update', { id, data: mealData });
    return meal;
  },
  async setActive(id, isActive) {
    const { meal } = await invoke('set_active', { id, is_active: isActive });
    return meal;
  },
};
