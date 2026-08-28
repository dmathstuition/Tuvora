'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { z } from 'zod';

const awardSchema = z.object({
  learnerId: z.string().uuid(),
  kind: z.enum(['reward', 'sanction']),
  points: z.coerce.number().int().min(1).max(500),
  category: z.string().max(40).optional().or(z.literal('')),
  reason: z.string().max(300).optional().or(z.literal('')),
});

export type AwardState = { error?: string; success?: boolean };

/**
 * Award points (reward) or deduct them (sanction) for a learner. Rewards store
 * positive points, sanctions store the negated value, so the leaderboard is a
 * simple sum. Enforces rewards.manage; audit-logged.
 */
export async function awardPointsAction(
  _prev: AwardState,
  formData: FormData,
): Promise<AwardState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'rewards.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot award or deduct points.' };
    throw e;
  }

  const parsed = awardSchema.safeParse({
    learnerId: formData.get('learnerId'),
    kind: formData.get('kind'),
    points: formData.get('points'),
    category: formData.get('category') || '',
    reason: formData.get('reason') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  const supabase = await createClient();
  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('id', parsed.data.learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!learner) return { error: 'Learner not found.' };

  const signed = parsed.data.kind === 'sanction' ? -parsed.data.points : parsed.data.points;

  const { error } = await supabase.from('reward_events').insert({
    organization_id: ctx.organizationId,
    learner_id: parsed.data.learnerId,
    kind: parsed.data.kind,
    points: signed,
    category: parsed.data.category || null,
    reason: parsed.data.reason || null,
    awarded_by: ctx.userId,
  });
  if (error) return { error: 'Could not save. Please try again.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: parsed.data.kind === 'reward' ? 'reward.awarded' : 'sanction.applied',
    resource_type: 'learner',
    resource_id: parsed.data.learnerId,
    metadata: { points: signed, category: parsed.data.category },
  });

  revalidatePath(`/dashboard/learners/${parsed.data.learnerId}`);
  revalidatePath('/dashboard/leaderboard');
  return { success: true };
}

export interface RewardEntry {
  id: string;
  kind: 'reward' | 'sanction';
  points: number;
  category: string | null;
  reason: string | null;
  date: string;
}

export async function getLearnerRewards(
  learnerId: string,
  limit = 10,
): Promise<{ total: number; recent: RewardEntry[] }> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { total: 0, recent: [] };
  const supabase = await createClient();

  const [{ data: total }, { data: recent }] = await Promise.all([
    supabase.rpc('learner_points', { learner: learnerId }),
    supabase
      .from('reward_events')
      .select('id, kind, points, category, reason, created_at')
      .eq('organization_id', ctx.organizationId)
      .eq('learner_id', learnerId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    total: total ?? 0,
    recent: (recent ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      points: r.points,
      category: r.category,
      reason: r.reason,
      date: r.created_at,
    })),
  };
}

export interface LeaderboardRow {
  learnerId: string;
  name: string;
  avatarKey: string | null;
  points: number;
  rank: number;
}

/**
 * The academy leaderboard: learners ranked by total points within the
 * organization. Aggregated in the service from the points ledger (fine for an
 * academy's scale); RLS keeps it tenant-scoped.
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'rewards.view');
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('reward_events')
    .select('learner_id, points')
    .eq('organization_id', ctx.organizationId);

  const totals = new Map<string, number>();
  for (const e of events ?? []) {
    totals.set(e.learner_id, (totals.get(e.learner_id) ?? 0) + e.points);
  }
  if (totals.size === 0) return [];

  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name, avatar_key')
    .in('id', [...totals.keys()]);

  const rows = (learners ?? [])
    .map((l) => ({
      learnerId: l.id,
      name: `${l.first_name} ${l.last_name ?? ''}`.trim(),
      avatarKey: l.avatar_key,
      points: totals.get(l.id) ?? 0,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return rows;
}
