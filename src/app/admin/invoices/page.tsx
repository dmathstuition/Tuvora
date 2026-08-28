import type { Metadata } from 'next';
import { Receipt } from 'lucide-react';
import { listInvoices } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Invoices' };

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  open: 'warning',
  draft: 'secondary',
  void: 'secondary',
  uncollectible: 'destructive',
};

export default async function AdminInvoicesPage() {
  const invoices = await listInvoices();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">Platform invoices issued to organizations.</p>
      </div>
      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Platform invoices appear here once billing is live." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono">{i.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.orgName}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(i.totalMinor, i.currency)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {i.issuedAt ? new Date(i.issuedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[i.status] ?? 'secondary'}>{i.status}</Badge>
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
