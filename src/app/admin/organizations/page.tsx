import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { listOrganizations } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Organizations' };

export default async function AdminOrganizationsPage() {
  const orgs = await listOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          {orgs.length} {orgs.length === 1 ? 'organization' : 'organizations'} on the platform.
        </p>
      </div>

      {orgs.length === 0 ? (
        <EmptyState icon={Building2} title="No organizations yet" description="New tutoring businesses will appear here as they sign up." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Learners</th>
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(o.name)}
                        </div>
                        <span className="font-medium">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {o.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">{o.learners}</td>
                    <td className="px-4 py-3">{o.members}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.currency}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={o.archived ? 'secondary' : 'success'}>
                        {o.archived ? 'Archived' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
