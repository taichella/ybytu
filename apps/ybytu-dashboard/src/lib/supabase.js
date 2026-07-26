import { createClient } from '@supabase/supabase-js';

// Essas variáveis vão puxar as chaves de segurança do seu arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);