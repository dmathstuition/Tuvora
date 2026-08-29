import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TrendingUp, Trophy, Medal, Users, Sparkles } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor, levelFromPoints, tierFor, badgesFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Progress' };

const MEDAL = ['🥇', '🥈', '🥉'];

export default async function PortalProgress() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const points = data.points ?? 0;
  const level = levelFromPoints(points);
  const tier = tierFor(points);
  const badges = badgesFor(points, level.level, data.rank ?? null);
  const leaderboard = data.leaderboard ?? [];
  const recent = data.recent ?? [];
  const p = data.progress;

  const stats = [
    { label: 'Average score', value: p?.avgScore != null ? `${p.avgScore}%` : '—' },
    { label: 'Attendance', value: p?.attendancePct != null ? `${p.attendancePct}%` : '—' },
    { label: 'Assignments', value: `${p?.assignmentsDone ?? 0}/${p?.assignmentsTotal ?? 0}` },
    { label: 'Points', value: String(points) },
  ];

  return (
    <PortalShell active="progress" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">My progress</h1>

        {/* League card */}
        <section className="rounded-3xl bg-brand-900 p-6 text-center text-white">
          <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Level</span>
            <span className="text-3xl font-extrabold">{level.level}</span>
            <span className="text-xs font-bold text-amber-400">{tier.label}</span>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-lg font-extrabold">
            <Trophy className="h-5 w-5 text-amber-400" /> {points} reward points
          </p>
          <p className="text-sm text-white/70">
            {tier.nextLabel ? `${tier.toNext} pts to ${tier.nextLabel}` : 'Top tier reached! 👑'}
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${tier.progress}%` }} />
          </div>
        </section>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-brand-900">{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Medal className="h-5 w-5 text-amber-500" /> My badges
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {badges.map((b) => (
              <div
                key={b.key}
                title={b.hint}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border border-slate-100 p-3 text-center shadow-sm',
                  b.earned ? 'bg-white' : 'bg-slate-50 opacity-60',
                )}
              >
                <span className="text-3xl">{b.earned ? b.emoji : '🔒'}</span>
                <span className="text-[11px] font-bold leading-tight text-slate-600">{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Users className="h-5 w-5 text-pink-500" /> Academy leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              Earn points to climb the board!
            </p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((row) => {
                const av = avatarFor(row.avatarKey);
                return (
                  <li
                    key={row.id}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border border-slate-100 p-3 shadow-sm',
                      row.isMe ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-white',
                    )}
                  >
                    <span className="w-7 text-center text-lg font-extrabold">
                      {MEDAL[row.rank - 1] ?? `#${row.rank}`}
                    </span>
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="flex-1 truncate text-sm font-bold text-slate-700">
                      {row.name} {row.isMe && <span className="text-brand-500">(you)</span>}
                    </span>
                    <span className="text-sm font-extrabold text-amber-600">{row.points}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent rewards */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Sparkles className="h-5 w-5 text-amber-500" /> Recent rewards
          </h2>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              Do great work to earn rewards!
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <span className="text-sm text-slate-600">{r.reason ?? 'Reward'}</span>
                  <span className={r.points >= 0 ? 'font-extrabold text-emerald-500' : 'font-extrabold text-rose-500'}>
                    {r.points >= 0 ? `+${r.points}` : r.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="flex items-center justify-center gap-1 pt-2 text-center text-sm font-semibold text-slate-400">
          <TrendingUp className="h-4 w-4" /> Keep going — you&apos;re climbing fast!
        </p>
      </div>
    </PortalShell>
  );
}
