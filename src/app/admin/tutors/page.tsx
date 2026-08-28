import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Tutors' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Tutors"
      description="All tutor and staff accounts across every organization."
      icon={Building2}
      points={['Directory of tutors & staff', 'Per-tutor learner load and activity', 'Suspend or impersonate for support']}
    />
  );
}
