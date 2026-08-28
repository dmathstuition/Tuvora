'use client';

import { useActionState } from 'react';
import { X } from 'lucide-react';
import { unenrolLearnerAction, type EnrolState } from '@/services/classes';
import { Button } from '@/components/ui/button';

export function UnenrolButton({ memberId, classId }: { memberId: string; classId: string }) {
  const [, formAction, pending] = useActionState<EnrolState, FormData>(unenrolLearnerAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="classId" value={classId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        aria-label="Remove from class"
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}
