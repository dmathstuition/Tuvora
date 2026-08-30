import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Bell, Sparkles, AlertTriangle, GraduationCap, FileText } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { getMyNotifications, type Notification } from '@/services/portal/extras';
import { avatarFor, themeFor } from '@/constants/gamification';
import { relativeTime } from '@/lib/activity';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Notifications' };

const STYLE: Record<Notification['kind'], { icon: typeof Bell; tint: string }> = {
  reward: { icon: Sparkles, tint: 'bg-amber-100 text-amber-600' },
  sanction: { icon: AlertTriangle, tint: 'bg-rose-100 text-rose-600' },
  certificate: { icon: GraduationCap, tint: 'bg-indigo-100 text-indigo-600' },
  test: { icon: FileText, tint: 'bg-violet-100 text-violet-600' },
  notice: { icon: Bell, tint: 'bg-sky-100 text-sky-600' },
};

export default async function PortalNotifications() {
  const [data, items] = await Promise.all([getPortalShellData(), getMyNotifications()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold text-brand-900">Notifications 🔔</h1>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">You&apos;re all caught up</p>
            <p className="text-sm text-slate-400">New activity will show up here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const s = STYLE[n.kind];
              const Icon = s.icon;
              return (
                <li key={n.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.tint)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-900">{n.title}</p>
                    <p className="truncate text-xs text-slate-400">{n.subtitle}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">{relativeTime(n.date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
