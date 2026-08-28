import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Learners' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Learners"
      description="Every learner on the platform, across all academies."
      icon={GraduationCap}
      points={['Cross-tenant learner directory', 'Billing + portal status at a glance', 'Growth and activation trends']}
    />
  );
}
