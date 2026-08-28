'use client';

import { useActionState } from 'react';
import { X } from 'lucide-react';
import {
  changeMemberRoleAction,
  removeMemberAction,
  type MemberActionState,
} from '@/services/organizations/members';
import { Button } from '@/components/ui/button';

const ROLES = ['admin', 'tutor', 'assistant', 'accountant', 'staff'] as const;

export function MemberActions({
  memberId,
  role,
  isOwner,
  isSelf,
  canManage,
  canRemove,
}: {
  memberId: string;
  role: string;
  isOwner: boolean;
  isSelf: boolean;
  canManage: boolean;
  canRemove: boolean;
}) {
  const [, roleAction] = useActionState<MemberActionState, FormData>(changeMemberRoleAction, {});
  const [, removeAction, removing] = useActionState<MemberActionState, FormData>(
    removeMemberAction,
    {},
  );

  if (isOwner) {
    return <span className="text-xs text-muted-foreground">Owner</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {canManage ? (
        <form action={roleAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <select
            name="role"
            defaultValue={role}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </form>
      ) : (
        <span className="text-sm capitalize text-muted-foreground">{role}</span>
      )}

      {canRemove && !isSelf && (
        <form action={removeAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <Button type="submit" variant="ghost" size="icon" disabled={removing} aria-label="Remove member">
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
