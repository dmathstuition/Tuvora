'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { createAssignmentAction, type CreateAssignmentState } from '@/services/assignments';
import { HOMEWORK_FORMATS, ALL_HOMEWORK_FORMATS, type HomeworkFormat } from '@/constants/homework';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function AddAssignmentButton({
  classes,
  learners = [],
  defaultClassId,
  triggerLabel = 'New assignment',
  triggerVariant = 'default',
}: {
  classes: { id: string; name: string }[];
  learners?: { id: string; name: string }[];
  defaultClassId?: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary';
}) {
  const [open, setOpen] = useState(false);
  // A one-to-one assignment goes to a single learner; a class assignment goes
  // to everyone enrolled. Default to class when classes exist, else one-to-one.
  const [target, setTarget] = useState<'class' | 'learner'>(
    classes.length > 0 ? 'class' : 'learner',
  );
  const [formats, setFormats] = useState<HomeworkFormat[]>(ALL_HOMEWORK_FORMATS);
  const [state, formAction, pending] = useActionState<CreateAssignmentState, FormData>(
    createAssignmentAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setFormats(ALL_HOMEWORK_FORMATS);
      setTarget(classes.length > 0 ? 'class' : 'learner');
    }
  }, [state.success, classes.length]);

  function toggleFormat(key: HomeworkFormat) {
    setFormats((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant={triggerVariant}>
        <Plus className="h-4 w-4" /> {triggerLabel}
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
              {/* target travels to the server so it knows how to seed submissions */}
              <input type="hidden" name="target" value={target} />
              <div className="space-y-2">
                <Label>Assign to</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTarget('class')}
                    disabled={classes.length === 0}
                    aria-pressed={target === 'class'}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                      target === 'class'
                        ? 'border-brand-500 bg-brand-50/60 text-brand-700'
                        : 'border-input bg-background hover:border-brand-300',
                    )}
                  >
                    A class
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget('learner')}
                    disabled={learners.length === 0}
                    aria-pressed={target === 'learner'}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                      target === 'learner'
                        ? 'border-brand-500 bg-brand-50/60 text-brand-700'
                        : 'border-input bg-background hover:border-brand-300',
                    )}
                  >
                    One learner (1:1)
                  </button>
                </div>
              </div>

              {target === 'class' ? (
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <select
                    id="classId"
                    name="classId"
                    required
                    defaultValue={defaultClassId ?? ''}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      Select a class…
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="learnerId">Learner</Label>
                  <select
                    id="learnerId"
                    name="learnerId"
                    required
                    defaultValue=""
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      Select a learner…
                    </option>
                    {learners.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Only this learner gets the assignment — great for extra or catch-up work.
                  </p>
                </div>
              )}
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

              <div className="space-y-2">
                <Label htmlFor="files">Question files / images (optional)</Label>
                <input
                  id="files"
                  name="files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="text-xs text-muted-foreground">
                  Upload the question sheet or images. Learners can view these when they submit.
                </p>
              </div>

              <div className="space-y-2">
                <Label>How learners may answer</Label>
                {/* Selected keys travel to the server as repeated `formats` fields. */}
                {formats.map((k) => (
                  <input key={k} type="hidden" name="formats" value={k} />
                ))}
                <div className="grid grid-cols-2 gap-2">
                  {HOMEWORK_FORMATS.map((f) => {
                    const on = formats.includes(f.key);
                    return (
                      <button
                        type="button"
                        key={f.key}
                        onClick={() => toggleFormat(f.key)}
                        aria-pressed={on}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border p-2.5 text-left transition',
                          on
                            ? 'border-brand-500 bg-brand-50/60'
                            : 'border-input bg-background hover:border-brand-300',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            on ? 'border-brand-600 bg-brand-600 text-white' : 'border-muted-foreground/40',
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{f.label}</span>
                          <span className="block text-xs text-muted-foreground">{f.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formats.length === 0
                    ? 'Pick at least one — all formats will be allowed if none are chosen.'
                    : 'Learners will only see the formats you allow.'}
                </p>
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
