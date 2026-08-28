import type { Metadata } from 'next';
import { Package } from 'lucide-react';
import { listPlans } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Plans' };

export default async function AdminPlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Subscription plans and their live subscriber counts. Prices and limits are configured in
          the database (per-currency prices live in <code>plan_prices</code>).
        </p>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Package} title="No plans configured" description="Seed the plan catalogue to manage plans here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <div className="flex gap-1.5">
                    {p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    {p.isPublic && <Badge variant="secondary">Public</Badge>}
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatMoney(p.monthlyPriceMinor, p.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Included learners</dt>
                    <dd className="font-medium">{p.includedLearners}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Active subscribers</dt>
                    <dd className="font-medium">{p.subscribers}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Slug</dt>
                    <dd className="font-mono text-xs">{p.slug}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
