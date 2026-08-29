'use client';

import { useActionState, useEffect, useRef } from 'react';
import { issueCertificateAction, type CertState } from '@/services/certificates';
import { CERTIFICATE_TYPES } from '@/constants/certificates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const base =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function IssueForm({
  learners,
  disabled,
}: {
  learners: { id: string; name: string }[];
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<CertState, FormData>(issueCertificateAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <fieldset disabled={disabled || learners.length === 0} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="learnerId">Learner</Label>
            <select id="learnerId" name="learnerId" className={base}>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" className={base} defaultValue="achievement">
              {CERTIFICATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Outstanding progress in Algebra" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input id="description" name="description" placeholder="For consistent effort and top marks this term" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Issuing…' : 'Issue certificate'}
          </Button>
          {state.success && <p className="text-sm text-success">Issued.</p>}
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </fieldset>
      {learners.length === 0 && (
        <p className="text-sm text-muted-foreground">Add a learner first to issue certificates.</p>
      )}
    </form>
  );
}
