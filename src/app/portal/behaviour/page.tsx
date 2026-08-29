import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Smile, ThumbsUp, AlertTriangle } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyBehaviour } from '@/services/portal/extras';
import { avatarFor, themeFor } from '@/constants/gamification';
import { relativeTime } from '@/lib/activity';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'My behaviour' };

export default async function PortalBehaviour() {
  const [data, b] = await Promise.all([getPortalData(), getMyBehaviour()]);
  if (!data.linked || !data.learner || !b) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const maxCat = Math.max(1, ...b.byCategory.map((c) => c.points));

  return (
    <PortalShell active="progress" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold text-brand-900">My behaviour 🌟</h1>

        {/* Positivity meter */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80">
            <Smile className="h-4 w-4" /> Positivity
          </p>
          <p className="mt-1 text-4xl font-extrabold">{b.positivityPct}%</p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${b.positivityPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/85">
            {b.rewardPoints} reward pts · {b.sanctionPoints} sanction pts
          </p>
        </section>

        {/* By category */}
        {b.byCategory.length > 0 && (
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-extrabold text-slate-800">By category</h2>
            <div className="space-y-2.5">
              {b.byCategory.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{c.category}</span>
                    <span className="font-bold text-slate-700">{c.points}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full', c.kind === 'sanction' ? 'bg-rose-400' : 'bg-emerald-400')}
                      style={{ width: `${(c.points / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-slate-800">Recent</h2>
          {b.recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              Nothing yet — keep up the great work!
            </div>
          ) : (
            <ul className="space-y-2">
              {b.recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      e.kind === 'sanction' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600',
                    )}
                  >
                    {e.kind === 'sanction' ? <AlertTriangle className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-700">
                      {e.reason ?? e.category ?? (e.kind === 'sanction' ? 'Sanction' : 'Reward')}
                    </p>
                    <p className="text-xs text-slate-400">{relativeTime(e.date)}</p>
                  </div>
                  <span className={e.points >= 0 ? 'font-extrabold text-emerald-500' : 'font-extrabold text-rose-500'}>
                    {e.points >= 0 ? `+${e.points}` : e.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
