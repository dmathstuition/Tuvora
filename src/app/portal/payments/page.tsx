import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Wallet, Receipt } from 'lucide-react';
import { getPortalData } from '@/services/portal';
import { getMyPayments } from '@/services/portal/extras';
import { avatarFor, themeFor } from '@/constants/gamification';
import { formatMoney } from '@/lib/utils';
import { PortalShell } from '@/components/portal/portal-shell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'My payments' };

const STATUS: Record<string, string> = {
  trialing: 'bg-sky-100 text-sky-700',
  active: 'bg-emerald-100 text-emerald-700',
  past_due: 'bg-amber-100 text-amber-700',
  expired: 'bg-rose-100 text-rose-600',
  none: 'bg-slate-100 text-slate-500',
};
const PAY_STATUS: Record<string, string> = {
  succeeded: 'text-emerald-600',
  pending: 'text-amber-600',
  failed: 'text-rose-600',
  refunded: 'text-slate-500',
};

export default async function PortalPayments() {
  const [data, pay] = await Promise.all([getPortalData(), getMyPayments()]);
  if (!data.linked || !data.learner || !pay) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold text-brand-900">My payments 💳</h1>

        <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/70">
            <Wallet className="h-3.5 w-3.5" /> Account status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-sm font-bold capitalize', STATUS[pay.status] ?? STATUS.none)}>
              {pay.isTrial ? 'Free trial' : pay.status.replace('_', ' ')}
            </span>
          </div>
          {pay.periodEnd && (
            <p className="mt-2 text-sm text-white/80">
              {pay.status === 'active' ? 'Paid until' : 'Access until'}{' '}
              {new Date(pay.periodEnd).toLocaleDateString()}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Receipt className="h-5 w-5 text-brand-600" /> Payment history
          </h2>
          {pay.payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              No payments yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {pay.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-brand-900">{formatMoney(p.amountMinor, p.currency)}</p>
                    <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()}</p>
                  </div>
                  <span className={cn('text-sm font-bold capitalize', PAY_STATUS[p.status] ?? 'text-slate-500')}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
