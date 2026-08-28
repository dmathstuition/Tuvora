import type { Metadata } from 'next';
import { Receipt } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Invoices' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Invoices"
      description="Platform invoices issued to organizations."
      icon={Receipt}
      points={['Issued, paid and overdue invoices', 'Download and resend invoices', 'Dunning and reminders']}
    />
  );
}
