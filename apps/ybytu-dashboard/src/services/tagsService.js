import { supabase } from '../lib/supabase.js';

export const tagsService = {
  async getAll() {
    const { data, error } = await supabase.functions.invoke('admin-catalog-tags', { method: 'GET' });
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.functions.invoke('admin-catalog-tags', {
        method: 'POST',
        body: payload
    });
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase.functions.invoke('admin-catalog-tags', {
        method: 'PUT',
        body: { id, ...payload }
    });
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.functions.invoke('admin-catalog-tags', {
        method: 'DELETE',
        body: { id }
    });
    if (error) throw error;
    return data;
  }
};
