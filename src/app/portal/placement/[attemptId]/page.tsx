import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPlacementAttempt } from '@/services/portal/placement';
import { placementFor } from '@/lib/placement/grade';
import { TakeTest } from './take-test';

export const metadata: Metadata = { title: 'Placement test' };

const clay =
  'rounded-[1.75rem] bg-white shadow-[8px_8px_22px_rgba(99,102,241,0.18),-8px_-8px_22px_rgba(255,255,255,0.95)]';

export default async function PlacementPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getPlacementAttempt(attemptId);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-indigo-50 to-white">
      <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-sky-300/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-pink-300/40 blur-2xl" />

      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href="/portal"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my portal
        </Link>

        {!attempt ? (
          <div className={`${clay} p-8 text-center`}>
            <div className="text-5xl">🤔</div>
            <h1 className="mt-3 text-lg font-extrabold text-slate-800">Test not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This placement test isn&apos;t available for your account.
            </p>
          </div>
        ) : attempt.status === 'graded' ? (
          <ResultView attempt={attempt} />
        ) : (
          <>
            <div className={`${clay} mb-5 p-6`}>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                Aptitude test{attempt.subjectLabel ? ` · ${attempt.subjectLabel}` : ''}
              </p>
              <h1 className="mt-1 text-xl font-extrabold text-slate-800">{attempt.title}</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Answer every question as best you can — there are {attempt.questions.length} of them.
                This helps your tutor place you at the right level. Take your time! 🌟
              </p>
            </div>
            <TakeTest
              attemptId={attempt.attemptId}
              questions={attempt.questions}
              clay={clay}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ResultView({
  attempt,
}: {
  attempt: NonNullable<Awaited<ReturnType<typeof getPlacementAttempt>>>;
}) {
  const pct = attempt.percentage ?? 0;
  const placement = attempt.placementLevel
    ? { level: attempt.placementLevel, notes: attempt.placementNotes ?? '' }
    : placementFor(pct);
  return (
    <div className={`${clay} p-8 text-center`}>
      <div className="text-5xl">🎉</div>
      <h1 className="mt-3 text-lg font-extrabold text-slate-800">All done!</h1>
      <p className="mt-1 text-sm text-slate-500">You completed {attempt.title}.</p>
      <div className="mx-auto mt-6 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-[8px_8px_22px_rgba(99,102,241,0.35),-6px_-6px_18px_rgba(255,255,255,0.7)]">
        <span className="text-3xl font-extrabold">{pct}%</span>
        <span className="text-xs font-semibold opacity-90">score</span>
      </div>
      <p className="mt-5 text-sm font-bold text-indigo-600">Placement: {placement.level}</p>
      {placement.notes && <p className="mt-1 text-sm text-slate-500">{placement.notes}</p>}
      <p className="mt-4 text-xs text-slate-400">Your tutor can see this result on their dashboard.</p>
      <Link
        href="/portal"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-[6px_6px_16px_rgba(99,102,241,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] transition hover:bg-indigo-600"
      >
        Back to my portal
      </Link>
    </div>
  );
}
