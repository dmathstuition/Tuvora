import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Layers, ArrowRight } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listDecks } from '@/services/revision';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDeck } from './deck-forms';

export const metadata: Metadata = { title: 'Revision cards' };

export default async function RevisionAdminPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const canManage = can(ctx, 'lessons.manage');
  const decks = await listDecks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Layers className="h-6 w-6" /> Revision cards
        </h1>
        <p className="text-sm text-muted-foreground">
          Build flashcard decks your learners can flip through to revise.
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New deck</CardTitle>
            <CardDescription>Create a deck, then add cards to it.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDeck disabled={!canManage} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decks</CardTitle>
        </CardHeader>
        <CardContent className={decks.length ? 'p-0' : undefined}>
          {decks.length === 0 ? (
            <EmptyState icon={Layers} title="No decks yet" description="Create your first deck above." />
          ) : (
            <ul className="divide-y">
              {decks.map((d) => (
                <li key={d.id}>
                  <Link href={`/dashboard/revision/${d.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.subject ? `${d.subject} · ` : ''}
                        {d.cardCount} cards
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
