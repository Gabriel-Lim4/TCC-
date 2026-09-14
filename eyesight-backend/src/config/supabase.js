import { createClient } from '@supabase/supabase-js';
import env from './env.js';

console.log('[SUPABASE] URL:', env.supabase.url);
console.log('[SUPABASE] URL válida:', /^https:\/\/.+\.supabase\.co\/?$/.test(env.supabase.url));

export const supabase = createClient(
  env.supabase.url,
  env.supabase.anonKey
);