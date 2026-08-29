import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { FeatureGrid } from '@/components/portal/feature-grid';
import { JoinCodeEntry } from '@/components/portal/join-class';
import { QuickMaths } from '../quick-maths';

export const metadata: Metadata = { title: 'Learn' };

export default async function PortalLearn() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const classes = data.classes ?? [];

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Learn &amp; play</h1>
          <p className="text-sm text-slate-500">Games, practice and your class materials.</p>
        </div>

        <QuickMaths />

        <JoinCodeEntry />

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <BookOpen className="h-5 w-5 text-brand-600" /> My classes
          </h2>
          {classes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              No classes yet — your tutor will add you soon.
            </p>
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

        <FeatureGrid enabledKeys={data.enabledFeatures ?? []} groups={['Learn', 'Play', 'AI Tools']} />
      </div>
    </PortalShell>
  );
}
