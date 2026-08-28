import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAssignmentDetail } from '@/services/assignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GradeSubmission } from './grade-submission';

export const metadata: Metadata = { title: 'Assignment' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'outline'> = {
  returned: 'success',
  graded: 'success',
  submitted: 'warning',
  late: 'warning',
  assigned: 'secondary',
};

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAssignmentDetail(id);
  if (!detail) notFound();

  const { assignment, className, submissions, canGrade } = detail;
  const gradedCount = submissions.filter(
    (s) => s.status === 'graded' || s.status === 'returned',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Assignments
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{assignment.title}</h1>
        <p className="text-sm text-muted-foreground">
          {className ?? 'No class'}
          {assignment.due_at && ` · Due ${new Date(assignment.due_at).toLocaleDateString()}`}
          {assignment.max_points != null && ` · ${assignment.max_points} points`}
        </p>
      </div>

      {assignment.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
            {assignment.instructions}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Submissions · {gradedCount}/{submissions.length} graded
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No learners enrolled"
                description="Enrol learners in this class to generate submissions to grade."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  {canGrade && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const graded = s.status === 'graded' || s.status === 'returned';
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{s.learner_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.score != null
                          ? `${s.score}${assignment.max_points ? ` / ${assignment.max_points}` : ''}`
                          : '—'}
                      </td>
                      {canGrade && (
                        <td className="px-4 py-3 text-right">
                          <GradeSubmission
                            submissionId={s.id}
                            learnerName={s.learner_name}
                            maxPoints={assignment.max_points}
                            currentScore={s.score}
                            currentFeedback={s.feedback}
                            graded={graded}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
