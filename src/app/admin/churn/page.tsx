import type { Metadata } from 'next';
import { UserMinus } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Churn & Retention' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Churn & Retention"
      description="Retention, churn and trial conversion."
      icon={UserMinus}
      points={['Churn rate and reasons', 'Trial-to-paid conversion', 'Retention curves']}
    />
  );
}
