import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(action, extra = {}) {
  const headers = await authHeaders();
  const { data, error } = await supabase.functions.invoke('ybytu-admin-exercises', {
    headers,
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
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
