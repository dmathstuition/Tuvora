import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { acceptInviteAction } from '@/services/organizations/members';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Accept invitation' };

const ERRORS: Record<string, string> = {
  invalid: 'This invitation is no longer valid.',
  expired: 'This invitation has expired. Ask an admin to send a new one.',
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <Logo showTagline />
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6 text-center">
          {error ? (
            <>
              <h1 className="text-xl font-bold">Invitation problem</h1>
              <p className="text-sm text-muted-foreground">{ERRORS[error] ?? 'Something went wrong.'}</p>
              <Button asChild variant="outline">
                <Link href="/login">Go to login</Link>
              </Button>
            </>
          ) : !token ? (
            <>
              <h1 className="text-xl font-bold">No invitation token</h1>
              <p className="text-sm text-muted-foreground">This link is missing its token.</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">You&apos;ve been invited to Tuvora</h1>
              <p className="text-sm text-muted-foreground">
                {user
                  ? 'Accept the invitation to join the organization and access its dashboard.'
                  : 'Log in or create your account first, then accept the invitation.'}
              </p>
              {user ? (
                <form action={acceptInviteAction}>
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" className="w-full">
                    Accept invitation
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href={`/signup?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                      Create account
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                      Log in
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
