import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, FileText, Clock, GraduationCap, CheckCircle2, Paperclip } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { getHomeworkDetail } from '@/services/portal/homework';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { SubmitHomeworkForm } from './submit-form';

export const metadata: Metadata = { title: 'Homework' };

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, hw] = await Promise.all([getPortalShellData(), getHomeworkDetail(id)]);
  if (!data.linked || !data.learner) redirect('/portal');
  if (!hw) notFound();

  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);
  const graded = hw.status === 'graded' || hw.status === 'returned';
  const submitted = hw.status === 'submitted' || hw.status === 'late';

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <Link href="/portal/homework" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Homework
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-extrabold">{hw.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
            {hw.className && <span>{hw.className}</span>}
            {hw.dueAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> Due {new Date(hw.dueAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </section>

        {hw.instructions && (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-bold text-brand-900">Instructions</p>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{hw.instructions}</p>
          </div>
        )}

        {hw.questionFiles.length > 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-brand-900">
              <Paperclip className="h-4 w-4" /> Question files
            </p>
            <div className="flex flex-wrap gap-2">
              {hw.questionFiles.map((f) =>
                f.url ? (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-slate-100"
                  >
                    <FileText className="h-4 w-4 text-indigo-600" /> {f.name}
                  </a>
                ) : null,
              )}
            </div>
          </div>
        )}

        {/* Graded result */}
        {graded && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 text-lg font-extrabold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              {hw.score != null ? `${hw.score}${hw.maxPoints ? ` / ${hw.maxPoints}` : ''}` : 'Graded'}
            </p>
            {hw.feedback && <p className="mt-1 text-sm text-emerald-800">{hw.feedback}</p>}
          </div>
        )}

        {/* CBT test → send to the exam runner */}
        {hw.isCbt ? (
          <div className="rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-sm">
            <GraduationCap className="mx-auto h-8 w-8 text-rose-500" />
            <p className="mt-2 font-bold text-brand-900">This homework is a CBT test</p>
            <p className="text-sm text-slate-400">Take it in the exams area.</p>
            <Link
              href="/portal/exams"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
            >
              Go to exams
            </Link>
          </div>
        ) : graded ? null : (
          <>
            {/* Already-submitted files */}
            {hw.myFiles.length > 0 && (
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-bold text-brand-900">Your submitted files</p>
                <div className="flex flex-wrap gap-2">
                  {hw.myFiles.map((f) =>
                    f.url ? (
                      <a
                        key={f.id}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium hover:bg-slate-100"
                      >
                        <FileText className="h-4 w-4 text-indigo-600" /> {f.name}
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            )}
            {submitted && (
              <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                Submitted — you can still add more or update it until your tutor grades it.
              </p>
            )}
            <SubmitHomeworkForm
              submissionId={hw.submissionId}
              defaultContent={hw.content}
              resubmit={submitted}
              allowedFormats={hw.allowedFormats}
            />
          </>
        )}
      </div>
    </PortalShell>
  );
}
