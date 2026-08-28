import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { getPublicPlans } from '@/services/billing/plans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils';
import { hasFeature, type EntitlementSet } from '@/lib/entitlements/engine';

export const metadata: Metadata = { title: 'Pricing' };

function describeFeature(name: string, value: EntitlementSet[keyof EntitlementSet]): string {
  if (!value) return name;
  if (value.kind === 'unlimited') return `Unlimited ${name.toLowerCase()}`;
  if (value.kind === 'numeric') return `${value.limit} ${name.toLowerCase()}`;
  return name;
}

export default async function PricingPage() {
  const plans = await getPublicPlans();

  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple, seat-based pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Start with a base plan that includes a set number of learners. Add more learner seats
          only as you grow. Prices are configured by Tuvora and shown live from our catalogue.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="mx-auto mt-12 max-w-lg">
          <EmptyState
            title="Plans are being configured"
            description="Connect Supabase and seed the catalogue (supabase/seed/seed.sql) to display live plans here."
          />
        </div>
      ) : (
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const entitlements: EntitlementSet = Object.fromEntries(
              plan.features.map((f) => [f.slug, f.value]),
            );
            return (
              <Card
                key={plan.id}
                className={plan.isRecommended ? 'border-primary shadow-md ring-1 ring-primary' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    {plan.isRecommended && <Badge>Recommended</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">
                      {formatMoney(plan.monthlyPriceMinor, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Includes {plan.includedLearners} learners ·{' '}
                    {formatMoney(plan.additionalLearnerPriceMinor, plan.currency)} per extra learner
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full" variant={plan.isRecommended ? 'default' : 'outline'}>
                    <Link href={`/signup?plan=${plan.slug}`}>
                      Start {plan.trialDays}-day trial
                    </Link>
                  </Button>
                  <ul className="space-y-2 text-sm">
                    {plan.features
                      .filter((f) => hasFeature(entitlements, f.slug))
                      .map((f) => (
                        <li key={f.slug} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{describeFeature(f.name, f.value)}</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
