import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { publicEnv } from '@/lib/public-env';
import type { Database } from '@/types/database.types';

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/onboarding'];

function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase auth session on every request and gates protected
 * route groups. Wired from the root middleware.ts.
 *
 * Edge middleware runs on EVERY route (including the marketing homepage), so it
 * must never throw — a thrown error surfaces as a site-wide
 * MIDDLEWARE_INVOCATION_FAILED 500. We therefore:
 *   1. Skip auth entirely when Supabase env vars are absent (e.g. a fresh
 *      deploy without configuration) — public pages still render; protected
 *      pages are redirected to /login so they never hit an unconfigured client.
 *   2. Wrap the Supabase call in try/catch so a transient auth error degrades
 *      gracefully instead of taking down the whole site.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // 1. Supabase not configured — do not construct a client (it throws on an
  // empty URL). Send protected routes to /login; let everything else through.
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    if (isProtectedPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  try {
    const supabase = createServerClient<Database>(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isProtected = isProtectedPath(path);
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup');

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    // Never crash the edge on an auth/transient error. Protect sensitive routes
    // by redirecting to /login; allow public routes to render normally.
    if (isProtectedPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }
}
