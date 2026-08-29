'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AVATARS, THEMES, DEFAULT_AVATAR, DEFAULT_THEME } from '@/constants/gamification';
import { effectiveEnabledFeatures } from '@/lib/portal/feature-flags';
import { getPlatformFeatureAvailability } from '@/services/portal/features';

export interface PortalData {
  linked: boolean;
  learner?: {
    id: string;
    name: string;
    firstName: string;
    avatarKey: string;
    themeKey: string;
  };
  org?: { displayName: string; welcome: string | null };
  points?: number;
  rank?: number | null;
  classes?: { id: string; name: string }[];
  recent?: { id: string; points: number; reason: string | null; date: string }[];
  leaderboard?: {
    rank: number;
    id: string;
    name: string;
    avatarKey: string;
    points: number;
    isMe: boolean;
  }[];
  grade?: string | null;
  studentId?: string;
  tasksWaiting?: number;
  streakDays?: number;
  progress?: {
    avgScore: number | null;
    assignmentsDone: number;
    assignmentsTotal: number;
    attendancePct: number | null;
  };
  notices?: { id: string; subject: string; date: string }[];
  quests?: { practiceRounds: number; mockExam: number; chestClaimed: boolean };
  enabledFeatures?: string[];
}

/**
 * Resolve the signed-in user's learner record and portal data.
 *
 * Uses the service-role client because a learner acts only on their OWN record,
 * which we bind strictly by user_id — and, on first visit, by matching the
 * learner's email to the signed-in user's email (auto-linking the account the
 * tutor created). No cross-tenant access: every query is filtered to the
 * resolved learner and their organization.
 */
