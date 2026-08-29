import type { Metadata } from 'next';
import Link from 'next/link';
import { getEnrollmentContext } from '@/services/enrollment';
import { IntakeForm } from './intake-form';

export const metadata: Metadata = { title: 'Enrolment form' };

// Claymorphism surfaces — soft, puffy double shadows so cards look moulded from
// clay. Literal classes so Tailwind's scanner generates them.
const clay =
  'rounded-[1.75rem] bg-white shadow-[8px_8px_22px_rgba(99,102,241,0.18),-8px_-8px_22px_rgba(255,255,255,0.95)]';

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await getEnrollmentContext(token);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-indigo-50 to-white">
      {/* Decorative clay blobs */}
      <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-sky-300/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-pink-300/40 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-violet-300/40 blur-2xl" />

      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-6 text-center">
          <span className="text-4xl">🎒</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">
            {ctx.orgName ?? 'Tuvora'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage. Teach. Grow.</p>
        </div>

        {!ctx.valid ? (
          <div className={`${clay} mx-auto max-w-md p-8 text-center`}>
            <div className="text-5xl">{ctx.expired ? '⌛' : '🔒'}</div>
            <h2 className="mt-3 text-lg font-extrabold text-slate-800">
              {ctx.expired ? 'This enrolment link has expired' : 'This enrolment link is not valid'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please ask the academy to send you a fresh link.
            </p>
          </div>
        ) : ctx.alreadySubmitted ? (
          <div className={`${clay} mx-auto max-w-md p-8 text-center`}>
            <div className="text-5xl">✅</div>
            <h2 className="mt-3 text-lg font-extrabold text-slate-800">
              Thank you — we already have your details
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              You&apos;ve completed the enrolment form for {ctx.learnerName}. You can now create the
              learner&apos;s portal account to access classes, progress and rewards.
            </p>
            <Link
              href={`/signup?invite=${ctx.token}`}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-[6px_6px_16px_rgba(99,102,241,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] transition hover:bg-indigo-600"
            >
              Create portal account →
            </Link>
          </div>
        ) : (
          <>
            <div className={`${clay} mb-5 p-6`}>
              <h2 className="text-lg font-extrabold text-slate-800">
                Welcome — let&apos;s get {ctx.learnerName} enrolled
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Please complete this short form so {ctx.orgName} can tailor teaching to your child.
                It takes about 3 minutes. Fields marked with{' '}
                <span className="text-pink-500">*</span> are required.
              </p>
            </div>
            <IntakeForm token={ctx.token} defaultEmail={ctx.email ?? ''} clay={clay} />
          </>
        )}
      </div>
    </div>
  );
}
