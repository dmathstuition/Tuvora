'use server';

import { startOfWeek, subWeeks, format, isAfter } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan } from '@/lib/permissions';

export interface TrendPoint {
  /** Short human label for the week bucket, e.g. "4 Aug". */
  label: string;
  /** Average assignment score % for the bucket, or null when no data. */
  value: number | null;
  /** Number of graded submissions in the bucket. */
  count: number;
}

interface GradedRow {
  score: number;
  maxPoints: number | null;
  gradedAt: string | null;
}

/** Percentage for a graded submission, or null when it can't be computed. */
function toPercentage(score: number, maxPoints: number | null): number | null {
  if (maxPoints && maxPoints > 0) return (score / maxPoints) * 100;
  return null;
}

/** Bucket graded rows into the last `weeks` weekly buckets (Monday-aligned). */
function bucketWeekly(rows: GradedRow[], weeks: number): TrendPoint[] {
  const now = new Date();
  const buckets: { start: Date; label: string; sum: number; n: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    buckets.push({ start, label: format(start, 'd MMM'), sum: 0, n: 0 });
  }

  for (const r of rows) {
    if (!r.gradedAt) continue;
    const pct = toPercentage(r.score, r.maxPoints);
    if (pct === null) continue;
    const when = new Date(r.gradedAt);
    // Find the last bucket whose start is on/before `when`.
    let target = -1;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (b && !isAfter(b.start, when)) target = i;
    }
    if (target >= 0) {
      const b = buckets[target];
      if (b) {
        b.sum += pct;
        b.n += 1;
      }
    }
  }

  return buckets.map((b) => ({
    label: b.label,
    value: b.n > 0 ? Math.round(b.sum / b.n) : null,
    count: b.n,
  }));
}

/** Load graded submissions (with their assignment max points) since a date. */
async function loadGraded(
  organizationId: string,
  since: Date,
  learnerId?: string,
): Promise<GradedRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('assignment_submissions')
    .select('score, graded_at, assignment_id')
    .eq('organization_id', organizationId)
    .in('status', ['graded', 'returned'])
    .not('score', 'is', null)
    .gte('graded_at', since.toISOString());
  if (learnerId) query = query.eq('learner_id', learnerId);

  const { data: subs } = await query;
  const rows = subs ?? [];
  if (rows.length === 0) return [];

  const assignmentIds = [...new Set(rows.map((s) => s.assignment_id))];
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, max_points')
    .in('id', assignmentIds);
  const maxById = new Map<string, number | null>();
  for (const a of assignments ?? []) maxById.set(a.id, a.max_points);

  return rows.map((s) => ({
    score: s.score as number,
    maxPoints: maxById.get(s.assignment_id) ?? null,
    gradedAt: s.graded_at,
  }));
}

/** Org-wide weekly assignment-score trend for the dashboard chart. */
export async function getOrgPerformanceTrend(weeks = 8): Promise<TrendPoint[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const since = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 });
  const rows = await loadGraded(ctx.organizationId, since);
  return bucketWeekly(rows, weeks);
}

// ---------------------------------------------------------------------------
// Per-learner profile
// ---------------------------------------------------------------------------

export interface LearnerMetrics {
  avgScore: number | null;
  attendancePct: number | null;
  completionPct: number | null;
  gradedCount: number;
  totalAssigned: number;
}

export interface RecentGrade {
  assignment: string;
  score: number;
  maxPoints: number | null;
  percentage: number | null;
  date: string | null;
}

export interface LearnerProfile {
  learner: {
    id: string;
    name: string;
    email: string | null;
    status: 'active' | 'inactive' | 'archived';
    enrolled_at: string;
  };
  classes: { id: string; name: string }[];
  metrics: LearnerMetrics;
  recentGrades: RecentGrade[];
  attendance: { present: number; late: number; absent: number; excused: number };
  scoreTrend: TrendPoint[];
}

export async function getLearnerProfile(id: string): Promise<LearnerProfile | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'learners.view');
  const supabase = await createClient();

  const { data: learner } = await supabase
    .from('learners')
    .select('id, first_name, last_name, email, status, enrolled_at')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!learner) return null;

  // Classes the learner is enrolled in.
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id')
    .eq('organization_id', ctx.organizationId)
    .eq('learner_id', id);
  const classIds = (memberships ?? []).map((m) => m.class_id);
  const classes: { id: string; name: string }[] = [];
  if (classIds.length > 0) {
    const { data: cls } = await supabase.from('classes').select('id, name').in('id', classIds);
    for (const c of cls ?? []) classes.push({ id: c.id, name: c.name });
  }

  // Submissions → completion + average + recent grades.
  const { data: subs } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, status, score, graded_at')
    .eq('organization_id', ctx.organizationId)
    .eq('learner_id', id);
  const subRows = subs ?? [];

  const assignmentIds = [...new Set(subRows.map((s) => s.assignment_id))];
  const assignmentMeta = new Map<string, { title: string; maxPoints: number | null }>();
  if (assignmentIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, max_points')
      .in('id', assignmentIds);
    for (const a of assignments ?? []) {
      assignmentMeta.set(a.id, { title: a.title, maxPoints: a.max_points });
    }
  }

  const totalAssigned = subRows.length;
  const completed = subRows.filter((s) =>
    ['submitted', 'graded', 'returned'].includes(s.status),
  ).length;
  const gradedSubs = subRows.filter(
    (s) => (s.status === 'graded' || s.status === 'returned') && s.score != null,
  );

  const pcts: number[] = [];
  for (const s of gradedSubs) {
    const pct = toPercentage(s.score as number, assignmentMeta.get(s.assignment_id)?.maxPoints ?? null);
    if (pct !== null) pcts.push(pct);
  }
  const avgScore =
    pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;

  const recentGrades: RecentGrade[] = gradedSubs
    .slice()
    .sort((a, b) => (b.graded_at ?? '').localeCompare(a.graded_at ?? ''))
    .slice(0, 5)
    .map((s) => {
      const meta = assignmentMeta.get(s.assignment_id);
      return {
        assignment: meta?.title ?? 'Assignment',
        score: s.score as number,
        maxPoints: meta?.maxPoints ?? null,
        percentage:
          meta?.maxPoints && meta.maxPoints > 0
            ? Math.round(((s.score as number) / meta.maxPoints) * 100)
            : null,
        date: s.graded_at,
      };
    });

  // Attendance breakdown + rate.
  const { data: att } = await supabase
    .from('attendance')
    .select('status')
    .eq('organization_id', ctx.organizationId)
    .eq('learner_id', id);
  const attendance = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const a of att ?? []) attendance[a.status] += 1;
  const attDenom = attendance.present + attendance.late + attendance.absent;
  const attendancePct =
    attDenom > 0 ? Math.round(((attendance.present + attendance.late) / attDenom) * 100) : null;

  // Per-learner weekly score trend.
  const since = startOfWeek(subWeeks(new Date(), 7), { weekStartsOn: 1 });
  const gradedForTrend = await loadGraded(ctx.organizationId, since, id);
  const scoreTrend = bucketWeekly(gradedForTrend, 8);

  return {
    learner: {
      id: learner.id,
      name: `${learner.first_name} ${learner.last_name ?? ''}`.trim(),
      email: learner.email,
      status: learner.status,
      enrolled_at: learner.enrolled_at,
    },
    classes,
    metrics: {
      avgScore,
      attendancePct,
      completionPct: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : null,
      gradedCount: gradedSubs.length,
      totalAssigned,
    },
    recentGrades,
    attendance,
    scoreTrend,
  };
}
