import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-meal-plans', {
    body: { action, ...extra },
  });
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
