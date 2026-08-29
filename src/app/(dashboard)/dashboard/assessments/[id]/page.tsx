import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { getAssessmentDetail, publishAssessmentAction } from '@/services/assessments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AddQuestion } from './add-question';

export const metadata: Metadata = { title: 'Assessment' };

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAssessmentDetail(id);
  if (!detail) notFound();
  const { assessment, questions, canManage } = detail;

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
            <div className="flex gap-2">
              <AddQuestion assessmentId={assessment.id} />
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
    </div>
  );
}
