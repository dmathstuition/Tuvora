import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { listLearners } from '@/services/learners';
import { getActiveLearnerCount, getLearnerLimit } from '@/lib/entitlements/service';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AddLearnerButton } from './add-learner';

export const metadata: Metadata = { title: 'Learners' };

const statusVariant: Record<string, 'success' | 'secondary' | 'outline'> = {
  active: 'success',
  inactive: 'secondary',
  archived: 'outline',
};

export default async function LearnersPage() {
  const ctx = await getAuthContext();
  const organizationId = ctx!.organizationId!;
  const canCreate = can(ctx!, 'learners.create');

  const [{ learners, total }, activeCount, limit] = await Promise.all([
    listLearners(),
    getActiveLearnerCount(organizationId),
    getLearnerLimit(organizationId),
  ]);

  const atLimit = limit !== null && activeCount >= limit;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learners</h1>
          <p className="text-sm text-muted-foreground">
            {limit === null
              ? `${activeCount} active learners`
              : `${activeCount} of ${limit} learner seats used`}
          </p>
        </div>
        {canCreate && <AddLearnerButton atLimit={atLimit} />}
      </div>

      {atLimit && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You&apos;ve reached your learner seat limit. Upgrade your plan or add seats to enrol more
          learners. Existing learner data is always preserved.
        </div>
      )}

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title="No learners yet"
          description="Add your first learner to start managing their classes, assignments and progress."
          action={canCreate ? <AddLearnerButton atLimit={atLimit} /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/learners/${l.id}`} className="hover:underline">
                        {l.first_name} {l.last_name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {l.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[l.status] ?? 'secondary'}>{l.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {new Date(l.enrolled_at).toLocaleDateString()}
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
