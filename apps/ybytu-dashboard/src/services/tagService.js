import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, type = 'gerais', extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-tags', {
    headers,
    body: { action, type, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
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
