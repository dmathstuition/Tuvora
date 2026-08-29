import type { Metadata } from 'next';
import { Sparkles, Trophy, BookOpen, Star } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor, levelFromPoints } from '@/constants/gamification';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuickMaths } from './quick-maths';
import { Personalise } from './personalise';

export const metadata: Metadata = { title: 'My Portal' };

// Claymorphism surfaces — soft, puffy double shadows (dark + light) so cards
// look moulded from clay. Literal classes so Tailwind generates them.
const clay = 'rounded-[1.75rem] bg-white shadow-[8px_8px_22px_rgba(99,102,241,0.18),-8px_-8px_22px_rgba(255,255,255,0.95)]';
const clayInset = 'rounded-full shadow-[inset_4px_4px_10px_rgba(99,102,241,0.20),inset_-4px_-4px_10px_rgba(255,255,255,0.9)]';

export default async function PortalPage() {
  const data = await getPortalData();

  if (!data.linked || !data.learner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 via-indigo-50 to-white p-6">
        <div className={cn('mx-auto max-w-md p-8 text-center', clay)}>
          <div className="text-6xl">👋</div>
          <h1 className="mt-3 text-xl font-extrabold text-slate-800">No learner account linked yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ask your tutor to add you with this email address, then refresh — your portal will
            appear here automatically.
          </p>
          <form action={logoutAction} className="mt-5">
            <Button variant="outline" type="submit" className="rounded-full">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const { learner, org, points = 0, rank, classes = [], recent = [] } = data;
  const avatar = avatarFor(learner.avatarKey);
  const theme = themeFor(learner.themeKey);
  const level = levelFromPoints(points);

  const stats = [
    { icon: Sparkles, label: 'Points', value: points, tint: 'text-amber-500' },
    { icon: Star, label: 'Level', value: level.level, tint: 'text-indigo-500' },
    { icon: Trophy, label: 'Rank', value: rank ? `#${rank}` : '—', tint: 'text-pink-500' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-indigo-50 to-white">
      {/* Decorative clay blobs */}
      <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-sky-300/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-pink-300/40 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-violet-300/40 blur-2xl" />

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className={cn('px-4 py-2 text-sm font-bold text-slate-700', clay)}>
            {org?.displayName}
          </span>
          <div className="flex items-center gap-2">
            <Personalise currentAvatar={learner.avatarKey} currentTheme={learner.themeKey} />
            <form action={logoutAction}>
              <Button variant="secondary" size="sm" type="submit" className="rounded-full">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {/* Hero */}
        <div className={cn('mt-6 flex flex-col items-center p-8 text-center', clay)}>
          <div
            className={cn(
              'flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br text-6xl',
              theme.gradient,
            )}
            style={{ boxShadow: '10px 10px 24px rgba(99,102,241,0.35), -8px -8px 20px rgba(255,255,255,0.9)' }}
          >
            {avatar.emoji}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-800">Hi, {learner.firstName}! 👋</h1>
          {org?.welcome && <p className="mt-1 max-w-md text-slate-500">{org.welcome}</p>}
        </div>

        {/* Stat pills */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn('flex flex-col items-center gap-1 p-4', clay)}>
                <div className={cn('flex h-11 w-11 items-center justify-center bg-white', clayInset)}>
                  <Icon className={cn('h-5 w-5', s.tint)} />
                </div>
                <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
                <p className="text-xs font-semibold text-slate-400">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Level progress */}
        <div className={cn('mt-5 p-5', clay)}>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span className="text-slate-700">Level {level.level}</span>
            <span className="text-slate-400">
              {level.intoLevel}/{level.forNext} to level {level.level + 1}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-[inset_3px_3px_8px_rgba(99,102,241,0.18)]">
            <div className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)} style={{ width: `${level.progress}%` }} />
          </div>
        </div>

        {/* Game + rewards */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <QuickMaths />
          <div className={cn('p-5', clay)}>
            <h3 className="flex items-center gap-2 font-extrabold text-slate-800">
              <Sparkles className="h-5 w-5 text-amber-500" /> Recent rewards
            </h3>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Play games and do great work to earn points!</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">{r.reason ?? 'Reward'}</span>
                    <span className={r.points >= 0 ? 'font-extrabold text-emerald-500' : 'font-extrabold text-rose-500'}>
                      {r.points >= 0 ? `+${r.points}` : r.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Classes */}
        <div className={cn('mt-5 p-5', clay)}>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-800">
            <BookOpen className="h-5 w-5 text-indigo-500" /> My classes
          </h3>
          {classes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">You&apos;re not in any classes yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {classes.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-[3px_3px_8px_rgba(99,102,241,0.15),-3px_-3px_8px_rgba(255,255,255,0.9)]"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
