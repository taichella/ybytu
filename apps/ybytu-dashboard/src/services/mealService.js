import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-meals', {
    body: { action, ...extra },
    formatError: (data) =>
      data.error === 'invalid_ingredient_food_ids' && Array.isArray(data.missing)
        ? `Ingredientes inválidos: ${data.missing.join(', ')}`
        : null,
  });
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
  async getFoodsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const { foods } = await invoke('search_foods', { ids });
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
