import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase auth callback. Email links (password recovery, email confirmation)
 * come back here with a `code` we exchange for a session, then forward the user
 * to `next` (e.g. /reset-password to set a new password, or /onboarding after
 * confirming). Falls back to /login when there's nothing to exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
