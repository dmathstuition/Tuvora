import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Trophy, Users } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getLeague } from '@/services/portal/league';
import { avatarFor, themeFor, tierFor, TIERS } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Leagues' };

const MEDAL = ['🥇', '🥈', '🥉'];
const TIER_STYLE: Record<string, string> = {
  Bronze: 'bg-amber-100 text-amber-700',
  Silver: 'bg-slate-200 text-slate-600',
  Gold: 'bg-amber-200 text-amber-800',
  Platinum: 'bg-cyan-100 text-cyan-700',
  Diamond: 'bg-indigo-100 text-indigo-700',
};

export default async function PortalLeagues() {
  const [data, league] = await Promise.all([getPortalData(), getLeague()]);
  if (!data.linked || !data.learner || !league) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const tier = tierFor(league.myPoints);

  return (
    <PortalShell active="progress" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">Leagues 🏆</h1>

        {/* My tier */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">Your league</p>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: tier.color }}>
            {tier.label}
          </p>
          <p className="text-sm text-white/80">
            {league.myPoints} points · {league.myRank ? `Rank #${league.myRank}` : 'Unranked'}
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${tier.progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-white/70">
            {tier.nextLabel ? `${tier.toNext} pts to ${tier.nextLabel}` : 'Top tier — legendary! 👑'}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TIERS.map((t, i) => (
              <span
                key={t.key}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-bold',
                  i === tier.index ? 'bg-amber-400 text-brand-900' : 'bg-white/10 text-white/60',
                )}
              >
                {t.label}
              </span>
            ))}
          </div>
        </section>

        {/* Table */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Users className="h-5 w-5 text-pink-500" /> This week&apos;s table
          </h2>
          {league.rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              <Trophy className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              Earn points to enter the league!
            </p>
          ) : (
            <ul className="space-y-2">
              {league.rows.map((r) => {
                const av = avatarFor(r.avatarKey);
                return (
                  <li
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border border-slate-100 p-3 shadow-sm',
                      r.isMe ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-white',
                    )}
                  >
                    <span className="w-7 text-center text-lg font-extrabold text-slate-500">
                      {MEDAL[r.rank - 1] ?? r.rank}
                    </span>
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-700">
                        {r.name} {r.isMe && <span className="text-brand-500">(you)</span>}
                      </span>
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-bold', TIER_STYLE[r.tier] ?? 'bg-slate-100 text-slate-500')}>
                        {r.tier}
                      </span>
                    </span>
                    <span className="text-sm font-extrabold text-amber-600">{r.points}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
