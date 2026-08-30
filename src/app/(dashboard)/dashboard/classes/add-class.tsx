'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createClassAction, type CreateClassState } from '@/services/classes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddClassButton({ atLimit }: { atLimit: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateClassState, FormData>(
    createClassAction,
    {},
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={atLimit}>
        <Plus className="h-4 w-4" /> New class
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
            <h2 className="text-lg font-semibold">Create a class</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Set up a class to schedule lessons and enrol learners.
            </p>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class name</Label>
                <Input id="name" name="name" placeholder="e.g. GCSE Maths — Group A" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <select
                    id="mode"
                    name="mode"
                    defaultValue="group"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="group">Group</option>
                    <option value="one_to_one">One-to-one</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" name="capacity" type="number" min={1} placeholder="Optional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Online meeting link</Label>
                <Input
                  id="meetingUrl"
                  name="meetingUrl"
                  type="url"
                  placeholder="https://meet.google.com/… or Zoom link"
                />
                <p className="text-xs text-muted-foreground">
                  Learners use this to join the online class. You can override it per lesson.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" />
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
                  {pending ? 'Creating…' : 'Create class'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
