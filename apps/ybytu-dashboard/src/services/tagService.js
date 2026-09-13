import { invokeFunction } from './apiClient.js';

async function invoke(action, type = 'gerais', extra = {}) {
  return invokeFunction('ybytu-admin-tags', {
    body: { action, type, ...extra },
  });
}

export const tagService = {
  async getAll(type = 'gerais') {
    const { tags } = await invoke('list', type);
    return tags;
  },

  async create(type, tagData) {
    const { tag } = await invoke('create', type, { data: tagData });
    return tag;
  },

  async update(type, id, tagData) {
    const { tag } = await invoke('update', type, { id, data: tagData });
    return tag;
  },
};
