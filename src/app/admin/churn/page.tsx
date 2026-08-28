import type { Metadata } from 'next';
import { UserMinus, TrendingUp, Repeat, CreditCard } from 'lucide-react';
import { getChurnMetrics } from '@/services/admin';
import { StatCard } from '@/components/dashboard/stat-card';
import { PlanDonut } from '@/components/admin/plan-donut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Admin · Churn & Retention' };

export default async function AdminChurnPage() {
  const m = await getChurnMetrics();
  const distribution = m.statusCounts.map((s) => ({
    name: s.status.replace(/_/g, ' '),
    count: s.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Churn &amp; Retention</h1>
        <p className="text-sm text-muted-foreground">
          Subscription health across the platform. Trial conversion is an approximation until full
          subscription history is tracked.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Churn rate" value={`${m.churnRatePct}%`} hint="cancelled + expired" icon={UserMinus} />
        <StatCard label="Trial conversion" value={`${m.trialConversionPct}%`} icon={TrendingUp} />
        <StatCard label="Active" value={m.active} hint={`${m.trialing} on trial`} icon={CreditCard} />
        <StatCard label="Total subscriptions" value={m.totalSubscriptions} icon={Repeat} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanDonut data={distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(
                [
                  ['Active', m.active],
                  ['Trialing', m.trialing],
                  ['Past due', m.pastDue],
                  ['Cancelled', m.cancelled],
                  ['Expired', m.expired],
                ] as const
              ).map(([label, n]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{n}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
