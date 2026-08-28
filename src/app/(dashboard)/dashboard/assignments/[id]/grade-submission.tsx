'use client';

import { useActionState, useEffect, useState } from 'react';
import { gradeSubmissionAction, type GradeSubmissionState } from '@/services/assignments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GradeSubmission({
  submissionId,
  learnerName,
  maxPoints,
  currentScore,
  currentFeedback,
  graded,
}: {
  submissionId: string;
  learnerName: string;
  maxPoints: number | null;
  currentScore: number | null;
  currentFeedback: string | null;
  graded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<GradeSubmissionState, FormData>(
    gradeSubmissionAction,
    {},
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button size="sm" variant={graded ? 'outline' : 'default'} onClick={() => setOpen(true)}>
        {graded ? 'Edit grade' : 'Grade'}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Grade — {learnerName}</h2>
            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="submissionId" value={submissionId} />
              <div className="space-y-2">
                <Label htmlFor={`score-${submissionId}`}>
                  Score {maxPoints ? `(out of ${maxPoints})` : ''}
                </Label>
                <Input
                  id={`score-${submissionId}`}
                  name="score"
                  type="number"
                  step="0.01"
                  min={0}
                  max={maxPoints ?? undefined}
                  defaultValue={currentScore ?? ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`feedback-${submissionId}`}>Feedback</Label>
                <textarea
                  id={`feedback-${submissionId}`}
                  name="feedback"
                  rows={3}
                  defaultValue={currentFeedback ?? ''}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  name="action"
                  value="graded"
                  variant="outline"
                  disabled={pending}
                >
                  Save draft
                </Button>
                <Button type="submit" name="action" value="returned" disabled={pending}>
                  {pending ? 'Saving…' : 'Return to learner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
