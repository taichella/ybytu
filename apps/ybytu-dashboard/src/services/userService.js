import { supabase } from '../lib/supabase';

export const userService = {
  /**
   * Busca a lista de perfis
   * @param {number} limit
   * @param {number} offset
   */
  async getProfiles(limit = 10, offset = 0) {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, count };
  },

  /**
   * Busca um perfil específico pelo ID
   * @param {string} id
   */
  async getProfileById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza os dados de um perfil
   * @param {string} id
   * @param {object} updates
   */
  async updateProfile(id, updates) {
      const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      if (error) throw error;
      return data;
  }
};
