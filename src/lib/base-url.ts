import 'server-only';
import { headers } from 'next/headers';
import { publicEnv } from '@/lib/public-env';

/**
 * The absolute base URL for the current request (e.g. https://tuvora.app).
 *
 * Derived from the incoming request headers so generated links (invites,
 * portal links) always point at the domain the user is actually on — even if
 * NEXT_PUBLIC_APP_URL is unset or points at a stale deployment. Falls back to
 * the configured app URL when headers are unavailable.
 */
export async function getRequestBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  } catch {
    // headers() unavailable outside a request scope — fall through.
  }
  return publicEnv.appUrl;
}
