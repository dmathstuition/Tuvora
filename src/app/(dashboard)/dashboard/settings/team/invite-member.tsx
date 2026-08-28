'use client';

import { useActionState, useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';
import { inviteMemberAction, type InviteMemberState } from '@/services/organizations/members';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES = ['admin', 'tutor', 'assistant', 'accountant', 'staff'] as const;

export function InviteMember() {
  const [state, action, pending] = useActionState<InviteMemberState, FormData>(
    inviteMemberAction,
    {},
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.url) return;
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="tutor@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            defaultValue="tutor"
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          <UserPlus className="h-4 w-4" /> {pending ? 'Inviting…' : 'Invite'}
        </Button>
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.url && (
        <div className="space-y-1.5 rounded-md border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Share this invite link:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
              {state.url}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
