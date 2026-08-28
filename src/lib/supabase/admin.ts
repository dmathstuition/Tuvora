import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/public-env';
import { serverEnv } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 *
 * Use ONLY in trusted server contexts that must act across tenants:
 *   - payment/webhook processing
 *   - the onboarding action that atomically creates an org + owner membership
 *   - platform-admin service functions
 *
 * Never expose this client or the service role key to the browser, and always
 * re-derive the acting user + organization server-side before writing.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
