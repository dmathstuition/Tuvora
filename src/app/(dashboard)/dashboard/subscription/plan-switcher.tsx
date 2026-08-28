'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { switchPlanAction, type SwitchPlanState } from '@/services/billing/subscription';
import type { PublicPlan } from '@/services/billing/plans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney, cn } from '@/lib/utils';
import { hasFeature, type EntitlementSet } from '@/lib/entitlements/engine';

export function PlanSwitcher({
  plans,
  currentPlanId,
  currentInterval,
  canManage,
}: {
  plans: PublicPlan[];
  currentPlanId: string | null;
  currentInterval: 'monthly' | 'yearly' | null;
  canManage: boolean;
}) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>(currentInterval ?? 'monthly');
  const [state, formAction, pending] = useActionState<SwitchPlanState, FormData>(
    switchPlanAction,
    {},
  );

  useEffect(() => {
    if (state.checkoutUrl) window.location.href = state.checkoutUrl;
  }, [state.checkoutUrl]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border p-1 text-sm">
          {(['monthly', 'yearly'] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className={cn(
                'rounded px-3 py-1 font-medium capitalize transition-colors',
                interval === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{state.success}</p>
      )}

      <form action={formAction} className="grid gap-4 lg:grid-cols-3">
        <input type="hidden" name="interval" value={interval} />
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const price =
            interval === 'yearly' ? plan.yearlyPriceMinor : plan.monthlyPriceMinor;
          const entitlements: EntitlementSet = Object.fromEntries(
            plan.features.map((f) => [f.slug, f.value]),
          );
          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col rounded-lg border p-5',
                isCurrent && 'border-primary ring-1 ring-primary',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{plan.name}</h3>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{formatMoney(price, plan.currency)}</span>
                <span className="text-sm text-muted-foreground">
                  /{interval === 'yearly' ? 'yr' : 'mo'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.includedLearners} learners included
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                {plan.features
                  .filter((f) => hasFeature(entitlements, f.slug))
                  .slice(0, 6)
                  .map((f) => (
                    <li key={f.slug} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f.name}</span>
                    </li>
                  ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <Button type="button" variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    name="planId"
                    value={plan.id}
                    className="w-full"
                    variant={plan.isRecommended ? 'default' : 'outline'}
                    disabled={!canManage || pending}
                  >
                    {pending ? 'Working…' : `Switch to ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </form>

      {!canManage && (
        <p className="text-xs text-muted-foreground">
          Only owners, admins and accountants can change the plan.
        </p>
      )}
    </div>
  );
}
