import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-foods', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
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
