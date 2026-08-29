import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, ClipboardCheck } from 'lucide-react';
import { getAssessmentDetail, publishAssessmentAction } from '@/services/assessments';
import { listAssessmentAttempts } from '@/services/placement';
import { listLearners } from '@/services/learners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AddQuestion } from './add-question';
import { PlacementPanel } from './placement-panel';

export const metadata: Metadata = { title: 'Assessment' };

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAssessmentDetail(id);
  if (!detail) notFound();
  const { assessment, questions, canManage } = detail;

  const [attempts, learnerList] = await Promise.all([
    listAssessmentAttempts(id),
    canManage ? listLearners(1, 100) : Promise.resolve({ learners: [], total: 0 }),
  ]);
  const learners = learnerList.learners.map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name ?? ''}`.trim(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/assessments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Assessments
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
              <Badge variant={assessment.status === 'published' ? 'success' : 'warning'}>{assessment.status}</Badge>
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              {assessment.type}
              {assessment.passMark != null && ` · pass mark ${assessment.passMark}%`}
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <AddQuestion assessmentId={assessment.id} />
              <PlacementPanel
                assessmentId={assessment.id}
                learners={learners}
                aiEnabled={!!process.env.ANTHROPIC_API_KEY}
              />
              {assessment.status !== 'published' && questions.length > 0 && (
                <form action={publishAssessmentAction}>
                  <input type="hidden" name="assessmentId" value={assessment.id} />
                  <Button type="submit" variant="outline">
                    <Check className="h-4 w-4" /> Publish
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState title="No questions yet" description="Add questions to build this assessment." />
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {i + 1}. {q.prompt}{' '}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {q.marks} mark{q.marks === 1 ? '' : 's'} · {q.type.replace(/_/g, ' ')}
                  </span>
                </CardTitle>
              </CardHeader>
              {q.options.length > 0 && (
                <CardContent>
                  <ul className="space-y-1.5 text-sm">
                    {q.options.map((o) => (
                      <li key={o.id} className="flex items-center gap-2">
                        <span className={o.isCorrect ? 'flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-foreground' : 'h-4 w-4 rounded-full border'}>
                          {o.isCorrect && <Check className="h-3 w-3" />}
                        </span>
                        {o.label}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Placement results */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" /> Placement results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Learner</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Placement</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/learners/${a.learnerId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {a.learnerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === 'graded' ? 'success' : 'secondary'}>
                        {a.status === 'graded'
                          ? 'Completed'
                          : a.status === 'in_progress'
                            ? 'In progress'
                            : 'Assigned'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.percentage != null ? `${a.percentage}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">{a.placementLevel ?? '—'}</td>
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
