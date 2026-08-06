import { supabase } from '../lib/supabase.js';

export const foodService = {
  // Utility function to rename fields to match the database schema
  _sanitizeData(data) {
    const validFields = [
      'food_id', 'name_ptbr', 'name_en', 'name_fr', 'food_group_id', 'food_source_id',
      'food_type_id', 'brand', 'food_preparation_method_id', 'quantity', 'food_measurement_unit_id',
      'correction_factor', 'cooking_factor', 'calories_per_unit', 'protein_g', 'carbs_g', 'fat_g',
      'fiber_g', 'sugar_g', 'fat_sat_g', 'fat_trans_g', 'cholesterol_mg', 'sodium_mg', 'calcium_mg',
      'iron_mg', 'potassium_mg', 'magnesium_mg', 'vitamins_ids', 'minerals_ids', 'dietary_restrictions_ids',
      'diet_tags_ids', 'functional_tags_ids', 'tags_ids', 'food_facts_source_id', 'url_image', 'dietary_preference'
    ];

    const sanitized = {};

    // Attempting sensible default mappings where possible from previous model
    // E.g. 'name' -> 'name_ptbr'
    if (data.name) sanitized.name_ptbr = data.name;
    if (data.kcal) sanitized.calories_per_unit = data.kcal;
    if (data.prot) sanitized.protein_g = data.prot;
    if (data.carb) sanitized.carbs_g = data.carb;
    if (data.fat) sanitized.fat_g = data.fat;

    Object.keys(data).forEach(key => {
        if (validFields.includes(key)) {
            sanitized[key] = data[key];
        }
    });

    return sanitized;
  },

  async getAll() {
    const { data, error } = await supabase.functions.invoke('admin-catalog-foods', { method: 'GET' });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    // Currently edge function does not support by ID GET, will return all and filter
    const { data, error } = await supabase.functions.invoke('admin-catalog-foods', { method: 'GET' });
    if (error) throw error;
    return data.find(item => item.id === id);
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
    payload.id = id;
    const { data, error } = await supabase.functions.invoke('admin-catalog-foods', {
        method: 'PUT',
        body: payload
    });
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase.functions.invoke('admin-catalog-foods', {
        method: 'DELETE',
        body: { id }
    });
    if (error) throw error;
    return data;
  }
};
