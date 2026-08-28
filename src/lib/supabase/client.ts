'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/public-env';
import type { Database } from '@/types/database.types';

/** Browser Supabase client. Uses the anon key — always subject to RLS. */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
