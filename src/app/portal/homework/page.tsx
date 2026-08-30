import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NotebookPen, ClipboardList, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyHomework } from '@/services/portal/homework';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Homework' };

const statusStyle: Record<string, { label: string; tint: string }> = {
  assigned: { label: 'To do', tint: 'bg-amber-100 text-amber-700' },
  late: { label: 'Late', tint: 'bg-rose-100 text-rose-700' },
  submitted: { label: 'Submitted', tint: 'bg-sky-100 text-sky-700' },
  graded: { label: 'Graded', tint: 'bg-emerald-100 text-emerald-700' },
  returned: { label: 'Returned', tint: 'bg-emerald-100 text-emerald-700' },
};

export default async function PortalHomework() {
  const [data, homework] = await Promise.all([getPortalData(), getMyHomework()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  const todo = homework.filter((h) => h.status === 'assigned' || h.status === 'late');

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-lg">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <NotebookPen className="h-6 w-6" /> Homework
          </h1>
          <p className="mt-1 text-white/85">
            {todo.length > 0
              ? `You have ${todo.length} task${todo.length === 1 ? '' : 's'} to complete.`
              : 'You’re all caught up — nice work! 🎉'}
          </p>
        </section>

        {homework.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">No homework yet</p>
            <p className="text-sm text-slate-400">Work your tutor sets will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {homework.map((h) => {
              const st = statusStyle[h.status] ?? { label: 'To do', tint: 'bg-amber-100 text-amber-700' };
              const done = h.status === 'graded' || h.status === 'returned';
              return (
                <li key={h.submissionId}>
                  <Link
                    href={`/portal/homework/${h.submissionId}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        done ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600',
                      )}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <NotebookPen className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-900">
                        {h.title}
                        {h.isCbt && (
                          <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">
                            CBT
                          </span>
                        )}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        {h.className ? `${h.className} · ` : ''}
                        {h.dueAt ? (
                          <>
                            <Clock className="h-3 w-3" /> Due {new Date(h.dueAt).toLocaleDateString()}
                          </>
                        ) : (
                          'No due date'
                        )}
                        {done && h.score != null && ` · ${h.score}${h.maxPoints ? `/${h.maxPoints}` : ''}`}
                      </p>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', st.tint)}>{st.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
