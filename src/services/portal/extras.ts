'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { levelFromPoints, tierFor } from '@/constants/gamification';

async function ownLearner(): Promise<{ id: string; organizationId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('learners')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data ? { id: data.id, organizationId: data.organization_id } : null;
}

// --------------------------------------------------------------------------
// Notifications — a merged feed from rewards, certificates, tests and notices.
// --------------------------------------------------------------------------

export interface Notification {
  id: string;
  kind: 'reward' | 'sanction' | 'certificate' | 'test' | 'notice';
  title: string;
  subtitle: string;
  date: string;
}

export async function getMyNotifications(): Promise<Notification[]> {
  const learner = await ownLearner();
  if (!learner) return [];
  const admin = createAdminClient();

  const [{ data: events }, { data: certs }, { data: attempts }, { data: notices }] = await Promise.all([
    admin
      .from('reward_events')
      .select('id, kind, points, reason, created_at')
      .eq('learner_id', learner.id)
      .order('created_at', { ascending: false })
      .limit(15),
    admin
      .from('certificates')
      .select('id, title, issued_at')
      .eq('learner_id', learner.id)
      .is('revoked_at', null)
      .order('issued_at', { ascending: false })
      .limit(5),
    admin
      .from('assessment_attempts')
      .select('id, assessment_id, status, assigned_at')
      .eq('learner_id', learner.id)
      .eq('status', 'assigned')
      .order('assigned_at', { ascending: false })
      .limit(5),
    admin
      .from('message_threads')
      .select('id, subject, created_at')
      .eq('organization_id', learner.organizationId)
      .in('kind', ['announcement', 'notice'])
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const feed: Notification[] = [];
  for (const e of events ?? []) {
    feed.push({
      id: `r-${e.id}`,
      kind: e.kind === 'sanction' ? 'sanction' : 'reward',
      title: e.kind === 'sanction' ? `${e.points} points` : `+${e.points} points`,
      subtitle: e.reason ?? (e.kind === 'sanction' ? 'Sanction' : 'Reward'),
      date: e.created_at,
    });
  }
  for (const c of certs ?? []) {
    feed.push({ id: `c-${c.id}`, kind: 'certificate', title: 'New certificate 🎓', subtitle: c.title, date: c.issued_at });
  }
  const examIds = (attempts ?? []).map((a) => a.assessment_id);
  const titleById = new Map<string, string>();
  if (examIds.length > 0) {
    const { data: as } = await admin.from('assessments').select('id, title').in('id', examIds);
    for (const a of as ?? []) titleById.set(a.id, a.title);
  }
  for (const a of attempts ?? []) {
    feed.push({
      id: `t-${a.id}`,
      kind: 'test',
      title: 'New test assigned 📝',
      subtitle: titleById.get(a.assessment_id) ?? 'A test is waiting for you',
      date: a.assigned_at,
    });
  }
  for (const n of notices ?? []) {
    feed.push({ id: `n-${n.id}`, kind: 'notice', title: 'Notice 🔔', subtitle: n.subject ?? 'Notice', date: n.created_at });
  }

  return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 25);
}

// --------------------------------------------------------------------------
// Calendar — upcoming classes and assigned tasks.
// --------------------------------------------------------------------------

export interface CalendarItem {
  id: string;
  kind: 'class' | 'task';
  title: string;
  date: string | null;
  note: string;
}

export async function getMyCalendar(): Promise<CalendarItem[]> {
  const learner = await ownLearner();
  if (!learner) return [];
  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from('class_members')
    .select('class_id')
    .eq('learner_id', learner.id);
  const classIds = (memberships ?? []).map((m) => m.class_id);

  const [classesRes, attemptsRes] = await Promise.all([
    classIds.length
      ? admin.from('classes').select('id, name, start_date').in('id', classIds)
      : Promise.resolve({ data: [] as { id: string; name: string; start_date: string | null }[] }),
    admin
      .from('assessment_attempts')
      .select('id, assessment_id, status')
      .eq('learner_id', learner.id)
      .in('status', ['assigned', 'in_progress']),
  ]);

  const items: CalendarItem[] = [];
  for (const c of classesRes.data ?? []) {
    items.push({ id: `class-${c.id}`, kind: 'class', title: c.name, date: c.start_date, note: 'Class' });
  }
  const aIds = (attemptsRes.data ?? []).map((a) => a.assessment_id);
  const titleById = new Map<string, string>();
  if (aIds.length > 0) {
    const { data: as } = await admin.from('assessments').select('id, title').in('id', aIds);
    for (const a of as ?? []) titleById.set(a.id, a.title);
  }
  for (const a of attemptsRes.data ?? []) {
    items.push({
      id: `task-${a.id}`,
      kind: 'task',
      title: titleById.get(a.assessment_id) ?? 'Assigned test',
      date: null,
      note: 'To do',
    });
  }
  // Dated items first (soonest), then undated tasks.
  return items.sort((a, b) => {
    if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

// --------------------------------------------------------------------------
// My payments — per-learner billing status + payment history.
// --------------------------------------------------------------------------

export interface PaymentRow {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  date: string;
}

export interface MyPayments {
  status: string;
  isTrial: boolean;
  periodEnd: string | null;
  payments: PaymentRow[];
}

export async function getMyPayments(): Promise<MyPayments | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();

  const [{ data: billing }, { data: pays }] = await Promise.all([
    admin
      .from('learner_billing')
      .select('status, is_trial, current_period_end')
      .eq('learner_id', learner.id)
      .maybeSingle(),
    admin
      .from('payments')
      .select('id, amount_minor, currency, status, paid_at, created_at')
      .eq('payer_learner_id', learner.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  return {
    status: billing?.status ?? 'none',
    isTrial: billing?.is_trial ?? false,
    periodEnd: billing?.current_period_end ?? null,
    payments: (pays ?? []).map((p) => ({
      id: p.id,
      amountMinor: p.amount_minor,
      currency: p.currency,
      status: p.status,
      date: p.paid_at ?? p.created_at,
    })),
  };
}

// --------------------------------------------------------------------------
// My behaviour — rewards vs sanctions breakdown.
// --------------------------------------------------------------------------

export interface BehaviourEvent {
  id: string;
  kind: 'reward' | 'sanction';
  points: number;
  category: string | null;
  reason: string | null;
  date: string;
}

export interface Behaviour {
  rewardPoints: number;
  sanctionPoints: number;
  net: number;
  positivityPct: number;
  byCategory: { category: string; points: number; kind: 'reward' | 'sanction' }[];
  recent: BehaviourEvent[];
}

export async function getMyBehaviour(): Promise<Behaviour | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();
  const { data: events } = await admin
    .from('reward_events')
    .select('id, kind, points, category, reason, created_at')
    .eq('learner_id', learner.id)
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = events ?? [];

  let rewardPoints = 0;
  let sanctionPoints = 0;
  const cat = new Map<string, { points: number; kind: 'reward' | 'sanction' }>();
  for (const e of rows) {
    if (e.kind === 'sanction') sanctionPoints += Math.abs(e.points);
    else rewardPoints += e.points;
    const key = e.category ?? (e.kind === 'sanction' ? 'other' : 'other');
    const prev = cat.get(key)?.points ?? 0;
    cat.set(key, { points: prev + Math.abs(e.points), kind: e.kind });
  }
  const total = rewardPoints + sanctionPoints;

  return {
    rewardPoints,
    sanctionPoints,
    net: rewardPoints - sanctionPoints,
    positivityPct: total ? Math.round((rewardPoints / total) * 100) : 100,
    byCategory: [...cat.entries()]
      .map(([category, v]) => ({ category, points: v.points, kind: v.kind }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8),
    recent: rows.slice(0, 15).map((e) => ({
      id: e.id,
      kind: e.kind,
      points: e.points,
      category: e.category,
      reason: e.reason,
      date: e.created_at,
    })),
  };
}

// --------------------------------------------------------------------------
// Report card — a printable summary for the learner.
// --------------------------------------------------------------------------

export interface ReportCard {
  learnerName: string;
  orgName: string;
  grade: string | null;
  generatedAt: string;
  avgScore: number | null;
  attendancePct: number | null;
  attendance: { present: number; late: number; absent: number; excused: number };
  assignmentsDone: number;
  assignmentsTotal: number;
  points: number;
  level: number;
  tier: string;
  recentGrades: { assignment: string; score: number | null; max: number | null }[];
}

export async function getMyReportCard(): Promise<ReportCard | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();

  const [
    { data: l },
    { data: org },
    { data: intake },
    { data: subs },
    { data: attendance },
    { data: events },
  ] = await Promise.all([
    admin.from('learners').select('first_name, last_name').eq('id', learner.id).maybeSingle(),
    admin.from('organizations').select('name, portal_preferences').eq('id', learner.organizationId).maybeSingle(),
    admin.from('learner_intake').select('current_grade').eq('learner_id', learner.id).maybeSingle(),
    admin
      .from('assignment_submissions')
      .select('assignment_id, score, status')
      .eq('learner_id', learner.id),
    admin.from('attendance').select('status').eq('learner_id', learner.id),
    admin.from('reward_events').select('points').eq('learner_id', learner.id),
  ]);

  const subRows = subs ?? [];
  const graded = subRows.filter((s) => s.status === 'graded' && s.score != null);
  let avgScore: number | null = null;
  const recentGrades: ReportCard['recentGrades'] = [];
  if (graded.length > 0) {
    const { data: assigns } = await admin
      .from('assignments')
      .select('id, title, max_points')
      .in('id', graded.map((s) => s.assignment_id));
    const byId = new Map((assigns ?? []).map((a) => [a.id, a]));
    const pcts = graded.map((s) => {
      const mp = byId.get(s.assignment_id)?.max_points ?? 100;
      return Math.round(((s.score as number) / (mp || 100)) * 100);
    });
    avgScore = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    for (const s of graded.slice(0, 8)) {
      recentGrades.push({
        assignment: byId.get(s.assignment_id)?.title ?? 'Assignment',
        score: s.score,
        max: byId.get(s.assignment_id)?.max_points ?? null,
      });
    }
  }

  const att = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const a of attendance ?? []) att[a.status] += 1;
  const attTotal = att.present + att.late + att.absent + att.excused;
  const attendancePct = attTotal ? Math.round(((att.present + att.late) / attTotal) * 100) : null;

  const points = (events ?? []).reduce((s, e) => s + e.points, 0);
  const prefs = (org?.portal_preferences ?? {}) as { displayName?: string };

  return {
    learnerName: l ? `${l.first_name} ${l.last_name ?? ''}`.trim() : 'Learner',
    orgName: prefs.displayName ?? org?.name ?? 'Academy',
    grade: intake?.current_grade ?? null,
    generatedAt: new Date().toISOString(),
    avgScore,
    attendancePct,
    attendance: att,
    assignmentsDone: subRows.filter((s) => s.status === 'graded' || s.status === 'returned').length,
    assignmentsTotal: subRows.length,
    points,
    level: levelFromPoints(points).level,
    tier: tierFor(points).label,
    recentGrades,
  };
}
