import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Reports' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Reports"
      description="Scheduled and ad-hoc platform reports."
      icon={FileText}
      points={['Revenue and growth reports', 'Exportable data extracts', 'Scheduled email delivery']}
    />
  );
}
