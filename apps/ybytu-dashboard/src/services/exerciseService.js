import { supabase } from '../lib/supabase.js';

export const exerciseService = {
  _sanitizeData(data) {
    const sanitized = { ...data };
    return sanitized;
  },

  async getAll() {
    const { data, error } = await supabase.from('exercises').select('*');
    if (error) throw error;
    return data.map(item => ({
       ...item,
       equips: item.equips || ['Nenhum'],
       avoid: item.avoid || 0,
       caution: item.caution || 0
    }));
  },

  async getById(id) {
    const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (error) throw error;
    return {
       ...data,
       equips: data.equips || ['Nenhum'],
       avoid: data.avoid || 0,
       caution: data.caution || 0
    };
  },

  async create(exerciseData) {
    const payload = this._sanitizeData(exerciseData);
    const { data, error } = await supabase.functions.invoke('admin-catalog-exercises', {
        method: 'POST',
        body: payload
    });
    if (error) throw error;
    return data;
  },

  async update(id, exerciseData) {
    const payload = this._sanitizeData(exerciseData);
    const { data, error } = await supabase.functions.invoke(`admin-catalog-exercises?id=${id}`, {
        method: 'PUT',
        body: payload
    });
    if (error) throw error;
    return data;
  },

  async delete(id) {
    throw new Error('Deletes destrutivos não são permitidos no projeto.');
  }
};
