'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createFeatureAction, type AdminActionState } from '@/services/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FeatureForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    createFeatureAction,
    {},
  );
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New feature
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">New feature</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Features are granted by plans and checked by the entitlement engine.
            </p>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g. AI lesson planner" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input id="slug" name="slug" placeholder="ai_lesson_planner" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue="boolean"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="boolean">Boolean (on/off)</option>
                  <option value="numeric">Numeric (limit)</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Creating…' : 'Create feature'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
