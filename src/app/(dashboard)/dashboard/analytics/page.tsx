import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Users, GraduationCap, CalendarCheck, Wallet, TrendingUp, PieChart as PieIcon, LineChart } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { getDashboardOverview } from '@/services/dashboard/overview';
import { formatMoney } from '@/lib/utils';
import { AreaTrend } from '@/components/dashboard/area-trend';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { StatTile, SectionCard, MetricHeadline, LegendRow } from '@/components/dashboard/widgets';

export const metadata: Metadata = { title: 'Analytics' };

const ATT = { present: '#22c55e', late: '#f59e0b', absent: '#ef4444', excused: '#94a3b8' };

export default async function AnalyticsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const overview = await getDashboardOverview();
  if (!overview) redirect('/onboarding');

  const money = (m: number) => formatMoney(m, overview.currency);
  const att = overview.attendance;
  const attData = [
    { name: 'Present', value: att.present, color: ATT.present },
    { name: 'Late', value: att.late, color: ATT.late },
    { name: 'Absent', value: att.absent, color: ATT.absent },
    { name: 'Excused', value: att.excused, color: ATT.excused },
  ];

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Trends and insights across {overview.orgName}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} tone="blue" label="Total Learners" value={overview.totalLearners.value} trendPct={overview.totalLearners.trendPct} />
        <StatTile icon={GraduationCap} tone="green" label="Active Classes" value={overview.activeClasses.value} trendPct={overview.activeClasses.trendPct} />
        <StatTile icon={CalendarCheck} tone="amber" label="Avg Attendance" value={`${att.avgPct}%`} trendPct={null} />
        <StatTile icon={Wallet} tone="purple" label="Outstanding" value={money(overview.outstandingMinor)} trendPct={null} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Learner Growth" icon={TrendingUp}>
          <MetricHeadline value={String(overview.totalLearners.value)} label="Total Learners" trendPct={overview.totalLearners.trendPct} />
          <div className="mt-4">
            <AreaTrend data={overview.learnerGrowth} height={200} />
          </div>
        </SectionCard>
        <SectionCard title="Revenue" icon={LineChart}>
          <MetricHeadline value={money(overview.revenue.reduce((s, p) => s + p.value, 0) * 100)} label="Recent revenue" trendPct={null} />
          <div className="mt-4">
            <AreaTrend data={overview.revenue} color="#8b5cf6" height={200} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Attendance Breakdown" icon={PieIcon} className="lg:max-w-md">
        <div className="flex items-center justify-between gap-6">
          <DonutChart data={attData} centerPrimary={`${att.avgPct}%`} centerSecondary="Average" />
          <div className="flex-1 space-y-2">
            <LegendRow color={ATT.present} label="Present" value={String(att.present)} />
            <LegendRow color={ATT.late} label="Late" value={String(att.late)} />
            <LegendRow color={ATT.absent} label="Absent" value={String(att.absent)} />
            <LegendRow color={ATT.excused} label="Excused" value={String(att.excused)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
