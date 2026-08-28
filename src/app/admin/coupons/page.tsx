import type { Metadata } from 'next';
import { TicketPercent } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Coupons' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Coupons"
      description="Discount codes and promotional offers."
      icon={TicketPercent}
      points={['Percentage and fixed-amount codes', 'Usage limits and expiry', 'Per-plan eligibility']}
    />
  );
}
