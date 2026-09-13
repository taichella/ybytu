import { invokeFunction } from './apiClient.js';

async function invoke(action, extra = {}) {
  return invokeFunction('ybytu-admin-equipments', {
    body: { action, ...extra },
  });
}

export const equipmentService = {
  async getAll() {
    const { equipments } = await invoke('list');
    return equipments;
  },

  async create(equipmentData) {
    const { equipment } = await invoke('create', { data: equipmentData });
    return equipment;
  },

  async update(id, equipmentData) {
    const { equipment } = await invoke('update', { id, data: equipmentData });
    return equipment;
  },
};
