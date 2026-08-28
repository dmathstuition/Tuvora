import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, GraduationCap, CreditCard, Wallet } from 'lucide-react';
import { getProfile } from '@/lib/auth/context';
import {
  getPlatformStats,
  getRevenueTrend,
  getPlanDistribution,
  getRecentOrganizations,
  getRecentPayments,
  viewerIsSuperAdmin,
} from '@/services/admin';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { PlanDonut } from '@/components/admin/plan-donut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, initials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = { title: 'Admin · Dashboard' };

export default async function AdminDashboardPage() {
  const [profile, isSuper, stats, revenue, distribution, orgs, payments] = await Promise.all([
    getProfile(),
    viewerIsSuperAdmin(),
    getPlatformStats(),
    getRevenueTrend(),
    getPlanDistribution(),
    getRecentOrganizations(),
    getRecentPayments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {profile?.full_name ?? 'Admin'}! Here&apos;s what&apos;s happening on Tuvora.
        </p>
      </div>

      {!isSuper && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You&apos;re signed in as Platform Support. Some cross-tenant figures are only visible to a
          Super Admin.
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Organizations" value={stats.organizations} icon={Building2} />
        <StatCard label="Total Tutors" value={stats.tutors} icon={Users} />
        <StatCard label="Total Learners" value={stats.learners} icon={GraduationCap} />
        <StatCard
          label="MRR"
          value={formatMoney(stats.mrrMinor, stats.mrrCurrency)}
          icon={Wallet}
        />
        <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} />
      </div>

      {/* Revenue + distribution + signups */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} currency={stats.mrrCurrency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription plan distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanDonut data={distribution} />
          </CardContent>
        </Card>
      </div>

      {/* Recent signups + transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent signups</CardTitle>
            <Link href="/admin/organizations" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {orgs.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No organizations yet.</p>
            ) : (
              <ul className="divide-y">
                {orgs.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(o.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary">{o.type.replace(/_/g, ' ')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <Link href="/admin/payments" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(p.orgName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.orgName}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {p.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatMoney(p.amountMinor, p.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
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
