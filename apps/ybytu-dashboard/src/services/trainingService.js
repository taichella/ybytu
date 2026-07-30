import { supabase } from '../lib/supabase';

export const trainingService = {
  async create(planData) {
    const { data, error } = await supabase
      .from('training_plans')
      .insert([planData])
      .select();

    if (error) throw error;
    return data[0];
  }
};
