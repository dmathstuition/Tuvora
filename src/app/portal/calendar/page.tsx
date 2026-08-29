import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CalendarDays, BookOpen, ListChecks } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyCalendar } from '@/services/portal/extras';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Calendar' };

export default async function PortalCalendar() {
  const [data, items] = await Promise.all([getPortalData(), getMyCalendar()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold text-brand-900">Calendar 📅</h1>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">Nothing scheduled yet</p>
            <p className="text-sm text-slate-400">Your classes and tasks will show up here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const Icon = it.kind === 'class' ? BookOpen : ListChecks;
              return (
                <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      it.kind === 'class' ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-900">{it.title}</p>
                    <p className="text-xs text-slate-400">{it.note}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-500">
                    {it.date ? new Date(it.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Anytime'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
