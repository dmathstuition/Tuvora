import type { Metadata } from 'next';
import { Sparkles, Trophy, BookOpen } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor, levelFromPoints } from '@/constants/gamification';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuickMaths } from './quick-maths';
import { Personalise } from './personalise';

export const metadata: Metadata = { title: 'My Portal' };

export default async function PortalPage() {
  const data = await getPortalData();

  if (!data.linked || !data.learner) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="text-xl font-bold">No learner account linked yet</h1>
        <p className="text-sm text-muted-foreground">
          Ask your tutor to add you with this email address, then refresh — your portal will appear
          here automatically.
        </p>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  const { learner, org, points = 0, rank, classes = [], recent = [] } = data;
  const avatar = avatarFor(learner.avatarKey);
  const theme = themeFor(learner.themeKey);
  const level = levelFromPoints(points);

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Hero */}
      <div className={cn('bg-gradient-to-br px-4 pb-16 pt-8 text-white', theme.gradient)}>
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
            {org?.displayName}
          </span>
          <div className="flex items-center gap-2">
            <Personalise currentAvatar={learner.avatarKey} currentTheme={learner.themeKey} />
            <form action={logoutAction}>
              <Button
                variant="secondary"
                size="sm"
                type="submit"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-6xl shadow-lg ring-4 ring-white/30">
            {avatar.emoji}
          </div>
          <h1 className="mt-4 text-3xl font-bold">Hi, {learner.firstName}! 👋</h1>
          {org?.welcome && <p className="mt-1 max-w-lg text-white/85">{org.welcome}</p>}
        </div>
      </div>

      {/* Stat cards overlapping the hero */}
      <div className="mx-auto -mt-10 grid max-w-4xl grid-cols-3 gap-3 px-4">
        {[
          { icon: Sparkles, label: 'Points', value: points },
          { icon: Trophy, label: 'Level', value: level.level },
          { icon: Trophy, label: 'Rank', value: rank ? `#${rank}` : '—' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border bg-card p-4 text-center shadow-sm"
            >
              <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Level progress */}
      <div className="mx-auto mt-4 max-w-4xl px-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">Level {level.level}</span>
            <span className="text-muted-foreground">
              {level.intoLevel}/{level.forNext} to level {level.level + 1}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full bg-gradient-to-r', theme.gradient)} style={{ width: `${level.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Game + content */}
      <div className="mx-auto mt-4 grid max-w-4xl gap-4 px-4 lg:grid-cols-2">
        <QuickMaths />

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5" /> Recent rewards
          </h3>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Earn points by playing games and doing great work!
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.reason ?? 'Reward'}</span>
                  <span className={r.points >= 0 ? 'font-bold text-success' : 'font-bold text-destructive'}>
                    {r.points >= 0 ? `+${r.points}` : r.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" /> My classes
          </h3>
          {classes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You&apos;re not in any classes yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {classes.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
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
