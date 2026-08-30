import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPortalShellData } from '@/services/portal';
import { getClassByCode } from '@/services/portal/join';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { JoinClassButton } from '@/components/portal/join-class';

export const metadata: Metadata = { title: 'Join class' };

export default async function JoinClassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [data, preview] = await Promise.all([getPortalShellData(), getClassByCode(code)]);
  if (!data.linked || !data.learner) redirect(`/login?redirect=/portal/join/${code}`);
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="learn" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="mx-auto max-w-sm py-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          {!preview.valid ? (
            <div className="text-center">
              <div className="text-5xl">🤔</div>
              <p className="mt-3 font-extrabold text-brand-900">That class code isn&apos;t valid</p>
              <p className="mt-1 text-sm text-slate-500">
                Check the link or code your tutor shared and try again.
              </p>
              <Link href="/portal/learn" className="mt-4 inline-flex text-sm font-bold text-brand-600">
                Back to Learn
              </Link>
            </div>
          ) : preview.alreadyIn ? (
            <div className="text-center">
              <div className="text-5xl">✅</div>
              <p className="mt-3 font-extrabold text-brand-900">
                You&apos;re already in {preview.className}
              </p>
              <Link
                href="/portal/learn"
                className="mt-4 inline-flex rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                Go to my classes
              </Link>
            </div>
          ) : (
            <JoinClassButton code={code.trim().toUpperCase()} className={preview.className ?? 'this class'} />
          )}
        </div>
      </div>
    </PortalShell>
  );
}
