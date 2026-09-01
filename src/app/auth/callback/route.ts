import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase auth callback. Email links (email confirmation, password recovery,
 * magic link, invite) come back here — either PKCE-style with a `code`, or with
 * a `token_hash` + `type` — which we exchange/verify for a session.
 *
 * After a successful email confirmation we send the user to a branded
 * "Email verified" success page (with a Continue button) rather than dumping
 * them straight into the app. Password recovery still goes straight to
 * /reset-password so they can set a new password immediately.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as EmailOtpType | null) ?? null;
  const next = searchParams.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) {
    // Password recovery: straight to the reset form.
    if (type === 'recovery' || safeNext === '/reset-password') {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
    // Email confirmation / invite / magic link: show the success page, then let
    // the user continue to wherever they were headed.
    return NextResponse.redirect(`${origin}/verified?next=${encodeURIComponent(safeNext)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
