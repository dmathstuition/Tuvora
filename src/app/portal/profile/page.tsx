import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor, levelFromPoints, tierFor } from '@/constants/gamification';
import { logoutAction } from '@/app/(auth)/actions';
import { PortalShell } from '@/components/portal/portal-shell';
import { Personalise } from '../personalise';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Profile' };

export default async function PortalProfile() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const { learner, org, points = 0, studentId, grade } = data;
  const avatar = avatarFor(learner.avatarKey);
  const theme = themeFor(learner.themeKey);
  const level = levelFromPoints(points);
  const tier = tierFor(points);

  return (
    <PortalShell active="profile" studentId={studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        {/* Profile hero */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-center text-white">
          <div
            className={cn(
              'mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br text-5xl ring-4 ring-white/30',
              theme.gradient,
            )}
          >
            {avatar.emoji}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">{learner.name}</h1>
          <p className="text-sm text-white/70">{org?.displayName}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">⭐ Level {level.level}</span>
            <span className="rounded-full bg-amber-400/90 px-3 py-1 text-sm font-bold text-brand-900">🏆 {tier.label}</span>
            {grade && <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">🎓 {grade}</span>}
          </div>
          {studentId && <p className="mt-3 font-mono text-xs tracking-wider text-white/50">{studentId}</p>}
        </section>

        {/* Avatar Studio */}
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Sparkles className="h-5 w-5 text-fuchsia-500" /> Avatar Studio
          </h2>
          <p className="mb-4 text-sm text-slate-500">Pick your look and colour theme.</p>
          <Personalise currentAvatar={learner.avatarKey} currentTheme={learner.themeKey} />
        </section>

        <form action={logoutAction}>
          <button className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-rose-600 shadow-sm hover:bg-rose-50">
            Sign out
          </button>
        </form>
      </div>
    </PortalShell>
  );
}
