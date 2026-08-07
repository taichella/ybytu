import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-equipments', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
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
