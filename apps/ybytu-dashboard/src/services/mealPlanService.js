import { supabase } from '../lib/supabase';

export const mealPlanService = {
  async create(planData) {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert([planData])
      .select();

    if (error) throw error;
    return data[0];
  }
};
