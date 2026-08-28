import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { listClasses, getRemainingClassCapacity } from '@/services/classes';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AddClassButton } from './add-class';

export const metadata: Metadata = { title: 'Classes' };

const statusVariant: Record<string, 'success' | 'secondary' | 'outline' | 'warning'> = {
  active: 'success',
  draft: 'warning',
  completed: 'secondary',
  archived: 'outline',
};

export default async function ClassesPage() {
  const ctx = await getAuthContext();
  const organizationId = ctx!.organizationId!;
  const canManage = can(ctx!, 'classes.manage');

  const [{ classes, total }, remaining] = await Promise.all([
    listClasses(),
    getRemainingClassCapacity(organizationId),
  ]);

  const atLimit = remaining <= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'class' : 'classes'}
            {remaining !== Number.POSITIVE_INFINITY && ` · ${remaining} remaining on your plan`}
          </p>
        </div>
        {canManage && <AddClassButton atLimit={atLimit} />}
      </div>

      {atLimit && total > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You&apos;ve reached your plan&apos;s class limit. Upgrade to create more classes.
        </div>
      )}

      {total === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Create your first class to start scheduling lessons, tracking attendance and setting assignments."
          action={canManage ? <AddClassButton atLimit={atLimit} /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Learners</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Starts</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/classes/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.mode === 'one_to_one' ? 'One-to-one' : 'Group'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.learner_count}
                      {c.capacity ? ` / ${c.capacity}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[c.status] ?? 'secondary'}>{c.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
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
