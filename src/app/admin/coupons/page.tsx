import type { Metadata } from 'next';
import { TicketPercent } from 'lucide-react';
import { listCoupons, viewerIsSuperAdmin } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils';
import { CouponForm } from './coupon-form';
import { CouponToggle } from './coupon-toggle';

export const metadata: Metadata = { title: 'Admin · Coupons' };

function discountLabel(c: {
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency: string | null;
}): string {
  if (c.discountType === 'percent') return `${c.discountValue}% off`;
  return `${formatMoney(c.discountValue, c.currency ?? 'USD')} off`;
}

export default async function AdminCouponsPage() {
  const [coupons, canWrite] = await Promise.all([listCoupons(), viewerIsSuperAdmin()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">
            Discount codes for organization subscriptions. {coupons.length} total.
          </p>
        </div>
        {canWrite && <CouponForm />}
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={TicketPercent} title="No coupons yet" description="Create a discount code to run a promotion." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Redemptions</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canWrite && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold">{c.code}</p>
                      {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3">{discountLabel(c)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.timesRedeemed}
                      {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'success' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <CouponToggle couponId={c.id} active={c.isActive} />
                      </td>
                    )}
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
