import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

export const failedPlansService = {
  async getAll() {
    const headers = await authHeaders();
    const { data, error } = await supabase.functions.invoke('ybytu-admin-failed-plans', { headers });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
  async retry(userId) {
    const headers = await authHeaders();
    const { data, error } = await supabase.functions.invoke('ybytu-admin-retry-plan-generation', {
      headers,
      body: { user_id: userId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
};
