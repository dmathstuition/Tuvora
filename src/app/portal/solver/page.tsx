import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Compass } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { SolverForm } from './solver-form';

export const metadata: Metadata = { title: 'Question solver' };

export default async function PortalSolver() {
  const data = await getPortalShellData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 text-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
            <Compass className="h-3.5 w-3.5" /> Tuvoria A.I
          </p>
          <h1 className="mt-2 text-2xl font-extrabold">Question solver 🤖</h1>
          <p className="mt-1 text-white/85">
            Stuck on a problem? Ask and I&apos;ll walk you through it step by step — so you learn how,
            not just the answer.
          </p>
        </section>

        <SolverForm />
      </div>
    </PortalShell>
  );
}
