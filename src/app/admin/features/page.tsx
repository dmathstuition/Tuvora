import type { Metadata } from 'next';
import { ToggleRight } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · Features' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="Features"
      description="The feature catalogue that plans grant."
      icon={ToggleRight}
      points={['Create and edit platform features', 'Boolean / numeric / unlimited types', 'Attach features to plans']}
    />
  );
}
