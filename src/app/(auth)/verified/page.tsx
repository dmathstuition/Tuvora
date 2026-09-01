import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Email verified' };

/**
 * Shown after a user clicks the confirmation link in their signup email (the
 * auth callback verifies the token, then redirects here). Confirms success and
 * gives them a single button to continue into the app.
 */
export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith('/') ? next : '/onboarding';
  const isPortal = target.startsWith('/portal');
  const cta = isPortal ? 'Go to my portal' : 'Continue to set up my academy';

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Email verified 🎉</h1>
        <p className="text-sm text-muted-foreground">
          Your email address has been confirmed and your Tuvoria account is now active.
        </p>
      </div>

      <Button asChild className="w-full">
        <Link href={target}>{cta}</Link>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Prefer to log in later?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Go to login
        </Link>
      </p>
    </div>
  );
}
