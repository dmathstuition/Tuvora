import Link from 'next/link';
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { TrialStatus } from '@/lib/entitlements/service';

/**
 * Slim billing banner shown above the dashboard content. During a live trial it
 * reassures ("all features unlocked, N days left"); once the trial ends it turns
 * into a persistent prompt to pick a plan.
 */
export function TrialBanner({ status }: { status: TrialStatus }) {
  if (status.state === 'active' || status.state === 'none') return null;

  if (status.state === 'trialing') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm lg:px-8">
        <span className="flex items-center gap-2 text-indigo-800">
          <Sparkles className="h-4 w-4" />
          You&apos;re on the <strong>free trial</strong> — all features unlocked.{' '}
          <strong>
            {status.daysLeft} day{status.daysLeft === 1 ? '' : 's'} left
          </strong>
          .
        </span>
        <Link
          href="/dashboard/subscription"
          className="font-semibold text-indigo-700 underline-offset-2 hover:underline"
        >
          Choose a plan →
        </Link>
      </div>
    );
  }

  const pastDue = status.state === 'past_due';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-sm lg:px-8">
      <span className="flex items-center gap-2 font-medium text-rose-800">
        <AlertTriangle className="h-4 w-4" />
        {pastDue
          ? 'Your payment is past due. Update billing to keep your features active.'
          : 'Your 14-day free trial has ended. Choose a plan to continue using Tuvora.'}
      </span>
      <Link
        href="/dashboard/subscription"
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
      >
        {pastDue ? 'Update billing' : 'Choose a plan'}
      </Link>
    </div>
  );
}
