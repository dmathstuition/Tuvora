'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  Sparkles,
  Trophy,
  Gamepad2,
  ArrowRight,
} from 'lucide-react';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tab = 'dashboard' | 'portal' | 'leaderboard';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Tutor dashboard' },
  { key: 'portal', label: 'Learner portal' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

const trend = [
  { label: '2 Jun', value: 68, count: 3 },
  { label: '9 Jun', value: 72, count: 5 },
  { label: '16 Jun', value: 70, count: 4 },
  { label: '23 Jun', value: 78, count: 6 },
  { label: '30 Jun', value: 81, count: 5 },
  { label: '7 Jul', value: 84, count: 7 },
  { label: '14 Jul', value: 83, count: 6 },
  { label: '21 Jul', value: 88, count: 8 },
];

const leaders = [
  { name: 'Amara O.', avatar: '🦊', points: 940, medal: '🥇' },
  { name: 'David K.', avatar: '🚀', points: 880, medal: '🥈' },
  { name: 'Zainab A.', avatar: '🦄', points: 815, medal: '🥉' },
  { name: 'Tunde B.', avatar: '🦁', points: 760, medal: '4' },
  { name: 'Chidi N.', avatar: '🐼', points: 705, medal: '5' },
  { name: 'Fatima S.', avatar: '⭐', points: 640, medal: '6' },
];

export function DemoShowcase() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-card p-1 text-sm shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-4 py-1.5 font-medium transition-colors',
                tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Device frame */}
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-muted-foreground">app.tuvora.com/{tab === 'dashboard' ? 'dashboard' : tab}</span>
        </div>

        <div className="bg-muted/20 p-4 sm:p-6">
          {tab === 'dashboard' && <DashboardDemo />}
          {tab === 'portal' && <PortalDemo />}
          {tab === 'leaderboard' && <LeaderboardDemo />}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button asChild size="lg">
          <Link href="/signup">
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">Your first learner is free for a month.</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DashboardDemo() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Open learners" value="24" hint="₦300/learner/mo" />
        <Stat icon={GraduationCap} label="Active classes" value="6" />
        <Stat icon={CalendarCheck} label="Attendance today" value="18" hint="records logged" />
        <Stat icon={Wallet} label="Revenue (mo)" value="₦180k" hint="+26% vs last" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <p className="mb-2 text-sm font-semibold">Learner performance</p>
          <PerformanceChart data={trend} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Recent activity</p>
          <ul className="space-y-3 text-sm">
            {[
              ['Amara submitted Algebra WS 3', '2m'],
              ['You graded 6 assignments', '1h'],
              ['New learner: Chidi N.', '3h'],
              ['Attendance taken · JSS2 Maths', '5h'],
            ].map(([t, when]) => (
              <li key={t} className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">{t}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PortalDemo() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 px-5 pb-12 pt-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
            Bright Minds Academy
          </span>
          <Badge className="bg-white/20 text-white">Level 7</Badge>
        </div>
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-5xl ring-4 ring-white/30">
            🦊
          </div>
          <h3 className="mt-3 text-2xl font-bold">Hi, Amara! 👋</h3>
          <p className="text-sm text-white/85">Ready to earn some points today?</p>
        </div>
      </div>
      <div className="-mt-8 grid grid-cols-3 gap-3 px-5">
        {[
          { icon: Sparkles, label: 'Points', value: '940' },
          { icon: Trophy, label: 'Level', value: '7' },
          { icon: Trophy, label: 'Rank', value: '#1' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center shadow-sm">
              <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Gamepad2 className="h-4 w-4" /> Quick Maths
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            30-second challenge — every correct answer earns a point.
          </p>
          <div className="mt-3 rounded-lg bg-card p-3 text-center">
            <p className="text-2xl font-bold">7 × 8</p>
            <div className="mx-auto mt-2 h-8 w-24 rounded-md border" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> Recent rewards
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ['Great effort in class', '+20'],
              ['Quick Maths challenge', '+9'],
              ['Homework complete', '+10'],
            ].map(([t, p]) => (
              <li key={t} className="flex justify-between">
                <span className="text-muted-foreground">{t}</span>
                <span className="font-bold text-success">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LeaderboardDemo() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Bright Minds Academy · Leaderboard</p>
      </div>
      <ul className="divide-y">
        {leaders.map((l, i) => (
          <li key={l.name} className={cn('flex items-center gap-4 px-4 py-3', i < 3 && 'bg-muted/40')}>
            <span className="w-7 text-center text-lg font-bold">{l.medal}</span>
            <span className="text-2xl">{l.avatar}</span>
            <span className="flex-1 font-medium">{l.name}</span>
            <span className="text-lg font-bold">{l.points}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
