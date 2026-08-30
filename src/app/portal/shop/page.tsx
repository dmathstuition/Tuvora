import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Sparkles, Wallet as WalletIcon } from 'lucide-react';
import { getPortalShellData } from '@/services/portal';
import { getShopForLearner } from '@/services/rewards/shop';
import { avatarFor, themeFor } from '@/constants/gamification';
import { PortalShell } from '@/components/portal/portal-shell';
import { ShopGrid } from './shop-grid';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Rewards shop' };

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  fulfilled: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-600',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default async function PortalShop() {
  const [data, shop] = await Promise.all([getPortalShellData(), getShopForLearner()]);
  if (!data.linked || !data.learner || !shop) redirect('/portal');
  const avatar = avatarFor(data.learner.avatarKey);
  const theme = themeFor(data.learner.themeKey);

  return (
    <PortalShell active="more" studentId={data.studentId} avatarEmoji={avatar.emoji} themeGradient={theme.gradient}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">Rewards shop 🎁</h1>

        {/* Wallet */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-5 text-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
            <WalletIcon className="h-3.5 w-3.5" /> Points to spend
          </p>
          <p className="mt-1 flex items-center gap-2 text-4xl font-extrabold">
            <Sparkles className="h-7 w-7 text-amber-300" /> {shop.wallet.spendable}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {shop.wallet.lifetime} earned · {shop.wallet.reserved} reserved
          </p>
        </section>

        <ShopGrid items={shop.items} wallet={shop.wallet} />

        {/* Redemption history */}
        {shop.redemptions.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-800">My redemptions</h2>
            <ul className="space-y-2">
              {shop.redemptions.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-brand-800">{r.itemName}</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-amber-600">−{r.pointsSpent}</span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold capitalize', STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500')}>
                      {r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
