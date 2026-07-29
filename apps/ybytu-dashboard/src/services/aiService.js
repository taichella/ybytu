import { supabase } from '../lib/supabase.js';

export const generateTrainingPlan = async (payload) => {
  const { data, error } = await supabase.functions.invoke('ybytu-generate-training-plan', {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const generateMealPlan = async (payload) => {
  const { data, error } = await supabase.functions.invoke('ybytu-generate-meal-plan', {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data;
};