export async function getPortalData(): Promise<PortalData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { linked: false };

  const admin = createAdminClient();

  // 1. Already linked?
  let { data: learner } = await admin
    .from('learners')
    .select('id, organization_id, first_name, last_name, avatar_key, theme_key')
    .eq('user_id', user.id)
    .maybeSingle();

  // 2. Otherwise auto-link by email (a learner the tutor created for this child).
  if (!learner && user.email) {
    const { data: match } = await admin
      .from('learners')
      .select('id, organization_id, first_name, last_name, avatar_key, theme_key')
      .eq('email', user.email)
      .is('user_id', null)
      .limit(1)
      .maybeSingle();
    if (match) {
      await admin.from('learners').update({ user_id: user.id }).eq('id', match.id);
      learner = match;
    }
  }

  if (!learner) return { linked: false };

  const orgId = learner.organization_id;

  const [{ data: org }, { data: events }, { data: memberships }, { data: recent }] =
    await Promise.all([
      admin.from('organizations').select('name, portal_preferences').eq('id', orgId).maybeSingle(),
      admin.from('reward_events').select('learner_id, points').eq('organization_id', orgId),
      admin.from('class_members').select('class_id').eq('learner_id', learner.id),
      admin
        .from('reward_events')
        .select('id, points, reason, created_at')
        .eq('learner_id', learner.id)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

  // Points + academy rank.
  const totals = new Map<string, number>();
  for (const e of events ?? []) totals.set(e.learner_id, (totals.get(e.learner_id) ?? 0) + e.points);
  const myPoints = totals.get(learner.id) ?? 0;
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const rankIdx = ranked.findIndex(([id]) => id === learner.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  const classIds = (memberships ?? []).map((m) => m.class_id);
  const classes: { id: string; name: string }[] = [];
  if (classIds.length > 0) {
    const { data: cls } = await admin.from('classes').select('id, name').in('id', classIds);
    for (const c of cls ?? []) classes.push({ id: c.id, name: c.name });
  }

  // Academy leaderboard — the top point-earners, with the current learner flagged.
  const topIds = ranked.slice(0, 5).map(([id]) => id);
  const leaderboard: NonNullable<PortalData['leaderboard']> = [];
  if (topIds.length > 0) {
    const { data: tops } = await admin
      .from('learners')
      .select('id, first_name, last_name, avatar_key')
      .in('id', topIds);
    const byId = new Map((tops ?? []).map((l) => [l.id, l]));
    topIds.forEach((id, i) => {
      const l = byId.get(id);
      leaderboard.push({
        rank: i + 1,
        id,
        name: l ? `${l.first_name} ${l.last_name ?? ''}`.trim() : 'Learner',
        avatarKey: l?.avatar_key ?? DEFAULT_AVATAR,
        points: totals.get(id) ?? 0,
        isMe: id === learner.id,
      });
    });
  }

  const prefs = (org?.portal_preferences ?? {}) as { displayName?: string; welcome?: string };
  const today = new Date().toISOString().slice(0, 10);

  // Home-app metrics: progress, streak, quests, notices, grade — in parallel.
  const [
    { data: subs },
    { data: attendance },
    { data: myEvents },
    { data: notices },
    { data: intake },
    platformFlags,
  ] = await Promise.all([
    admin
      .from('assignment_submissions')
      .select('assignment_id, score, status')
      .eq('learner_id', learner.id),
    admin.from('attendance').select('status').eq('learner_id', learner.id),
    admin
      .from('reward_events')
      .select('created_at, category')
      .eq('learner_id', learner.id)
      .order('created_at', { ascending: false })
      .limit(80),
    admin
      .from('message_threads')
      .select('id, subject, created_at')
      .eq('organization_id', orgId)
      .in('kind', ['announcement', 'notice'])
      .order('created_at', { ascending: false })
      .limit(3),
    admin.from('learner_intake').select('current_grade').eq('learner_id', learner.id).maybeSingle(),
    getPlatformFeatureAvailability(),
  ]);

  const subRows = subs ?? [];
  const graded = subRows.filter((s) => s.status === 'graded' && s.score != null);
  let avgScore: number | null = null;
  if (graded.length > 0) {
    const { data: assigns } = await admin
      .from('assignments')
      .select('id, max_points')
      .in('id', graded.map((s) => s.assignment_id));
    const maxById = new Map((assigns ?? []).map((a) => [a.id, a.max_points ?? 100]));
    const pcts = graded.map((s) => {
      const mp = maxById.get(s.assignment_id) || 100;
      return Math.round(((s.score as number) / mp) * 100);
    });
    avgScore = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }
  const assignmentsTotal = subRows.length;
  const assignmentsDone = subRows.filter((s) => s.status === 'graded' || s.status === 'returned').length;
  const tasksWaiting = subRows.filter((s) => s.status === 'assigned' || s.status === 'submitted' || s.status === 'late').length;

  const attRows = attendance ?? [];
  const attendancePct = attRows.length
    ? Math.round((attRows.filter((a) => a.status === 'present' || a.status === 'late').length / attRows.length) * 100)
    : null;

  // Streak: consecutive calendar days (ending today) with at least one event.
  const days = new Set((myEvents ?? []).map((e) => new Date(e.created_at).toISOString().slice(0, 10)));
  let streakDays = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streakDays++;
    else if (i > 0) break; // today may legitimately be empty; stop at first prior gap
    else continue;
  }

  // Daily quests + chest, from today's reward events.
  const todaysEvents = (myEvents ?? []).filter((e) => e.created_at.slice(0, 10) === today);
  const quests = {
    practiceRounds: todaysEvents.filter((e) => e.category === 'game').length,
    mockExam: todaysEvents.filter((e) => e.category === 'mock_exam').length,
    chestClaimed: todaysEvents.some((e) => e.category === 'daily_reward'),
  };

  const enabledFeatures = [...effectiveEnabledFeatures(org?.portal_preferences, platformFlags)];
  const studentId = `TVR-${new Date().getFullYear()}-${learner.id.slice(0, 4).toUpperCase()}`;

  return {
    linked: true,
    learner: {
      id: learner.id,
      name: `${learner.first_name} ${learner.last_name ?? ''}`.trim(),
      firstName: learner.first_name,
      avatarKey: learner.avatar_key ?? DEFAULT_AVATAR,
      themeKey: learner.theme_key ?? DEFAULT_THEME,
    },
    org: { displayName: prefs.displayName ?? org?.name ?? 'My Academy', welcome: prefs.welcome ?? null },
    points: myPoints,
    rank,
    classes,
    recent: (recent ?? []).map((r) => ({
      id: r.id,
      points: r.points,
      reason: r.reason,
      date: r.created_at,
    })),
    leaderboard,
    grade: intake?.current_grade ?? null,
    studentId,
    tasksWaiting,
    streakDays,
    progress: { avgScore, assignmentsDone, assignmentsTotal, attendancePct },
    notices: (notices ?? []).map((n) => ({ id: n.id, subject: n.subject ?? 'Notice', date: n.created_at })),
    quests,
    enabledFeatures,
  };
}

/** Resolve + verify the signed-in user's learner id (ownership guard). */
async function requireOwnLearnerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('learners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export type PersonaliseState = { error?: string; success?: boolean };

/** Learner sets their own avatar + theme. */
export async function setPersonalisationAction(
  _prev: PersonaliseState,
  formData: FormData,
): Promise<PersonaliseState> {
  const learnerId = await requireOwnLearnerId();
  if (!learnerId) return { error: 'No linked learner account.' };

  const avatar = String(formData.get('avatar') ?? '');
  const theme = String(formData.get('theme') ?? '');
  const validAvatar = AVATARS.some((a) => a.key === avatar) ? avatar : DEFAULT_AVATAR;
  const validTheme = THEMES.some((t) => t.key === theme) ? theme : DEFAULT_THEME;

  const admin = createAdminClient();
  const { error } = await admin
    .from('learners')
    .update({ avatar_key: validAvatar, theme_key: validTheme })
    .eq('id', learnerId);
  if (error) return { error: 'Could not save your choices.' };

  revalidatePath('/portal');
  return { success: true };
}

export type GameState = { error?: string; earned?: number; total?: number };

/**
 * Record a learner's game result as reward points (category 'game'), so tutors
 * can monitor it and it feeds the leaderboard. Points are capped per submission
 * to prevent gaming the score.
 */
export async function recordGameScoreAction(
  _prev: GameState,
  formData: FormData,
): Promise<GameState> {
  const learnerId = await requireOwnLearnerId();
  if (!learnerId) return { error: 'No linked learner account.' };

  const correct = Math.max(0, Math.min(20, Number(formData.get('correct') ?? 0)));
  if (!Number.isFinite(correct) || correct <= 0) return { error: 'No points earned this round.' };

  const admin = createAdminClient();
  const { data: learner } = await admin
    .from('learners')
    .select('id, organization_id')
    .eq('id', learnerId)
    .maybeSingle();
  if (!learner) return { error: 'No linked learner account.' };

  await admin.from('reward_events').insert({
    organization_id: learner.organization_id,
    learner_id: learnerId,
    kind: 'reward',
    points: correct,
    category: 'game',
    reason: 'Quick Maths challenge',
  });

  const { data: total } = await admin.rpc('learner_points', { learner: learnerId });

  revalidatePath('/portal');
  return { earned: correct, total: total ?? undefined };
}

export type ChestState = { error?: string; earned?: number; alreadyClaimed?: boolean };

/** Claim the once-a-day reward chest (+5 points). Idempotent per calendar day. */
export async function claimDailyRewardAction(): Promise<ChestState> {
  const learnerId = await requireOwnLearnerId();
  if (!learnerId) return { error: 'No linked learner account.' };
  const admin = createAdminClient();

  const { data: learner } = await admin
    .from('learners')
    .select('id, organization_id')
    .eq('id', learnerId)
    .maybeSingle();
  if (!learner) return { error: 'No linked learner account.' };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: existing } = await admin
    .from('reward_events')
    .select('id')
    .eq('learner_id', learnerId)
    .eq('category', 'daily_reward')
    .gte('created_at', startOfDay.toISOString())
    .limit(1)
    .maybeSingle();
  if (existing) return { alreadyClaimed: true };

  await admin.from('reward_events').insert({
    organization_id: learner.organization_id,
    learner_id: learnerId,
    kind: 'reward',
    points: 5,
    category: 'daily_reward',
    reason: 'Daily reward chest',
  });

  revalidatePath('/portal');
  return { earned: 5 };
}
