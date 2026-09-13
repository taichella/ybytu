import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-exercises', {
    body: { action, ...extra },
  });
}

export const exerciseService = {
  async getAll(filters = {}) {
    const { exercises } = await invoke('list', filters);
    return exercises;
  },

  async getById(id) {
    const { exercise } = await invoke('get', { id });
    return exercise;
  },

  async getLookups() {
    return invoke('lookups');
  },

  async create(exerciseData) {
    const { exercise } = await invoke('create', { data: exerciseData });
    return exercise;
  },

  async update(id, exerciseData) {
    const { exercise } = await invoke('update', { id, data: exerciseData });
    return exercise;
  },
};
