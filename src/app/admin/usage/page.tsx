import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Usage Analytics' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Usage Analytics"
      description="Product usage across the platform."
      icon={BarChart3}
      points={['Active organizations and seats', 'Feature adoption', 'Engagement cohorts']}
    />
  );
}
