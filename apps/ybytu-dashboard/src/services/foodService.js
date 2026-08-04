import { supabase } from '../lib/supabase.js';

export const foodService = {
  // Utility function to remove fields not present in the database schema
  _sanitizeData(data) {
    const sanitized = { ...data };
    const validFields = [
      'food_id',
      'name_ptbr',
      'calories_per_unit'
    ];

    Object.keys(sanitized).forEach(key => {
      if (!validFields.includes(key)) {
        delete sanitized[key];
      }
    });

    return sanitized;
  },

  async getAll() {
    const { data, error } = await supabase.from('foods').select('*');
    if (error) throw error;
    return data.map(item => {
        // Map back carbs to carb for frontend if needed, though frontend expects carb
        return {
           ...item,
           carb: item.carbs_g || 0
        };
    });
  },

  async getById(id) {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).single();
    if (error) throw error;
    return { ...data, carb: data.carbs_g || 0 };
  },

  async create(foodData) {
    const payload = this._sanitizeData(foodData);
    const { data, error } = await supabase.from('foods').insert([payload]).select();
    if (error) throw error;
    return data;
  },

  async update(id, foodData) {
    const payload = this._sanitizeData(foodData);
    const { data, error } = await supabase.from('foods').update(payload).eq('id', id).select();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.from('foods').delete().eq('id', id).select();
    if (error) throw error;
    return data;
  }
};
