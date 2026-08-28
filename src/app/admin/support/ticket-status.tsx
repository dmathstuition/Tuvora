'use client';

import { useActionState } from 'react';
import { updateTicketStatusAction, type AdminActionState } from '@/services/admin/actions';

const STATUSES = ['open', 'pending', 'resolved', 'closed'] as const;

export function TicketStatus({ ticketId, status }: { ticketId: string; status: string }) {
  const [, action] = useActionState<AdminActionState, FormData>(updateTicketStatusAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
