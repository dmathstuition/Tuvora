import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';
import { listPlatformPayments } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Payments' };

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
};

export default async function AdminPaymentsPage() {
  const payments = await listPlatformPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Platform payments — organizations paying Tuvora.</p>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Platform payments appear here once billing is live." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(p.orgName)}
                        </div>
                        <span className="font-medium">{p.orgName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(p.amountMinor, p.currency)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[p.status] ?? 'secondary'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
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
