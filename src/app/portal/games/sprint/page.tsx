import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { GameEngine } from '@/components/portal/game-engine';

export const metadata: Metadata = { title: 'Math Sprint' };

export default async function SprintGame() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-4">
        <Link href="/portal/learn" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Learn
        </Link>
        <GameEngine mode="sprint" title="Math Sprint ⚡" accent="from-violet-600 to-purple-700" />
      </div>
    </PortalShell>
  );
}
