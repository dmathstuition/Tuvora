import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor } from '@/constants/gamification';
import { logoutAction } from '@/app/(auth)/actions';
import { PortalShell } from '@/components/portal/portal-shell';
import { FeatureGrid } from '@/components/portal/feature-grid';

export const metadata: Metadata = { title: 'Menu' };

export default async function PortalMore() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Menu</h1>
          <p className="text-sm text-slate-500">{data.learner.name}</p>
        </div>

        <FeatureGrid enabledKeys={data.enabledFeatures ?? []} />

        <form action={logoutAction} className="flex justify-end pt-2">
          <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-sm hover:bg-slate-50">
            Sign out
          </button>
        </form>
      </div>
    </PortalShell>
  );
}
