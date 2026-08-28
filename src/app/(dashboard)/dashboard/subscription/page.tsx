import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { getSubscriptionOverview } from '@/services/billing/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanSwitcher } from './plan-switcher';

export const metadata: Metadata = { title: 'Subscription' };

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  active: 'success',
  trialing: 'success',
  past_due: 'warning',
  paused: 'secondary',
  cancelled: 'secondary',
  expired: 'destructive',
  incomplete: 'warning',
};

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function SubscriptionPage() {
  const ctx = await getAuthContext();
  if (!ctx || !can(ctx, 'billing.view')) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Billing isn't available for your role"
        description="Ask an owner or admin for billing access."
      />
    );
  }

  const overview = await getSubscriptionOverview();
  if (!overview) return null;

  const canManage = can(ctx, 'billing.manage');
  const seatLabel =
    overview.seats.limit === null
      ? `${overview.seats.active} learners · unlimited`
      : `${overview.seats.active} / ${overview.seats.limit} learner seats`;
  const seatPct =
    overview.seats.limit && overview.seats.limit > 0
      ? Math.min(100, Math.round((overview.seats.active / overview.seats.limit) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Tuvora plan, learner seats and features.
        </p>
      </div>

      {/* Current plan + usage */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.hasSubscription ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl font-bold">{overview.planName ?? 'Plan'}</span>
                  {overview.status && (
                    <Badge variant={statusVariant[overview.status] ?? 'secondary'}>
                      {overview.status.replace('_', ' ')}
                    </Badge>
                  )}
                  {overview.interval && (
                    <span className="text-sm text-muted-foreground">
                      Billed {overview.interval}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {overview.status === 'trialing' && (
                    <div>
                      <p className="text-muted-foreground">Trial ends</p>
                      <p className="font-medium">{formatDate(overview.trialEndsAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Renews / ends</p>
                    <p className="font-medium">{formatDate(overview.currentPeriodEnd)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active subscription. Choose a plan below to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learner seats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{overview.seats.active}</p>
            <p className="text-xs text-muted-foreground">{seatLabel}</p>
            {overview.seats.limit !== null && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${seatPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature entitlements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your plan features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {overview.features.map((f) => (
              <div key={f.slug} className="flex items-center justify-between text-sm">
                <span className={f.available ? '' : 'text-muted-foreground line-through'}>
                  {f.name}
                </span>
                <span className="text-muted-foreground">
                  {f.limit === null ? (f.available ? 'Unlimited' : 'Off') : f.limit}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Change plan</h2>
        {overview.plans.length === 0 ? (
          <EmptyState
            title="No plans available"
            description="Seed the plan catalogue (supabase/seed/seed.sql) to enable plan changes."
          />
        ) : (
          <PlanSwitcher
            plans={overview.plans}
            currentPlanId={overview.planId}
            currentInterval={overview.interval}
            canManage={canManage}
          />
        )}
      </div>
    </div>
  );
}
