'use client';

import { useActionState, useEffect, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { enrolLearnerAction, type EnrolState } from '@/services/classes';
import { Button } from '@/components/ui/button';

export function EnrolLearner({
  classId,
  enrollable,
  atCapacity,
}: {
  classId: string;
  enrollable: { id: string; name: string }[];
  atCapacity: boolean;
}) {
  const [state, formAction, pending] = useActionState<EnrolState, FormData>(
    enrolLearnerAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (enrollable.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Every active learner is already enrolled. Add more learners from the Learners page.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classId" value={classId} />
      <select
        name="learnerId"
        required
        disabled={atCapacity}
        className="h-10 min-w-56 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        defaultValue=""
      >
        <option value="" disabled>
          Select a learner…
        </option>
        {enrollable.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending || atCapacity}>
        <UserPlus className="h-4 w-4" /> {pending ? 'Enrolling…' : 'Enrol'}
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {atCapacity && (
        <p className="w-full text-sm text-muted-foreground">
          Class is at capacity — increase the capacity to enrol more learners.
        </p>
      )}
    </form>
  );
}
