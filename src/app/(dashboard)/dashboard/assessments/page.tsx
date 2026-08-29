import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { getEntitlements } from '@/lib/entitlements/service';
import { hasFeature } from '@/lib/entitlements/engine';
import { listAssessments, createAssessmentAction } from '@/services/assessments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';

export const metadata: Metadata = { title: 'Assessments' };

const fields = [
  { name: 'title', label: 'Title', required: true, placeholder: 'e.g. End of term quiz' },
  {
    name: 'type',
    label: 'Type',
    type: 'select' as const,
    options: [
      { value: 'quiz', label: 'Quiz' },
      { value: 'test', label: 'Test' },
      { value: 'exam', label: 'Exam' },
      { value: 'diagnostic', label: 'Diagnostic' },
    ],
  },
  { name: 'passMark', label: 'Pass mark (%)', type: 'number' as const, placeholder: '50' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  archived: 'outline',
};

export default async function AssessmentsPage() {
  const ctx = await getAuthContext();
  const organizationId = ctx!.organizationId!;
  const canManage = can(ctx!, 'assessments.manage');
  const [assessments, entitlements] = await Promise.all([listAssessments(), getEntitlements(organizationId)]);
  const enabled = hasFeature(entitlements, 'assessments');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
          <p className="text-sm text-muted-foreground">Quizzes, tests and exams with auto-grading.</p>
        </div>
        {canManage && enabled && (
          <CreateDialog action={createAssessmentAction} fields={fields} title="Create an assessment" triggerLabel="New assessment" submitLabel="Create" />
        )}
      </div>

      {canManage && !enabled && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Assessments aren&apos;t included in your current plan. Upgrade to build quizzes and exams.
        </div>
      )}

      {assessments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assessments yet" description="Create a quiz or test, then add questions." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Questions</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/assessments/${a.id}`} className="hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{a.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.questions}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[a.status] ?? 'outline'}>{a.status}</Badge>
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
