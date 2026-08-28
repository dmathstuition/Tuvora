import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/admin-placeholder';

export const metadata: Metadata = { title: 'Admin · System Settings' };

export default function Page() {
  return (
    <AdminPlaceholder
      title="System Settings"
      description="Platform-wide configuration."
      icon={Settings}
      points={['Branding and email settings', 'Feature flags and defaults', 'Provider and webhook config']}
    />
  );
}
