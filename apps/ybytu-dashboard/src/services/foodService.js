import { supabase } from '../lib/supabase.js';

export const foodService = {
  _sanitizeData(data) {
    const sanitized = { ...data };

    if (sanitized.carb !== undefined) {
        sanitized.carbs_g = sanitized.carb;
        delete sanitized.carb;
    }

    if (sanitized.kcal !== undefined) {
        sanitized.calories_per_unit = sanitized.kcal;
        delete sanitized.kcal;
    }

    return sanitized;
  },

  async getAll() {
    const { data, error } = await supabase.from('foods').select('*');
    if (error) throw error;
    return data.map(item => {
        return {
           ...item,
           carb: item.carbs_g || 0,
           kcal: item.calories_per_unit || 0
        };
    });
  },

  async getById(id) {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).single();
    if (error) throw error;
    return {
        ...data,
        carb: data.carbs_g || 0,
        kcal: data.calories_per_unit || 0
    };
  },

  async create(foodData) {
    const payload = this._sanitizeData(foodData);
    const { data, error } = await supabase.functions.invoke('admin-catalog-foods', {
        method: 'POST',
        body: payload
    });
    if (error) throw error;
    return data;
  },

  async update(id, foodData) {
    const payload = this._sanitizeData(foodData);
    const { data, error } = await supabase.functions.invoke(`admin-catalog-foods?id=${id}`, {
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
