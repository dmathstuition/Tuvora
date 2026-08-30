'use client';

import { useActionState } from 'react';
import { CreditCard } from 'lucide-react';
import { startLearnerPaymentAction, type StartPaymentState } from '@/services/learner-billing';
import { Button } from '@/components/ui/button';

/**
 * Opens a learner's account by taking their month's payment via Paystack.
 * Submitting redirects the admin to Paystack's secure checkout; the account
 * opens automatically once payment is confirmed. Gated server-side by
 * billing.manage.
 */
export function ActivateLearner({ learnerId, priceLabel }: { learnerId: string; priceLabel: string }) {
  const [state, formAction, pending] = useActionState<StartPaymentState, FormData>(
    startLearnerPaymentAction,
    {},
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="learnerId" value={learnerId} />
      <Button type="submit" size="sm" disabled={pending} title={`Pay ${priceLabel}/month`}>
        <CreditCard className="h-4 w-4" /> {pending ? 'Redirecting…' : `Pay ${priceLabel}`}
      </Button>
      {state.error && <span className="ml-2 text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
