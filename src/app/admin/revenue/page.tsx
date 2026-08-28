import type { Metadata } from 'next';
import { TrendingUp } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Revenue' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Revenue"
      description="Deep revenue analytics — MRR, ARR and ARPU."
      icon={TrendingUp}
      points={['MRR / ARR / ARPU over time', 'Revenue by plan and currency', 'Expansion vs contraction']}
    />
  );
}
