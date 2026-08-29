import type { Metadata } from 'next';
import { Receipt } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listTutorInvoices, createInvoiceAction, getLearnerOptions } from '@/services/tutor-billing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';
import { formatMoney } from '@/lib/utils';

export const metadata: Metadata = { title: 'Invoices' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  paid: 'success',
  open: 'warning',
  draft: 'secondary',
  void: 'secondary',
};

export default async function InvoicesPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'invoices.manage');
  const [invoices, learners] = await Promise.all([listTutorInvoices(), canManage ? getLearnerOptions() : Promise.resolve([])]);

  const fields = [
    { name: 'learnerId', label: 'Bill to (learner)', type: 'select' as const, options: learners, required: true },
    { name: 'description', label: 'Description', required: true, placeholder: 'e.g. October tuition' },
    { name: 'amount', label: 'Amount', type: 'number' as const, required: true, placeholder: '0.00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Invoices issued to parents and learners.</p>
        </div>
        {canManage && learners.length > 0 && (
          <CreateDialog action={createInvoiceAction} fields={fields} title="Create an invoice" triggerLabel="New invoice" submitLabel="Create invoice" />
        )}
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Create an invoice to bill a parent or learner." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono">{i.number}</td>
                    <td className="px-4 py-3">{i.learnerName}</td>
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
