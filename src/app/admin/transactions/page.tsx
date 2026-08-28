import type { Metadata } from 'next';
import { ArrowLeftRight } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Transactions' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Transactions"
      description="The full platform transaction ledger."
      icon={ArrowLeftRight}
      points={['Payments, refunds and adjustments', 'Provider reconciliation', 'Export to CSV']}
    />
  );
}
