import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

export const pendingReviewsService = {
  async getAll() {
    const headers = await authHeaders();
    const { data, error } = await supabase.functions.invoke('ybytu-pending-plan-reviews', { headers });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
};
