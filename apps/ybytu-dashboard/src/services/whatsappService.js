import { supabase } from '../lib/supabase';

export const whatsappService = {
  async sendPlanToWhatsApp(userPhone, planData) {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: { userPhone, planData }
    });

    if (error) {
      throw error;
    }

    return data;
  }
};
