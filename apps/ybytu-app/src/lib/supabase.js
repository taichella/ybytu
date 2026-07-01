import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jwjfmvkfzelbdvyqetyb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3amZtdmtmemVsYmR2eXFldHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzU3NjIsImV4cCI6MjA4OTUxMTc2Mn0.WWFf3n2-8geNIGVESCl6Ti3wVuEfJVXfAXXwLznqJgs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});