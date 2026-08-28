import type { Metadata } from 'next';
import { TrendingUp, DollarSign, Users, Repeat } from 'lucide-react';
import { getRevenueMetrics } from '@/services/admin';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Revenue' };

function moneyList(items: { currency: string; minor: number }[], fallback = '—'): string {
  if (items.length === 0) return fallback;
  return items.map((m) => formatMoney(m.minor, m.currency)).join(' · ');
}

export default async function AdminRevenuePage() {
  const m = await getRevenueMetrics();
  const primaryCurrency = m.mrrByCurrency[0]?.currency ?? 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          MRR, ARR and ARPU across the platform. Figures are grouped by currency (no FX conversion).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={moneyList(m.mrrByCurrency)} icon={TrendingUp} />
        <StatCard label="ARR" value={moneyList(m.arrByCurrency)} icon={DollarSign} />
        <StatCard
          label="ARPU"
          value={m.payingSubscribers ? formatMoney(m.arpuMinor, m.arpuCurrency) : '—'}
          hint="per paying org"
          icon={Repeat}
        />
        <StatCard label="Paying subscribers" value={m.payingSubscribers} icon={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue overview</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={m.trend} currency={primaryCurrency} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR by plan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {m.byPlan.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState title="No active revenue yet" description="MRR by plan appears here as organizations subscribe." />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Subscribers</th>
                    <th className="px-4 py-3 text-right font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {m.byPlan.map((p) => (
                    <tr key={p.name + p.currency} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.subscribers}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMoney(p.mrrMinor, p.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total collected (all time)</CardTitle>
          </CardHeader>
          <CardContent>
            {m.collectedByCurrency.length === 0 ? (
              <p className="text-sm text-muted-foreground">No successful payments recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {m.collectedByCurrency.map((c) => (
                  <li key={c.currency} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{c.currency}</span>
                    <span className="text-lg font-bold">{formatMoney(c.minor, c.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
