import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  PencilLine,
  CalendarDays,
  Flame,
  Target,
  GraduationCap,
  Gift,
  Trophy,
  Users,
  Bell,
  BookOpen,
  ArrowRight,
  Video,
} from 'lucide-react';
import { NotebookPen } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyLessons } from '@/services/portal/extras';
import { getMyHomework } from '@/services/portal/homework';
import { avatarFor, themeFor, levelFromPoints, tierFor, TIERS } from '@/constants/gamification';
import { LEARNER_FEATURES } from '@/constants/learner-features';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PortalShell } from '@/components/portal/portal-shell';
import { RewardChest } from '@/components/portal/reward-chest';

export const metadata: Metadata = { title: 'My Portal' };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function PortalHome() {
  const [data, lessons, homework] = await Promise.all([
    getPortalData(),
    getMyLessons(),
    getMyHomework(),
  ]);
  const homeworkTodo = homework.filter((h) => h.status === 'assigned' || h.status === 'late').length;

  if (!data.linked || !data.learner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
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

  const {
    learner,
    org,
    points = 0,
    classes = [],
    grade,
    studentId,
    tasksWaiting = 0,
    streakDays = 0,
    progress,
    notices = [],
    quests,
    enabledFeatures = [],
  } = data;
  const avatar = avatarFor(learner.avatarKey);
  const theme = themeFor(learner.themeKey);
  const level = levelFromPoints(points);
  const tier = tierFor(points);
  const enabled = new Set(enabledFeatures);

  const playFeatures = LEARNER_FEATURES.filter((f) => f.group === 'Play' && enabled.has(f.key)).slice(0, 6);

  const progressTiles = [
    { icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', label: 'Average score', value: progress?.avgScore != null ? `${progress.avgScore}%` : '—', pct: progress?.avgScore ?? 0 },
    { icon: PencilLine, tint: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', label: 'Assignments', value: `${progress?.assignmentsDone ?? 0}/${progress?.assignmentsTotal ?? 0}`, pct: progress?.assignmentsTotal ? Math.round(((progress.assignmentsDone ?? 0) / progress.assignmentsTotal) * 100) : 0 },
    { icon: CalendarDays, tint: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500', label: 'Attendance', value: progress?.attendancePct != null ? `${progress.attendancePct}%` : '—', pct: progress?.attendancePct ?? 0 },
    { icon: Flame, tint: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', label: 'Current streak', value: `${streakDays} day${streakDays === 1 ? '' : 's'}`, pct: Math.min(100, streakDays * 14) },
  ];

  const questList = [
    { icon: Target, tint: 'bg-amber-50 text-amber-600', label: 'Play two practice rounds', done: quests?.practiceRounds ?? 0, total: 2 },
    { icon: GraduationCap, tint: 'bg-brand-50 text-brand-600', label: 'Finish a mock exam', done: quests?.mockExam ?? 0, total: 1 },
    { icon: Gift, tint: 'bg-emerald-50 text-emerald-600', label: 'Open your daily reward', done: quests?.chestClaimed ? 1 : 0, total: 1 },
  ];
  const questsDone = questList.filter((q) => q.done >= q.total).length;

  return (
    <PortalShell active="home" studentId={studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        {/* Today's Focus hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-500/20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-amber-300/20" />
          <div className="relative flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                <Sparkles className="h-3.5 w-3.5" /> Today&apos;s Focus
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight">
                {greeting()}, {learner.firstName}! 👋
              </h1>
              <p className="mt-2 max-w-md text-white/85">
                {tasksWaiting > 0
                  ? `You have ${tasksWaiting} task${tasksWaiting === 1 ? '' : 's'} waiting. Complete ${tasksWaiting === 1 ? 'it' : 'them'} and keep your streak alive.`
                  : (org?.welcome ?? "You're all caught up — try a game to earn more points! 🚀")}
              </p>
            </div>
            <div
              className={cn(
                'hidden h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-4xl ring-4 ring-white/40 sm:flex',
                theme.gradient,
              )}
            >
              {avatar.emoji}
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {grade && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
                <GraduationCap className="h-4 w-4" /> {grade}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-sm font-extrabold text-brand-900">
              <Flame className="h-4 w-4" /> {streakDays}-day streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              <Sparkles className="h-4 w-4" /> {points} pts
            </span>
          </div>
        </section>

        {/* Homework */}
        <Link
          href="/portal/homework"
          className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <NotebookPen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-900">Homework</p>
            <p className="text-xs text-slate-400">
              {homeworkTodo > 0
                ? `${homeworkTodo} task${homeworkTodo === 1 ? '' : 's'} to complete`
                : 'All caught up 🎉'}
            </p>
          </div>
          {homeworkTodo > 0 && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-extrabold text-brand-900">
              {homeworkTodo}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </Link>

        {/* Upcoming online lessons */}
        {lessons.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <Video className="h-5 w-5 text-indigo-500" /> Live lessons
              <span className="text-sm font-medium text-slate-400">— tap Join at class time</span>
            </h2>
            <ul className="space-y-2">
              {lessons.slice(0, 4).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Video className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-900">{l.title}</p>
                    <p className="text-xs text-slate-400">
                      {l.note} ·{' '}
                      {new Date(l.startsAt).toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {l.joinUrl ? (
                    <Link
                      href={l.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                      <Video className="h-3.5 w-3.5" /> Join
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap text-xs font-semibold text-slate-400">Link soon</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* My progress */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800">My progress</h2>
            <Link href="/portal/progress" className="flex items-center gap-1 text-sm font-bold text-amber-600">
              Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {progressTiles.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', t.tint)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-2xl font-extrabold text-brand-900">{t.value}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.label}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${Math.min(100, t.pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Play & learn */}
        {playFeatures.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <Sparkles className="h-5 w-5 text-amber-500" /> Play &amp; learn
              <span className="text-sm font-medium text-slate-400">— pick one and go</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {playFeatures.map((f) => {
                const Icon = f.icon;
                const soon = f.status === 'soon';
                const card = (
                  <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white', f.accent)}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-6 text-lg font-extrabold">{f.label}</p>
                    <p className="text-sm text-white/80">{soon ? 'Coming soon' : f.tagline}</p>
                  </div>
                );
                return soon ? <div key={f.key}>{card}</div> : <Link key={f.key} href={f.href}>{card}</Link>;
              })}
            </div>
          </section>
        )}

        {/* Daily reward */}
        <RewardChest claimed={quests?.chestClaimed ?? false} />

        {/* Daily quests */}
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <Target className="h-5 w-5 text-amber-500" /> Daily quests
            </h2>
            <span className="text-sm font-bold text-slate-400">{questsDone}/3 done</span>
          </div>
          <ul className="space-y-2">
            {questList.map((q) => {
              const Icon = q.icon;
              const complete = q.done >= q.total;
              return (
                <li key={q.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', q.tint)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={cn('flex-1 text-sm font-bold', complete ? 'text-emerald-600 line-through' : 'text-slate-700')}>
                    {q.label}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    {Math.min(q.done, q.total)}/{q.total}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-center text-sm text-slate-500">
            Clear all three today for a <span className="font-bold text-amber-600">+15</span> bonus.
          </p>
        </section>

        {/* League / tier card */}
        <section className="overflow-hidden rounded-3xl bg-brand-900 p-6 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Level</span>
              <span className="text-4xl font-extrabold">{level.level}</span>
              <span className="text-xs font-bold text-amber-400">{tier.label}</span>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xl font-extrabold">
              <Trophy className="h-5 w-5 text-amber-400" /> {points} reward points
            </p>
            <p className="text-sm text-white/70">
              {tier.nextLabel ? `${tier.toNext} pts to ${tier.nextLabel}` : "You've reached the top tier! 👑"}
            </p>
          </div>
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${tier.progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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
          </div>
          <Link
            href="/portal/progress"
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-sm font-bold hover:bg-white/20"
          >
            <Users className="h-4 w-4" /> This week&apos;s league <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Latest notices */}
        {notices.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <Bell className="h-5 w-5 text-amber-500" /> Latest notices
            </h2>
            <ul className="space-y-2">
              {notices.map((n) => (
                <li key={n.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-brand-800">{n.subject}</p>
                    <p className="text-xs text-slate-400">{new Date(n.date).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* My classes */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
              <BookOpen className="h-5 w-5 text-brand-600" /> My classes
            </h2>
            <Link href="/portal/learn" className="flex items-center gap-1 text-sm font-bold text-amber-600">
              All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {classes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-bold text-brand-800">No classes scheduled</p>
              <p className="text-sm text-slate-400">Your next live class will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <span key={c.id} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
