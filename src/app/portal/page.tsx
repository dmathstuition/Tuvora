import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Trophy, BookOpen, Star, ClipboardCheck, Medal, Gift, Rocket } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyPlacements } from '@/services/portal/placement';
import { avatarFor, themeFor, levelFromPoints, badgesFor } from '@/constants/gamification';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuickMaths } from './quick-maths';
import { Personalise } from './personalise';

export const metadata: Metadata = { title: 'My Portal' };

// Claymorphism surface — soft puffy shadow so cards look moulded from clay.
const clay =
  'rounded-[1.75rem] bg-white shadow-[8px_8px_22px_rgba(99,102,241,0.16),-8px_-8px_22px_rgba(255,255,255,0.95)]';

/** A bright, kid-friendly section card with a coloured title + icon. */
function KidCard({
  title,
  emoji,
  icon: Icon,
  tint,
  className,
  children,
}: {
  title: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tint: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('p-5', clay, className)}>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
        {Icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', tint)}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        {emoji && <span className="text-xl">{emoji}</span>}
        {title}
      </h3>
      {children}
    </section>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default async function PortalPage() {
  const data = await getPortalData();
  const placements = data.linked ? await getMyPlacements() : [];

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

  const { learner, org, points = 0, rank, classes = [], recent = [], leaderboard = [] } = data;
  const avatar = avatarFor(learner.avatarKey);
  const theme = themeFor(learner.themeKey);
  const level = levelFromPoints(points);
  const badges = badgesFor(points, level.level, rank ?? null);
  const earnedCount = badges.filter((b) => b.earned).length;

  // Rainbow stat bubbles — each its own bright gradient.
  const stats = [
    { icon: Sparkles, label: 'Points', value: points, grad: 'from-amber-400 to-orange-500' },
    { icon: Star, label: 'Level', value: level.level, grad: 'from-violet-400 to-purple-500' },
    { icon: Trophy, label: 'Rank', value: rank ? `#${rank}` : '—', grad: 'from-pink-400 to-rose-500' },
    { icon: Medal, label: 'Badges', value: `${earnedCount}/${badges.length}`, grad: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-fuchsia-50 to-amber-50">
      {/* Playful floating blobs */}
      <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-sky-300/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-pink-300/40 blur-2xl" />
      <div className="pointer-events-none absolute bottom-24 left-1/3 h-48 w-48 rounded-full bg-amber-300/40 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-40 w-40 rounded-full bg-emerald-300/40 blur-2xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={cn('px-4 py-2 text-sm font-extrabold text-indigo-600', clay)}>
            🎓 {org?.displayName}
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
        <div className={cn('mt-6 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left', clay)}>
          <div
            className={cn(
              'flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-5xl ring-4 ring-white',
              theme.gradient,
            )}
            style={{ boxShadow: '10px 10px 24px rgba(99,102,241,0.30), -8px -8px 20px rgba(255,255,255,0.9)' }}
          >
            {avatar.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-slate-800">Hi, {learner.firstName}! 👋</h1>
            <p className="mt-1 text-slate-500">
              {org?.welcome ?? "Let's learn something awesome today! 🚀"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
                ✨ {points} points
              </span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                ⭐ Level {level.level}
              </span>
              {rank && (
                <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-bold text-pink-700">
                  🏆 Rank #{rank}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rainbow stat bubbles */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn('flex flex-col items-center gap-2 p-4 text-center', clay)}>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white', s.grad)}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Level progress */}
        <div className={cn('mt-5 p-5', clay)}>
          <div className="mb-2 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-700">⭐ Level {level.level}</span>
            <span className="text-slate-400">
              {level.intoLevel}/{level.forNext} to level {level.level + 1}
            </span>
          </div>
          <div className="h-5 w-full overflow-hidden rounded-full bg-slate-100 shadow-[inset_3px_3px_8px_rgba(99,102,241,0.18)]">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all', theme.gradient)}
              style={{ width: `${level.progress}%` }}
            />
          </div>
        </div>

        {/* Play & Earn + Leaderboard */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <QuickMaths />
          <KidCard title="Leaderboard" icon={Trophy} tint="bg-amber-100 text-amber-600">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500">Earn points to climb the board! 🧗</p>
            ) : (
              <ul className="space-y-2">
                {leaderboard.map((p) => {
                  const av = avatarFor(p.avatarKey);
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-2',
                        p.isMe
                          ? 'bg-gradient-to-r from-indigo-100 to-violet-100 ring-2 ring-violet-300'
                          : 'bg-slate-50',
                      )}
                    >
                      <span className="w-6 text-center text-lg font-extrabold">
                        {MEDAL[p.rank - 1] ?? `#${p.rank}`}
                      </span>
                      <span className="text-2xl">{av.emoji}</span>
                      <span className="flex-1 truncate text-sm font-bold text-slate-700">
                        {p.name} {p.isMe && <span className="text-violet-500">(you)</span>}
                      </span>
                      <span className="text-sm font-extrabold text-amber-600">{p.points}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </KidCard>
        </div>

        {/* Rewards + Aptitude tests */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <KidCard title="My Rewards" icon={Gift} tint="bg-pink-100 text-pink-600">
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">Do great work to earn rewards! 🌈</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{r.reason ?? 'Reward'}</span>
                    <span className={r.points >= 0 ? 'font-extrabold text-emerald-500' : 'font-extrabold text-rose-500'}>
                      {r.points >= 0 ? `+${r.points}` : r.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </KidCard>

          <KidCard title="Aptitude Tests" icon={ClipboardCheck} tint="bg-violet-100 text-violet-600">
            {placements.length === 0 ? (
              <p className="text-sm text-slate-500">No tests right now — check back soon! 📝</p>
            ) : (
              <ul className="space-y-2">
                {placements.map((p) => {
                  const done = p.status === 'graded';
                  return (
                    <li key={p.attemptId}>
                      <Link
                        href={`/portal/placement/${p.attemptId}`}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-violet-50"
                      >
                        <span>
                          <span className="block text-sm font-bold text-slate-700">{p.title}</span>
                          <span className="text-xs text-slate-400">
                            {p.subjectLabel ? `${p.subjectLabel} · ` : ''}
                            {p.questionCount} questions
                          </span>
                        </span>
                        {done ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600">
                            {p.percentage}% · {p.placementLevel}
                          </span>
                        ) : (
                          <span className="rounded-full bg-violet-500 px-4 py-1.5 text-xs font-bold text-white">
                            Start →
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </KidCard>
        </div>

        {/* Badges */}
        <KidCard title="My Badges" icon={Medal} tint="bg-emerald-100 text-emerald-600" className="mt-5">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {badges.map((b) => (
              <div
                key={b.key}
                title={b.hint}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl p-3 text-center',
                  b.earned
                    ? 'bg-gradient-to-br from-amber-100 to-pink-100'
                    : 'bg-slate-50 opacity-60 grayscale',
                )}
              >
                <span className="text-3xl">{b.earned ? b.emoji : '🔒'}</span>
                <span className="text-[11px] font-bold leading-tight text-slate-600">{b.label}</span>
              </div>
            ))}
          </div>
        </KidCard>

        {/* Classes */}
        <KidCard title="My Classes" icon={BookOpen} tint="bg-sky-100 text-sky-600" className="mt-5">
          {classes.length === 0 ? (
            <p className="text-sm text-slate-500">You&apos;re not in any classes yet. 📚</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c, i) => {
                const tints = [
                  'bg-sky-100 text-sky-700',
                  'bg-pink-100 text-pink-700',
                  'bg-amber-100 text-amber-700',
                  'bg-emerald-100 text-emerald-700',
                  'bg-violet-100 text-violet-700',
                ];
                return (
                  <span
                    key={c.id}
                    className={cn('rounded-full px-4 py-2 text-sm font-bold', tints[i % tints.length])}
                  >
                    {c.name}
                  </span>
                );
              })}
            </div>
          )}
        </KidCard>

        <p className="mt-8 flex items-center justify-center gap-1 text-center text-sm font-semibold text-slate-400">
          <Rocket className="h-4 w-4" /> Keep going, {learner.firstName} — you&apos;re doing amazing!
        </p>
      </div>
    </div>
  );
}
