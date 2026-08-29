import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getThread } from '@/services/messages';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReplyForm } from './reply-form';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getThread(id);
  if (!detail) notFound();
  const { thread, messages, canSend } = detail;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/dashboard/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Messages
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight">{thread.subject ?? 'Conversation'}</h1>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  m.mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {m.senderName} · {new Date(m.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </CardContent>
        {canSend && (
          <CardFooter className="border-t pt-4">
            <div className="w-full">
              <ReplyForm threadId={thread.id} />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
