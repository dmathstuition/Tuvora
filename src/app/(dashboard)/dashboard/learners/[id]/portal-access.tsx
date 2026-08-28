'use client';

import { useActionState, useState } from 'react';
import { Copy, Check, Link2, ShieldCheck } from 'lucide-react';
import { invitePortalAction, type InviteState } from '@/services/portal/invites';
import { Button } from '@/components/ui/button';

export function PortalAccess({
  learnerId,
  linked,
  hasEmail,
  initialUrl,
}: {
  learnerId: string;
  linked: boolean;
  hasEmail: boolean;
  initialUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    invitePortalAction,
    {},
  );
  const [copied, setCopied] = useState(false);
  const url = state.url ?? initialUrl;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (linked) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <ShieldCheck className="h-4 w-4" /> Portal account linked
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hasEmail && (
        <p className="text-sm text-muted-foreground">
          Add an email to this learner to invite them to the portal.
        </p>
      )}

      {hasEmail && (
        <form action={formAction}>
          <input type="hidden" name="learnerId" value={learnerId} />
          <Button type="submit" size="sm" disabled={pending}>
            <Link2 className="h-4 w-4" />
            {pending ? 'Generating…' : url ? 'Regenerate invite link' : 'Invite to portal'}
          </Button>
        </form>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {url && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Share this link with the learner or parent to set up portal access:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">
              {url}
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
