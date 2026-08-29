import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { getLearnerBillingSummary } from '@/services/learner-billing';
import { pctChange, monthBounds, cumulativeByWeek, sumByWeek, type SeriesPoint } from '@/lib/series';

export interface TrendMetric {
  value: number;
  trendPct: number | null;
}

export type { SeriesPoint };

export interface AttendanceBreakdown {
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  avgPct: number;
}

export interface OverviewActivity {
  action: string;
  createdAt: string;
}

export interface DashboardOverview {
  orgName: string;
  totalLearners: TrendMetric;
  activeClasses: TrendMetric;
  attendanceTodayPct: number;
  pendingAssignments: number;
  outstandingMinor: number;
  currency: string;
  attendance: AttendanceBreakdown;
  learnerGrowth: SeriesPoint[];
  revenue: SeriesPoint[];
  usage: { open: number; limit: number | null; planName: string; pct: number };
  activity: OverviewActivity[];
  tasks: {
    gradeAssignments: number;
    reviewSubmissions: number;
    takeAttendance: number;
    upcomingClasses: number;
    unreadMessages: number;
  };
}

async function countIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'learners' | 'classes',
  orgId: string,
  col: string,
  start: string,
  end: string,
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte(col, start)
    .lt(col, end);
  return count ?? 0;
}

/**
 * Aggregate everything the org overview dashboard renders. Every value degrades
 * to 0 / empty on a fresh tenant. Uses the authed client so RLS scopes rows to
 * the active organization.
 */
export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  const orgId = ctx.organizationId;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const thisM = monthBounds(0);
  const lastM = monthBounds(-1);

  const [
    { count: totalLearners },
    { count: activeClasses },
    learnersThis,
    learnersLast,
    classesThis,
    classesLast,
    { data: org },
    billing,
  ] = await Promise.all([
    supabase.from('learners').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active'),
    countIn(supabase, 'learners', orgId, 'created_at', thisM.start, thisM.end),
    countIn(supabase, 'learners', orgId, 'created_at', lastM.start, lastM.end),
    countIn(supabase, 'classes', orgId, 'created_at', thisM.start, thisM.end),
    countIn(supabase, 'classes', orgId, 'created_at', lastM.start, lastM.end),
    supabase.from('organizations').select('name').eq('id', orgId).maybeSingle(),
    getLearnerBillingSummary(orgId),
  ]);

  // Everything below is independent of the batch above — run it all in parallel
  // (one round trip instead of ~9 sequential ones) so the dashboard loads fast.
  const [
    { data: todayRows },
    { data: monthRows },
    { count: pendingAssignments },
    { data: openInvoices },
    { data: enrollDates },
    { data: payRows },
    { data: sub },
    { data: activity },
    { count: unread },
    { count: classesWithAttToday },
  ] = await Promise.all([
    supabase.from('attendance').select('status').eq('organization_id', orgId).eq('session_date', today),
    supabase
      .from('attendance')
      .select('status, session_date')
      .eq('organization_id', orgId)
      .gte('session_date', thisM.start.slice(0, 10)),
    supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['submitted', 'late']),
    supabase
      .from('invoices')
      .select('total_minor')
      .eq('organization_id', orgId)
      .eq('direction', 'tutor')
      .eq('status', 'open'),
    supabase
      .from('learners')
      .select('created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true }),
    supabase
      .from('payments')
      .select('amount_minor, paid_at, created_at')
      .eq('organization_id', orgId)
      .eq('direction', 'tutor')
      .eq('status', 'succeeded')
      .gte('created_at', thisM.start),
    supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('organization_id', orgId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('audit_logs')
      .select('action, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase
      .from('attendance')
      .select('class_id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('session_date', today),
  ]);

  const todayList = todayRows ?? [];
  const todayPresent = todayList.filter((r) => r.status === 'present' || r.status === 'late').length;
  const attendanceTodayPct = todayList.length
    ? Math.round((todayPresent / todayList.length) * 100)
    : 0;

  const breakdown: AttendanceBreakdown = { present: 0, late: 0, absent: 0, excused: 0, total: 0, avgPct: 0 };
  for (const r of monthRows ?? []) {
    breakdown[r.status] += 1;
    breakdown.total += 1;
  }
  breakdown.avgPct = breakdown.total
    ? Math.round(((breakdown.present + breakdown.late) / breakdown.total) * 100)
    : 0;

  const outstandingMinor = (openInvoices ?? []).reduce((s, i) => s + (i.total_minor ?? 0), 0);
  const learnerGrowth = cumulativeByWeek((enrollDates ?? []).map((r) => r.created_at), 5);
  const revenue = sumByWeek(
    (payRows ?? []).map((p) => ({ at: p.paid_at ?? p.created_at, amt: p.amount_minor ?? 0 })),
    5,
    100,
  );

  // Subscription usage — the plan lookup depends on the subscription above.
  let planName = 'Free Trial';
  let limit: number | null = null;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name, included_learners')
      .eq('id', sub.plan_id)
      .maybeSingle();
    planName = plan?.name ?? planName;
    limit = plan?.included_learners ?? null;
  }
  const open = billing.open;
  const usagePct = limit && limit > 0 ? Math.round((open / limit) * 100) : 0;

  const gradeCount = pendingAssignments;
  const takeAttendance = Math.max((activeClasses ?? 0) - (classesWithAttToday ?? 0), 0);

  return {
    orgName: org?.name ?? 'your organization',
    totalLearners: { value: totalLearners ?? 0, trendPct: pctChange(learnersThis, learnersLast) },
    activeClasses: { value: activeClasses ?? 0, trendPct: pctChange(classesThis, classesLast) },
    attendanceTodayPct,
    pendingAssignments: pendingAssignments ?? 0,
    outstandingMinor,
    currency: billing.price.currency,
    attendance: breakdown,
    learnerGrowth,
    revenue,
    usage: { open, limit, planName, pct: usagePct },
    activity: (activity ?? []).map((a) => ({ action: a.action, createdAt: a.created_at })),
    tasks: {
      gradeAssignments: gradeCount ?? 0,
      reviewSubmissions: gradeCount ?? 0,
      takeAttendance,
      upcomingClasses: activeClasses ?? 0,
      unreadMessages: unread ?? 0,
    },
  };
}

