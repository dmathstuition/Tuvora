'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { addQuestionAction, type AssessmentState } from '@/services/assessments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type QType = 'multiple_choice' | 'true_false' | 'short_answer';
const base =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function AddQuestion({ assessmentId }: { assessmentId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QType>('multiple_choice');
  const [state, action, pending] = useActionState<AssessmentState, FormData>(addQuestionAction, {});
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add question
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add a question</h2>
            <form action={action} className="mt-4 space-y-4">
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <input type="hidden" name="type" value={type} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={type} onChange={(e) => setType(e.target.value as QType)} className={`${base} h-10`}>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short answer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input id="marks" name="marks" type="number" min={1} defaultValue={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Question</Label>
                <textarea id="prompt" name="prompt" rows={2} required className={base} />
              </div>

              {type === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>Options (mark the correct one)</Label>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <input type="radio" name="correct" value={n} defaultChecked={n === 1} className="h-4 w-4" />
                      <Input name={`option${n}`} placeholder={`Option ${n}`} />
                    </div>
                  ))}
                </div>
              )}
              {type === 'true_false' && (
                <div className="space-y-2">
                  <Label>Correct answer</Label>
                  <select name="correctBool" className={`${base} h-10`}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}
              {type === 'short_answer' && (
                <div className="space-y-2">
                  <Label htmlFor="accepted">Accepted answers (comma-separated)</Label>
                  <Input id="accepted" name="accepted" placeholder="42, forty-two" />
                </div>
              )}

              {state.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : 'Add question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
