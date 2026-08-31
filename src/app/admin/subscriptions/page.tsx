import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { listSubscriptions } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Admin · Subscriptions' };

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  active: 'success',
  trialing: 'success',
  past_due: 'warning',
  paused: 'secondary',
  cancelled: 'secondary',
  expired: 'destructive',
  incomplete: 'warning',
};

export default async function AdminSubscriptionsPage() {
  const subs = await listSubscriptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">All organization subscriptions across Tuvoria.</p>
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions yet" description="Subscriptions appear here as organizations start trials and plans." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Interval</th>
                  <th className="px-4 py-3 font-medium">Renews / ends</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{s.orgName}</td>
                    <td className="px-4 py-3">{s.planName}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{s.interval}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[s.status] ?? 'secondary'}>
                        {s.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
