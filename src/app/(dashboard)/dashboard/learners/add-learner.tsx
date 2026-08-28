'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createLearnerAction, type CreateLearnerState } from '@/services/learners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Add-learner control. Opens a lightweight inline dialog. The button is disabled
 * at the seat limit as a UX affordance only — the server action and DB trigger
 * are the real enforcement.
 */
export function AddLearnerButton({ atLimit }: { atLimit: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateLearnerState, FormData>(
    createLearnerAction,
    {},
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={atLimit}>
        <Plus className="h-4 w-4" /> Add learner
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
            <h2 className="text-lg font-semibold">Add a learner</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Enrol a new learner in your organization.
            </p>
            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <input type="hidden" name="status" value="active" />

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
                  {pending ? 'Adding…' : 'Add learner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
