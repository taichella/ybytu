import { supabase } from '../lib/supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

export const staffInviteService = {
  async create(email, role) {
    const headers = await authHeaders();
    const { data, error } = await supabase.functions.invoke('ybytu-create-staff-invite', {
      headers,
      body: { email, role },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
};
