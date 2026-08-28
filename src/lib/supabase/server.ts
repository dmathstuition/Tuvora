import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/public-env';
import type { Database } from '@/types/database.types';

/**
 * Server Supabase client bound to the request cookies. Uses the anon key, so
 * every query is still enforced by RLS as the signed-in user. Use this in
 * Server Components, Route Handlers and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where mutating cookies is disallowed.
          // Safe to ignore — middleware refreshes the session.
        }
      },
    },
  });
}
