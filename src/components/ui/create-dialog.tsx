'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ActionResult = { error?: string; success?: boolean };
type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'datetime-local' | 'email' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

const inputBase =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Generic "create" dialog: a trigger button that opens a modal form, submits a
 * server action returning { error?, success? }, and closes on success. Keeps the
 * many list-page create forms consistent without duplicating boilerplate.
 */
export function CreateDialog({
  action,
  fields,
  title,
  triggerLabel,
  submitLabel = 'Create',
  hidden,
  triggerVariant = 'default',
}: {
  action: Action;
  fields: Field[];
  title: string;
  triggerLabel: string;
  submitLabel?: string;
  hidden?: Record<string, string>;
  triggerVariant?: 'default' | 'outline' | 'secondary';
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {triggerLabel}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <form action={formAction} className="mt-4 space-y-4">
              {hidden &&
                Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              {fields.map((f) => (
                <div key={f.name} className="space-y-2">
                  <Label htmlFor={f.name}>{f.label}</Label>
                  {f.type === 'textarea' ? (
                    <textarea id={f.name} name={f.name} rows={3} required={f.required} placeholder={f.placeholder} className={inputBase} defaultValue={f.defaultValue} />
                  ) : f.type === 'select' ? (
                    <select id={f.name} name={f.name} required={f.required} defaultValue={f.defaultValue} className={`${inputBase} h-10`}>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input id={f.name} name={f.name} type={f.type ?? 'text'} required={f.required} placeholder={f.placeholder} defaultValue={f.defaultValue} />
                  )}
                </div>
              ))}
              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
