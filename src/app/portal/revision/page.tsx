import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Layers, ArrowRight } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getDecksForLearner } from '@/services/revision';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';

export const metadata: Metadata = { title: 'Revision cards' };

export default async function PortalRevision() {
  const [data, decks] = await Promise.all([getPortalData(), getDecksForLearner()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <h1 className="text-2xl font-extrabold">Revision cards 🃏</h1>
          <p className="mt-1 text-white/85">Flip through flashcards from your tutor to revise fast.</p>
        </section>

        {decks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">No decks yet</p>
            <p className="text-sm text-slate-400">Your tutor will add revision decks here.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map((d) => (
              <Link
                key={d.id}
                href={`/portal/revision/${d.id}`}
                className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Layers className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-brand-900">{d.title}</p>
                  <p className="text-xs text-slate-400">
                    {d.subject ? `${d.subject} · ` : ''}
                    {d.cardCount} cards
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
