import { LogoMark } from '@/components/brand/logo';
import { CERTIFICATE_TYPES } from '@/constants/certificates';
import { type Certificate } from '@/services/certificates';

/**
 * A print-ready certificate. Designed on Tuvoria branding with a decorative
 * border and a gold seal; the containing page's print CSS strips all chrome so
 * "Save as PDF" yields a clean, shareable award.
 */
export function CertificateCard({ cert }: { cert: Certificate }) {
  const meta = CERTIFICATE_TYPES.find((t) => t.value === cert.type) ?? CERTIFICATE_TYPES[0];
  const issued = new Date(cert.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-3xl bg-white p-1.5 shadow-xl print:shadow-none">
      {/* Gradient frame */}
      <div className="h-full w-full rounded-[1.35rem] bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-[3px]">
        <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[1.2rem] bg-white px-8 py-10 text-center">
          {/* Corner flourishes */}
          <div className="pointer-events-none absolute left-4 top-4 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-amber-400" />
          <div className="pointer-events-none absolute right-4 top-4 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-amber-400" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-amber-400" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-amber-400" />

          <div className="flex items-center gap-2">
            <LogoMark className="h-9 w-9" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-brand-900">
              {cert.orgName}
            </span>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
            Certificate of {meta.label}
          </p>
          <div className="my-3 text-5xl">{meta.emoji}</div>

          <p className="text-sm text-slate-500">This certificate is proudly presented to</p>
          <h1 className="mt-1 bg-gradient-to-r from-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold text-transparent">
            {cert.learnerName}
          </h1>

          <p className="mt-4 max-w-lg text-lg font-bold text-slate-800">{cert.title}</p>
          {cert.description && (
            <p className="mt-1 max-w-lg text-sm text-slate-500">{cert.description}</p>
          )}

          <div className="mt-8 flex w-full max-w-lg items-end justify-between text-left">
            <div>
              <p className="text-sm font-semibold text-slate-700">{issued}</p>
              <p className="border-t border-slate-300 pt-1 text-xs uppercase tracking-wide text-slate-400">
                Date issued
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-2xl text-white shadow-lg">
              ★
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-slate-500">{cert.serial}</p>
              <p className="border-t border-slate-300 pt-1 text-xs uppercase tracking-wide text-slate-400">
                Verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
