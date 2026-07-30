import { supabase } from '../lib/supabase.js';

export const foodService = {
  // Utility function to remove fields not present in the database schema
  _sanitizeData(data) {
    const sanitized = { ...data };
    const validFields = ['id', 'emoji', 'name', 'sub', 'group', 'portion', 'kcal', 'prot', 'carbs', 'fat', 'tags'];

    // Removing mock data specific fields or incorrect field names (like carb instead of carbs)
    Object.keys(sanitized).forEach(key => {
      if (!validFields.includes(key)) {
        if (key === 'carb') sanitized['carbs'] = sanitized[key]; // Just in case it was renamed
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
           carb: item.carbs || 0 // Assuming 'carbs' is the real column name. We map it back to what frontend expects.
        };
    });
  },

  async getById(id) {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).single();
    if (error) throw error;
    return { ...data, carb: data.carbs || 0 };
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
