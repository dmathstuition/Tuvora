import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { getMyExams } from '@/services/portal/placement';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';

export const metadata: Metadata = { title: 'Mock exams' };

export default async function PortalExams() {
  const [data, exams] = await Promise.all([getPortalShellData(), getMyExams()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white">
          <h1 className="text-2xl font-extrabold">Mock exams 🎓</h1>
          <p className="mt-1 text-white/85">
            Timed practice exams set by your tutor. Take them to see where you stand before the real
            thing.
          </p>
        </section>

        {exams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">No mock exams right now</p>
            <p className="text-sm text-slate-400">Your tutor will assign exams here when they&apos;re ready.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {exams.map((e) => {
              const done = e.status === 'graded';
              return (
                <li key={e.attemptId}>
                  <Link
                    href={`/portal/placement/${e.attemptId}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span>
                      <span className="block text-sm font-extrabold text-brand-900">{e.title}</span>
                      <span className="text-xs text-slate-400">
                        {e.subjectLabel ? `${e.subjectLabel} · ` : ''}
                        {e.questionCount} questions
                      </span>
                    </span>
                    {done ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600">
                        {e.percentage}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-bold text-white">
                        Start →
                      </span>
                    )}
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
