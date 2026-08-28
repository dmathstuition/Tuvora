import type { Metadata } from 'next';
import { LifeBuoy } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Support Tickets' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Support Tickets"
      description="Support requests from organizations."
      icon={LifeBuoy}
      points={['Ticket queue and assignment', 'SLA and response times', 'Canned responses']}
    />
  );
}
