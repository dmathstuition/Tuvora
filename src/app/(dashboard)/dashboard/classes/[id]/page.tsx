import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { getClassDetail } from '@/services/classes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { EnrolLearner } from './enrol-learner';
import { UnenrolButton } from './unenrol-button';

export const metadata: Metadata = { title: 'Class' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'outline'> = {
  active: 'success',
  draft: 'warning',
  completed: 'secondary',
  archived: 'outline',
};

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getClassDetail(id);
  if (!detail) notFound();

  const { klass, enrolled, enrollable, canManage, atCapacity } = detail;
  const capacityLabel = klass.capacity
    ? `${enrolled.length} / ${klass.capacity} enrolled`
    : `${enrolled.length} enrolled`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/classes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Classes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{klass.name}</h1>
          <Badge variant={statusVariant[klass.status] ?? 'secondary'}>{klass.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {klass.mode === 'one_to_one' ? 'One-to-one' : 'Group'} · {capacityLabel}
          {klass.start_date && ` · Starts ${new Date(klass.start_date).toLocaleDateString()}`}
        </p>
        {klass.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{klass.description}</p>
        )}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrol a learner</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrolLearner classId={klass.id} enrollable={enrollable} atCapacity={atCapacity} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrolled learners · {enrolled.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {enrolled.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No learners enrolled yet"
                description="Enrol learners to set assignments, take attendance and track their progress in this class."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Enrolled</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {enrolled.map((l) => (
                  <tr key={l.member_id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={l.status === 'active' ? 'success' : 'secondary'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {new Date(l.enrolled_at).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <UnenrolButton memberId={l.member_id} classId={klass.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
