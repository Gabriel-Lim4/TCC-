import { createClient } from '@supabase/supabase-js';
import env from './env.js';

export function createAuthClient() {
  return createClient(env.supabase.url, env.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const supabase = createAuthClient();
