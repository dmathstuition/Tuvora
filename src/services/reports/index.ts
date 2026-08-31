'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan } from '@/lib/permissions';
import { getLearnerProfile } from '@/services/progress';

export interface ReportGrade {
  assignment: string;
  className: string | null;
  score: number;
  maxPoints: number | null;
  percentage: number | null;
  date: string | null;
}

export interface LearnerReport {
  orgName: string;
  generatedAt: string;
  learner: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    enrolled_at: string;
  };
  classes: { id: string; name: string }[];
  metrics: {
    avgScore: number | null;
    attendancePct: number | null;
    completionPct: number | null;
    gradedCount: number;
    totalAssigned: number;
  };
  attendance: { present: number; late: number; absent: number; excused: number };
  grades: ReportGrade[];
}

/**
 * Assemble a per-learner progress report. Reuses the computed progress profile
 * for metrics/attendance/classes and adds organization branding and the full
 * graded-assignment list (the profile only carries the 5 most recent).
 */
export async function getLearnerReport(id: string): Promise<LearnerReport | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'reports.view');

  const profile = await getLearnerProfile(id);
  if (!profile) return null;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', ctx.organizationId)
    .maybeSingle();

  // Full graded list with assignment title + class name.
  const { data: subs } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, score, graded_at')
    .eq('organization_id', ctx.organizationId)
    .eq('learner_id', id)
    .in('status', ['graded', 'returned'])
    .not('score', 'is', null)
    .order('graded_at', { ascending: false });

  const subRows = subs ?? [];
  const assignmentIds = [...new Set(subRows.map((s) => s.assignment_id))];
  const meta = new Map<string, { title: string; maxPoints: number | null; classId: string | null }>();
  if (assignmentIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, max_points, class_id')
      .in('id', assignmentIds);
    for (const a of assignments ?? []) {
      meta.set(a.id, { title: a.title, maxPoints: a.max_points, classId: a.class_id });
    }
  }
  const classNameById = new Map(profile.classes.map((c) => [c.id, c.name]));

  const grades: ReportGrade[] = subRows.map((s) => {
    const m = meta.get(s.assignment_id);
    const maxPoints = m?.maxPoints ?? null;
    return {
      assignment: m?.title ?? 'Assignment',
      className: m?.classId ? (classNameById.get(m.classId) ?? null) : null,
      score: s.score as number,
      maxPoints,
      percentage:
        maxPoints && maxPoints > 0 ? Math.round(((s.score as number) / maxPoints) * 100) : null,
      date: s.graded_at,
    };
  });

  return {
    orgName: org?.name ?? 'Tuvoria',
    generatedAt: new Date().toISOString(),
    learner: profile.learner,
    classes: profile.classes,
    metrics: profile.metrics,
    attendance: profile.attendance,
    grades,
  };
}
