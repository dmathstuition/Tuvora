'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createAssignmentAction, type CreateAssignmentState } from '@/services/assignments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddAssignmentButton({ classes }: { classes: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateAssignmentState, FormData>(
    createAssignmentAction,
    {},
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New assignment
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Create an assignment</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Every enrolled learner in the class gets a submission to complete.
            </p>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="e.g. Algebra worksheet 3" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <select
                  id="classId"
                  name="classId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <textarea
                  id="instructions"
                  name="instructions"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Max points</Label>
                  <Input id="maxPoints" name="maxPoints" type="number" min={1} placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueAt">Due date</Label>
                  <Input id="dueAt" name="dueAt" type="date" />
                </div>
              </div>

              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Creating…' : 'Create assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
