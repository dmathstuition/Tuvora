'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { replyAction, type MessageState } from '@/services/messages';
import { Button } from '@/components/ui/button';

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(replyAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={action} className="flex items-end gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Write a reply…"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={pending} aria-label="Send">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
