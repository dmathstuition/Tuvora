'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AVATARS, THEMES, DEFAULT_AVATAR, DEFAULT_THEME } from '@/constants/gamification';

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

  const prefs = (org?.portal_preferences ?? {}) as { displayName?: string; welcome?: string };

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
