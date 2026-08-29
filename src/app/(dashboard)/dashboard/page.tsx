import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileText,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  CalendarDays,
  ListChecks,
  Activity as ActivityIcon,
  LineChart,
  Download,
  UserPlus,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Receipt,
  UserCircle,
  Sparkles,
} from 'lucide-react';
import { getAuthContext, getProfile } from '@/lib/auth/context';
import { getDashboardOverview } from '@/services/dashboard/overview';
import { getOrgPerformanceTrend } from '@/services/progress';
import { formatMoney } from '@/lib/utils';
import { activityView } from '@/lib/activity';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { AreaTrend } from '@/components/dashboard/area-trend';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { RangePicker } from '@/components/dashboard/range-picker';
import {
  StatTile,
  SectionCard,
  EmptyPanel,
  TaskList,
  ActivityFeed,
  QuickActions,
  TipsList,
  MetricHeadline,
  LegendRow,
} from '@/components/dashboard/widgets';

export const metadata: Metadata = { title: 'Dashboard' };

const ATT_COLORS = {
  present: '#22c55e',
  late: '#f59e0b',
  absent: '#ef4444',
  excused: '#94a3b8',
};

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');

  let overview, trend, profile;
  try {
    [overview, trend, profile] = await Promise.all([
      getDashboardOverview(),
      getOrgPerformanceTrend(),
      getProfile(),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n\n${e.stack ?? ''}` : String(e);
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Dashboard failed to load</h1>
        <pre className="overflow-auto rounded-md bg-destructive/10 p-4 text-xs text-destructive whitespace-pre-wrap">
          {msg}
        </pre>
      </div>
    );
  }
  if (!overview) redirect('/onboarding');

  const firstName = (profile?.full_name ?? 'there').split(' ')[0];
  const money = (minor: number) => formatMoney(minor, overview.currency);
  const hasTrendData = trend.some((t) => t.value !== null);
  const att = overview.attendance;
  const attData = [
    { name: 'Present', value: att.present, color: ATT_COLORS.present },
    { name: 'Late', value: att.late, color: ATT_COLORS.late },
    { name: 'Absent', value: att.absent, color: ATT_COLORS.absent },
    { name: 'Excused', value: att.excused, color: ATT_COLORS.excused },
  ];
  const attPct = (n: number) => (att.total ? Math.round((n / att.total) * 100) : 0);
  const usage = overview.usage;
  const usageData = [
    { name: 'Used', value: usage.open, color: 'hsl(var(--primary))' },
    {
      name: 'Remaining',
      value: Math.max((usage.limit ?? usage.open) - usage.open, 0),
      color: 'hsl(var(--muted))',
    },
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with {overview.orgName} today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker size="md" />
          <button className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile
          icon={Users}
          tone="blue"
          label="Total Learners"
          value={overview.totalLearners.value}
          trendPct={overview.totalLearners.trendPct}
        />
        <StatTile
          icon={GraduationCap}
          tone="green"
          label="Active Classes"
          value={overview.activeClasses.value}
          trendPct={overview.activeClasses.trendPct}
        />
        <StatTile
          icon={CalendarCheck}
          tone="amber"
          label="Attendance Today"
          value={`${overview.attendanceTodayPct}%`}
          trendPct={null}
        />
        <StatTile
          icon={FileText}
          tone="red"
          label="Pending Assignments"
          value={overview.pendingAssignments}
          trendPct={null}
        />
        <StatTile
          icon={Wallet}
          tone="purple"
          label="Outstanding"
          value={money(overview.outstandingMinor)}
          trendPct={null}
        />
      </div>

      {/* Performance + Attendance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Learner Performance"
          icon={TrendingUp}
          action={<RangePicker />}
        >
          {hasTrendData ? (
            <PerformanceChart data={trend} />
          ) : (
            <EmptyPanel
              icon={LineChart}
              title="No performance data yet"
              description="Once you grade assignments and assessments, learner performance trends will appear here."
              ctaLabel="Create Assignment"
              ctaHref="/dashboard/assignments"
            />
          )}
        </SectionCard>

        <SectionCard title="Attendance Overview" icon={PieIcon} action={<RangePicker />}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <DonutChart
              data={attData}
              centerPrimary={`${att.avgPct}%`}
              centerSecondary="Average Attendance"
            />
            <div className="w-full max-w-56 space-y-2.5">
              <LegendRow color={ATT_COLORS.present} label="Present" value={`${att.present} (${attPct(att.present)}%)`} />
              <LegendRow color={ATT_COLORS.late} label="Late" value={`${att.late} (${attPct(att.late)}%)`} />
              <LegendRow color={ATT_COLORS.absent} label="Absent" value={`${att.absent} (${attPct(att.absent)}%)`} />
              <LegendRow color={ATT_COLORS.excused} label="Excused" value={`${att.excused} (${attPct(att.excused)}%)`} />
              <Link
                href="/dashboard/attendance"
                className="mt-2 block text-center text-sm font-medium text-primary hover:underline"
              >
                View Attendance
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Schedule + Tasks + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Upcoming Schedule"
          icon={CalendarDays}
          action={
            <Link href="/dashboard/calendar" className="text-xs font-medium text-primary hover:underline">
              View Calendar
            </Link>
          }
        >
          <EmptyPanel
            icon={CalendarDays}
            title="No upcoming events"
            description="Scheduled classes, assignments or events will appear here."
            ctaLabel="Create Class"
            ctaHref="/dashboard/classes"
          />
        </SectionCard>

        <SectionCard
          title="Task List"
          icon={ListChecks}
          action={
            <Link href="/dashboard/assignments" className="text-xs font-medium text-primary hover:underline">
              View All Tasks
            </Link>
          }
        >
          <TaskList
            items={[
              { label: 'Grade Assignments', count: overview.tasks.gradeAssignments, href: '/dashboard/assignments' },
              { label: 'Review Submissions', count: overview.tasks.reviewSubmissions, href: '/dashboard/assignments' },
              { label: 'Take Attendance', count: overview.tasks.takeAttendance, href: '/dashboard/attendance' },
              { label: 'Upcoming Classes', count: overview.tasks.upcomingClasses, href: '/dashboard/classes' },
              { label: 'Unread Messages', count: overview.tasks.unreadMessages, href: '/dashboard/messages', highlight: true },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          icon={ActivityIcon}
          action={
            <Link href="/dashboard/settings" className="text-xs font-medium text-primary hover:underline">
              View All
            </Link>
          }
        >
          <ActivityFeed
            items={
              overview.activity.length > 0
                ? overview.activity.map((a) => activityView(a.action, a.createdAt))
                : [
                    {
                      icon: Sparkles,
                      tone: 'indigo' as const,
                      title: 'Welcome to Tuvora! 🎉',
                      subtitle: 'Your workspace is ready',
                      time: 'just now',
                    },
                  ]
            }
          />
        </SectionCard>
      </div>

      {/* Growth + Revenue + Subscription */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Learner Growth" icon={TrendingUp} action={<RangePicker />}>
          <MetricHeadline
            value={String(overview.totalLearners.value)}
            label="Total Learners"
            trendPct={overview.totalLearners.trendPct}
          />
          <div className="mt-4">
            <AreaTrend data={overview.learnerGrowth} height={180} />
          </div>
        </SectionCard>

        <SectionCard title="Revenue Overview" icon={LineChart} action={<RangePicker />}>
          <MetricHeadline value={money(overview.revenue.reduce((s, p) => s + p.value, 0) * 100)} label="Total Revenue" trendPct={null} />
          <div className="mt-4">
            <AreaTrend data={overview.revenue} color="#8b5cf6" height={180} />
          </div>
        </SectionCard>

        <SectionCard title="Subscription Usage" icon={PieIcon}>
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              data={usageData}
              centerPrimary={String(usage.open)}
              centerSecondary={`of ${usage.limit ?? '∞'} Learners`}
              size={150}
            />
            <p className="text-sm font-semibold text-primary">{usage.pct}%</p>
            <div className="w-full space-y-2">
              <LegendRow color="hsl(var(--primary))" label="Used" value={String(usage.open)} />
              <LegendRow
                color="hsl(var(--muted))"
                label="Remaining"
                value={String(Math.max((usage.limit ?? usage.open) - usage.open, 0))}
              />
            </div>
            <div className="flex w-full items-center justify-between border-t pt-3 text-xs">
              <span className="text-muted-foreground">
                Current Plan
                <span className="ml-1 font-semibold text-foreground">{usage.planName}</span>
              </span>
              <span className="text-muted-foreground">
                Limit <span className="font-semibold text-foreground">{usage.limit ?? '∞'}</span>
              </span>
            </div>
            <Link
              href="/dashboard/subscription"
              className="block w-full rounded-lg border py-2 text-center text-sm font-medium text-primary hover:bg-accent"
            >
              View Subscription
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Quick actions + Tips */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Quick Actions" icon={ListChecks} className="lg:col-span-2">
          <QuickActions
            actions={[
              { icon: UserPlus, tone: 'blue', title: 'Add Learner', subtitle: 'Register a new learner', href: '/dashboard/learners' },
              { icon: GraduationCap, tone: 'green', title: 'Create Class', subtitle: 'Schedule a new class', href: '/dashboard/classes' },
              { icon: FileText, tone: 'red', title: 'Create Assignment', subtitle: 'Give work to learners', href: '/dashboard/assignments' },
              { icon: ClipboardList, tone: 'purple', title: 'Create Assessment', subtitle: 'Evaluate knowledge', href: '/dashboard/assessments' },
              { icon: CalendarCheck, tone: 'amber', title: 'Take Attendance', subtitle: 'Mark attendance', href: '/dashboard/attendance' },
              { icon: MessageSquare, tone: 'indigo', title: 'Send Message', subtitle: 'Message learners or parents', href: '/dashboard/messages' },
              { icon: BarChart3, tone: 'emerald', title: 'View Reports', subtitle: 'Explore detailed reports', href: '/dashboard/reports' },
              { icon: Receipt, tone: 'slate', title: 'Receive Payment', subtitle: 'Request or record payments', href: '/dashboard/payments' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Tips for Getting Started" icon={Sparkles}>
          <TipsList
            tips={[
              { icon: UserCircle, tone: 'indigo', title: 'Complete your profile', subtitle: 'Add your organization details and logo' },
              { icon: UserPlus, tone: 'blue', title: 'Add your first learner', subtitle: 'Start building your learner community' },
              { icon: GraduationCap, tone: 'green', title: 'Create a class', subtitle: 'Schedule your first class' },
              { icon: Users, tone: 'purple', title: 'Invite your staff', subtitle: 'Collaborate with tutors and assistants' },
            ]}
            footerLabel="View All Guides"
            footerHref="/dashboard/support"
          />
        </SectionCard>
      </div>

      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Tuvora. All rights reserved.</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
