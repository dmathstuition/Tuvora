import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listTutorPayments, recordPaymentAction, getLearnerOptions } from '@/services/tutor-billing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';
import { formatMoney } from '@/lib/utils';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'payments.manage');
  const [payments, learners] = await Promise.all([listTutorPayments(), canManage ? getLearnerOptions() : Promise.resolve([])]);

  const fields = [
    { name: 'learnerId', label: 'Learner', type: 'select' as const, options: learners, required: true },
    { name: 'amount', label: 'Amount', type: 'number' as const, required: true, placeholder: '0.00' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Payments collected from parents and learners.</p>
        </div>
        {canManage && learners.length > 0 && (
          <CreateDialog action={recordPaymentAction} fields={fields} title="Record a payment" triggerLabel="Record payment" submitLabel="Record payment" />
        )}
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Record payments you collect from parents and learners here." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{p.learnerName}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(p.amountMinor, p.currency)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'succeeded' ? 'success' : 'warning'}>{p.status}</Badge>
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
