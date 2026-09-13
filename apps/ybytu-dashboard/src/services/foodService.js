import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-foods', {
    body: { action, ...extra },
  });
}

export const foodService = {
  async getAll() {
    const { foods } = await invoke('list');
    return foods;
  },

  async getById(id) {
    const { food } = await invoke('get', { id });
    return food;
  },

  async getLookups() {
    return invoke('lookups');
  },

  async create(foodData) {
    const { food } = await invoke('create', { data: foodData });
    return food;
  },

  async update(id, foodData) {
    const { food } = await invoke('update', { id, data: foodData });
    return food;
  },
};
