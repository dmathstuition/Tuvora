'use client';

import { useActionState } from 'react';
import {
  saveAttendanceAction,
  type SaveAttendanceState,
  type RegisterRow,
  type AttendanceStatus,
} from '@/services/attendance';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Full, static class strings per status so Tailwind's scanner generates them
// (interpolated class names would be dropped at build time).
const STATUSES: { value: AttendanceStatus; label: string; checked: string }[] = [
  {
    value: 'present',
    label: 'Present',
    checked: 'has-[:checked]:border-transparent has-[:checked]:bg-success has-[:checked]:text-success-foreground',
  },
  {
    value: 'absent',
    label: 'Absent',
    checked:
      'has-[:checked]:border-transparent has-[:checked]:bg-destructive has-[:checked]:text-destructive-foreground',
  },
  {
    value: 'late',
    label: 'Late',
    checked:
      'has-[:checked]:border-transparent has-[:checked]:bg-warning has-[:checked]:text-warning-foreground',
  },
  {
    value: 'excused',
    label: 'Excused',
    checked:
      'has-[:checked]:border-transparent has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground',
  },
];

export function RegisterForm({
  classId,
  date,
  rows,
}: {
  classId: string;
  date: string;
  rows: RegisterRow[];
}) {
  const [state, formAction, pending] = useActionState<SaveAttendanceState, FormData>(
    saveAttendanceAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />

      <div className="divide-y rounded-lg border">
        {rows.map((row) => (
          <div
            key={row.learner_id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <span className="font-medium">{row.name}</span>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <label
                  key={s.value}
                  className={cn(
                    'cursor-pointer select-none rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted',
                    s.checked,
                  )}
                >
                  <input
                    type="radio"
                    name={`status_${row.learner_id}`}
                    value={s.value}
                    defaultChecked={row.status === s.value}
                    className="sr-only"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Attendance saved.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save register'}
        </Button>
      </div>
    </form>
  );
}
