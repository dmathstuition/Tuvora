import { Lock } from 'lucide-react';
import { logoutAction } from '@/app/(auth)/actions';
import { LogoMark } from '@/components/brand/logo';

/**
 * Shown to a learner whose access is paused — the academy's free trial has ended
 * and this learner's month hasn't been paid. They can't use the portal until the
 * academy renews their subscription.
 */
export function PortalLocked({ academyName }: { academyName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-fuchsia-50/40 to-amber-50/40 px-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-brand-900">Access paused</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your free access with <span className="font-semibold text-brand-800">{academyName}</span> has
          ended. Ask {academyName} to renew your subscription — once your month is paid, your portal
          opens again right away.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <LogoMark className="h-5 w-5" />
          <span className="font-semibold tracking-widest">TUVORA</span>
        </div>

        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-full border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
