import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { listTutors } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Tutors' };

export default async function AdminTutorsPage() {
  const tutors = await listTutors();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tutors</h1>
        <p className="text-sm text-muted-foreground">
          {tutors.length} tutor and staff accounts across every organization.
        </p>
      </div>
      {tutors.length === 0 ? (
        <EmptyState icon={Users} title="No tutors yet" description="Tutors appear here as organizations add staff." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(t.name ?? t.email)}
                        </div>
                        <div>
                          <p className="font-medium">{t.name ?? t.email}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.orgName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {t.role}
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
