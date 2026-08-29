import type { Metadata } from 'next';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listThreads, createThreadAction } from '@/services/messages';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = { title: 'Messages' };

const fields = [
  { name: 'subject', label: 'Subject', required: true },
  { name: 'body', label: 'Message', type: 'textarea' as const, required: true },
  {
    name: 'kind',
    label: 'Type',
    type: 'select' as const,
    options: [
      { value: 'direct', label: 'Message' },
      { value: 'announcement', label: 'Announcement' },
    ],
  },
];

export default async function MessagesPage() {
  const ctx = await getAuthContext();
  const canSend = !!ctx && can(ctx, 'messages.send');
  const threads = await listThreads();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Conversations and announcements for your organization.</p>
        </div>
        {canSend && (
          <CreateDialog action={createThreadAction} fields={fields} title="Start a conversation" triggerLabel="New message" submitLabel="Send" />
        )}
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No messages yet"
          description="Start a conversation or post an announcement."
          action={canSend ? <CreateDialog action={createThreadAction} fields={fields} title="Start a conversation" triggerLabel="New message" submitLabel="Send" /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/dashboard/messages/${t.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <MessagesSquare className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{t.subject ?? 'Conversation'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
