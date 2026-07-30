import { supabase } from '../lib/supabase.js';

export const exerciseService = {
  // Utility function to remove fields not present in the database schema
  _sanitizeData(data) {
    const sanitized = { ...data };
    const validFields = ['id', 'name', 'ref', 'groups', 'level', 'kcal', 'langs'];

    Object.keys(sanitized).forEach(key => {
      if (!validFields.includes(key)) {
        delete sanitized[key];
      }
    });

    return sanitized;
  },

  async getAll() {
    const { data, error } = await supabase.from('exercises').select('*');
    if (error) throw error;
    // adding default mock fields expected by the UI that don't exist in DB schema
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
    const { data, error } = await supabase.from('exercises').insert([payload]).select();
    if (error) throw error;
    return data;
  },

  async update(id, exerciseData) {
    const payload = this._sanitizeData(exerciseData);
    const { data, error } = await supabase.from('exercises').update(payload).eq('id', id).select();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.from('exercises').delete().eq('id', id).select();
    if (error) throw error;
    return data;
  }
};
