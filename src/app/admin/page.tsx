import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  LineChart,
  ListChecks,
  Activity as ActivityIcon,
  Download,
  Ticket,
  Tag,
  BarChart3,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getProfile } from '@/lib/auth/context';
import {
  getPlatformStats,
  getRevenueTrend,
  getRecentOrganizations,
  getAdminOverview,
  viewerIsSuperAdmin,
} from '@/services/admin';
import { formatMoney, initials } from '@/lib/utils';
import { activityView, relativeTime } from '@/lib/activity';
import { AreaTrend } from '@/components/dashboard/area-trend';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { RangePicker } from '@/components/dashboard/range-picker';
import {
  StatTile,
  SectionCard,
  TaskList,
  ActivityFeed,
  QuickActions,
  TipsList,
  MetricHeadline,
  LegendRow,
} from '@/components/dashboard/widgets';

export const metadata: Metadata = { title: 'Admin · Dashboard' };

const SUB_COLORS = { active: '#22c55e', trialing: '#3b82f6', pastDue: '#f59e0b', churned: '#ef4444' };

export default async function AdminDashboardPage() {
  const [profile, isSuper, stats, revenue, orgs, overview] = await Promise.all([
    getProfile(),
    viewerIsSuperAdmin(),
    getPlatformStats(),
    getRevenueTrend(),
    getRecentOrganizations(5),
    getAdminOverview(),
  ]);

  const firstName = (profile?.full_name ?? 'Admin').split(' ')[0];
  const money = (minor: number) => formatMoney(minor, stats.mrrCurrency);
  const revenueSeries = revenue.map((r) => ({ label: r.label, value: Math.round(r.value / 100) }));
  const totalRevenueMinor = revenue.reduce((s, r) => s + r.value, 0);

  const s = overview.subStatus;
  const churned = s.cancelled + s.expired;
  const subData = [
    { name: 'Active', value: s.active, color: SUB_COLORS.active },
    { name: 'Trialing', value: s.trialing, color: SUB_COLORS.trialing },
    { name: 'Past due', value: s.pastDue, color: SUB_COLORS.pastDue },
    { name: 'Churned', value: churned, color: SUB_COLORS.churned },
  ];
  const activePct = s.total ? Math.round((s.active / s.total) * 100) : 0;

  return (
    <div className="space-y-6 pb-4">
      {/* Header — gradient hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-6 text-white shadow-lg shadow-brand-900/20 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-24 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/70">
              <Sparkles className="h-3.5 w-3.5" /> Platform control centre
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
            <p className="mt-1 text-white/80">Here&apos;s what&apos;s happening across Tuvoria today.</p>
          </div>
          <div className="flex items-center gap-2">
            <RangePicker size="md" />
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20">
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>
        </div>
      </div>

      {!isSuper && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You&apos;re signed in as Platform Support. Some cross-tenant figures are only visible to a
          Super Admin.
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile icon={Building2} tone="blue" label="Total Organizations" value={stats.organizations} trendPct={overview.orgTrendPct} />
        <StatTile icon={Users} tone="green" label="Total Tutors" value={stats.tutors} trendPct={null} />
        <StatTile icon={GraduationCap} tone="amber" label="Total Learners" value={stats.learners} trendPct={overview.learnerTrendPct} />
        <StatTile icon={Wallet} tone="purple" label="MRR" value={money(stats.mrrMinor)} trendPct={null} />
        <StatTile icon={CreditCard} tone="indigo" label="Active Subscriptions" value={stats.activeSubscriptions} trendPct={null} />
      </div>

      {/* Revenue + subscription health */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Revenue Overview" icon={LineChart} action={<RangePicker />}>
          <MetricHeadline value={money(totalRevenueMinor)} label="Last 6 months" trendPct={null} />
          <div className="mt-4">
            <AreaTrend data={revenueSeries} color="#8b5cf6" height={200} />
          </div>
        </SectionCard>

        <SectionCard title="Subscription Health" icon={PieIcon} action={<RangePicker />}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <DonutChart data={subData} centerPrimary={`${activePct}%`} centerSecondary="Active" />
            <div className="w-full max-w-56 space-y-2.5">
              <LegendRow color={SUB_COLORS.active} label="Active" value={String(s.active)} />
              <LegendRow color={SUB_COLORS.trialing} label="Trialing" value={String(s.trialing)} />
              <LegendRow color={SUB_COLORS.pastDue} label="Past due" value={String(s.pastDue)} />
              <LegendRow color={SUB_COLORS.churned} label="Churned" value={String(churned)} />
              <Link href="/admin/subscriptions" className="mt-2 block text-center text-sm font-medium text-primary hover:underline">
                View Subscriptions
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent signups + tasks + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recent Signups"
          icon={Building2}
          action={<Link href="/admin/organizations" className="text-xs font-medium text-primary hover:underline">View All</Link>}
        >
          {orgs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No organizations yet.</p>
          ) : (
            <ul className="space-y-3">
              {orgs.map((o) => (
                <li key={o.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground">
                    {initials(o.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{o.type.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {relativeTime(o.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Platform Tasks"
          icon={ListChecks}
          action={<Link href="/admin/support" className="text-xs font-medium text-primary hover:underline">View All</Link>}
        >
          <TaskList
            items={[
              { label: 'Open support tickets', count: overview.tasks.openTickets, href: '/admin/support', highlight: true },
              { label: 'Past-due subscriptions', count: overview.tasks.pastDueSubs, href: '/admin/subscriptions' },
              { label: 'Pending payments', count: overview.tasks.pendingPayments, href: '/admin/payments' },
              { label: 'Trials in progress', count: overview.tasks.trialing, href: '/admin/subscriptions' },
              { label: 'Organizations', count: overview.tasks.organizations, href: '/admin/organizations' },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          icon={ActivityIcon}
          action={<Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">View All</Link>}
        >
          <ActivityFeed
            items={
              overview.activity.length > 0
                ? overview.activity.map((a) => activityView(a.action, a.createdAt))
                : [{ icon: Sparkles, tone: 'indigo' as const, title: 'Platform is live 🎉', subtitle: 'Awaiting activity', time: 'just now' }]
            }
          />
        </SectionCard>
      </div>

      {/* Growth charts + revenue-by-plan */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Organization Growth" icon={TrendingUp} action={<RangePicker />}>
          <MetricHeadline value={String(stats.organizations)} label="Total Organizations" trendPct={overview.orgTrendPct} />
          <div className="mt-4">
            <AreaTrend data={overview.orgGrowth} height={180} />
          </div>
        </SectionCard>

        <SectionCard title="Learner Growth" icon={TrendingUp} action={<RangePicker />}>
          <MetricHeadline value={String(stats.learners)} label="Total Learners" trendPct={overview.learnerTrendPct} />
          <div className="mt-4">
            <AreaTrend data={overview.learnerGrowth} color="#22c55e" height={180} />
          </div>
        </SectionCard>

        <SectionCard title="Subscription Mix" icon={PieIcon}>
          <div className="flex flex-col items-center gap-4">
            <DonutChart data={subData} centerPrimary={String(s.total)} centerSecondary="Total subs" size={150} />
            <div className="w-full space-y-2">
              <LegendRow color={SUB_COLORS.active} label="Active" value={String(s.active)} />
              <LegendRow color={SUB_COLORS.trialing} label="Trialing" value={String(s.trialing)} />
              <LegendRow color={SUB_COLORS.pastDue} label="Past due" value={String(s.pastDue)} />
            </div>
            <Link href="/admin/churn" className="block w-full rounded-lg border py-2 text-center text-sm font-medium text-primary hover:bg-accent">
              View Churn &amp; Retention
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Quick actions + platform checklist */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Quick Actions" icon={ListChecks} className="lg:col-span-2">
          <QuickActions
            actions={[
              { icon: Building2, tone: 'blue', title: 'Organizations', subtitle: 'Manage tenants', href: '/admin/organizations' },
              { icon: CreditCard, tone: 'indigo', title: 'Plans', subtitle: 'Pricing & tiers', href: '/admin/plans' },
              { icon: Tag, tone: 'purple', title: 'Coupons', subtitle: 'Discounts & promos', href: '/admin/coupons' },
              { icon: ShieldCheck, tone: 'green', title: 'Features', subtitle: 'Entitlement flags', href: '/admin/features' },
              { icon: BarChart3, tone: 'emerald', title: 'Revenue', subtitle: 'Financial analytics', href: '/admin/revenue' },
              { icon: TrendingUp, tone: 'amber', title: 'Churn', subtitle: 'Retention metrics', href: '/admin/churn' },
              { icon: Receipt, tone: 'slate', title: 'Payments', subtitle: 'Transactions', href: '/admin/payments' },
              { icon: Ticket, tone: 'red', title: 'Support', subtitle: 'Tickets & help', href: '/admin/support' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Platform Checklist" icon={Sparkles}>
          <TipsList
            tips={[
              { icon: CreditCard, tone: 'indigo', title: 'Review subscription plans', subtitle: 'Keep pricing tiers current' },
              { icon: Tag, tone: 'purple', title: 'Set up coupons', subtitle: 'Run acquisition promos' },
              { icon: TrendingUp, tone: 'amber', title: 'Monitor churn', subtitle: 'Watch retention weekly' },
              { icon: Settings, tone: 'slate', title: 'System settings', subtitle: 'Configure the platform' },
            ]}
            footerLabel="Open Settings"
            footerHref="/admin/settings"
          />
        </SectionCard>
      </div>

      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Tuvoria. All rights reserved.</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
