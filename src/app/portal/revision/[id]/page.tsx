import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getDeckForLearner } from '@/services/revision';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { Flashcards } from '@/components/portal/flashcards';

export const metadata: Metadata = { title: 'Revision deck' };

export default async function PortalRevisionDeck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, deck] = await Promise.all([getPortalData(), getDeckForLearner(id)]);
  if (!data.linked || !data.learner) redirect('/portal');
  if (!deck) notFound();
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-4">
        <Link href="/portal/revision" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Decks
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{deck.deck.title}</h1>
          {deck.deck.subject && <p className="text-sm text-slate-500">{deck.deck.subject}</p>}
        </div>
        <Flashcards cards={deck.cards} />
      </div>
    </PortalShell>
  );
}
