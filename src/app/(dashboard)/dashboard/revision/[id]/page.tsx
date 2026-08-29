import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { getDeckDetail, deleteCardAction } from '@/services/revision';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AddCard } from '../deck-forms';

export const metadata: Metadata = { title: 'Revision deck' };

export default async function RevisionDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const canManage = can(ctx, 'lessons.manage');
  const detail = await getDeckDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/revision" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Revision cards
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{detail.deck.title}</h1>
        <p className="text-sm text-muted-foreground">
          {detail.deck.subject ? `${detail.deck.subject} · ` : ''}
          {detail.cards.length} cards
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a card</CardTitle>
          </CardHeader>
          <CardContent>
            <AddCard deckId={detail.deck.id} disabled={!canManage} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cards</CardTitle>
        </CardHeader>
        <CardContent className={detail.cards.length ? 'p-0' : undefined}>
          {detail.cards.length === 0 ? (
            <EmptyState title="No cards yet" description="Add your first card above." />
          ) : (
            <ul className="divide-y">
              {detail.cards.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="flex-1 font-medium">{c.front}</span>
                  <span className="flex-1 text-muted-foreground">{c.back}</span>
                  {canManage && (
                    <form action={deleteCardAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="deckId" value={detail.deck.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Delete
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
