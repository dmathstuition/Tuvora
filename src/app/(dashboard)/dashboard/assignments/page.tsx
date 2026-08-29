import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/context';
import { listAssignments, getClassOptions } from '@/services/assignments';
import { getEntitlements } from '@/lib/entitlements/service';
import { hasFeature } from '@/lib/entitlements/engine';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AddAssignmentButton } from './add-assignment';

export const metadata: Metadata = { title: 'Assignments' };

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  archived: 'outline',
};

export default async function AssignmentsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const organizationId = ctx.organizationId;
  const canManage = can(ctx, 'assignments.manage');

  const [assignments, classes, entitlements] = await Promise.all([
    listAssignments(),
    canManage ? getClassOptions() : Promise.resolve([]),
    getEntitlements(organizationId),
  ]);

  const featureEnabled = hasFeature(entitlements, 'assignments');
  const canCreate = canManage && featureEnabled && classes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Set work for your classes and grade submissions.
          </p>
        </div>
        {canCreate && <AddAssignmentButton classes={classes} />}
      </div>

      {canManage && !featureEnabled && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Assignments aren&apos;t included in your current plan. Upgrade to set and grade work.
        </div>
      )}
      {canManage && featureEnabled && classes.length === 0 && (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Create a class first — assignments are set for a class.
        </div>
      )}

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Create an assignment for one of your classes to start setting and grading work."
          action={canCreate ? <AddAssignmentButton classes={classes} /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Class</th>
                  <th className="px-4 py-3 font-medium">Graded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Due</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/assignments/${a.id}`} className="hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {a.class_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.graded} / {a.total}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[a.status] ?? 'outline'}>{a.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {a.due_at ? new Date(a.due_at).toLocaleDateString() : '—'}
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
