import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MessageSquare, Bell } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';

export const metadata: Metadata = { title: 'Messages' };

export default async function PortalMessages() {
  const data = await getPortalData();
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const notices = data.notices ?? [];

  return (
    <PortalShell active="messages" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">Messages &amp; notices</h1>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Bell className="h-5 w-5 text-amber-500" /> Notices from your academy
          </h2>
          {notices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-bold text-brand-800">No notices yet</p>
              <p className="text-sm text-slate-400">Announcements from your tutor will show here.</p>
            </div>
          ) : (
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
          )}
        </section>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-bold text-brand-800">Direct messages are coming soon</p>
          <p className="text-sm text-slate-400">You&apos;ll be able to chat with your tutor here.</p>
        </div>
      </div>
    </PortalShell>
  );
}
