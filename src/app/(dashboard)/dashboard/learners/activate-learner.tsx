'use client';

import { useActionState } from 'react';
import { CreditCard } from 'lucide-react';
import { activateLearnerAction, type ActivateLearnerState } from '@/services/learner-billing';
import { Button } from '@/components/ui/button';

/**
 * Opens a learner's account by recording their month's payment. Interim manual
 * activation until online checkout is wired; gated server-side by billing.manage.
 */
export function ActivateLearner({ learnerId, priceLabel }: { learnerId: string; priceLabel: string }) {
  const [state, formAction, pending] = useActionState<ActivateLearnerState, FormData>(
    activateLearnerAction,
    {},
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="learnerId" value={learnerId} />
      <Button type="submit" size="sm" disabled={pending} title={`Activate for ${priceLabel}/month`}>
        <CreditCard className="h-4 w-4" /> {pending ? 'Activating…' : 'Activate'}
      </Button>
      {state.error && <span className="ml-2 text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
