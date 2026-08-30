import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { getMyCertificates } from '@/services/certificates';
import { CERTIFICATE_TYPES } from '@/constants/certificates';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';

export const metadata: Metadata = { title: 'Certificates' };

export default async function PortalCertificates() {
  const [data, certs] = await Promise.all([getPortalShellData(), getMyCertificates()]);
  if (!data.linked || !data.learner) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">My certificates 🎓</h1>

        {certs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-brand-800">No certificates yet</p>
            <p className="text-sm text-slate-400">
              Keep up the great work — your tutor will award certificates here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {certs.map((c) => {
              const meta = CERTIFICATE_TYPES.find((t) => t.value === c.type) ?? CERTIFICATE_TYPES[0];
              return (
                <Link
                  key={c.id}
                  href={`/portal/certificates/${c.id}`}
                  className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-3xl">
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-brand-900">{c.title}</p>
                    <p className="text-xs text-slate-400">
                      {meta.label} · {new Date(c.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-brand-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
