import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jwjfmvkfzelbdvyqetyb.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NPp7sXlnySRgcATvV2K2fA_FD-kgfsx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
