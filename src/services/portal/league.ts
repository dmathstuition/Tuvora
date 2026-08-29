'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_AVATAR, tierFor } from '@/constants/gamification';

export interface LeagueRow {
  rank: number;
  id: string;
  name: string;
  avatarKey: string;
  points: number;
  tier: string;
  isMe: boolean;
}

export interface League {
  rows: LeagueRow[];
  myRank: number | null;
  myPoints: number;
}

/** The full academy league table (top 20), with the current learner flagged. */
export async function getLeague(): Promise<League | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();

  const { data: me } = await admin
    .from('learners')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!me) return null;

  const { data: events } = await admin
    .from('reward_events')
    .select('learner_id, points')
    .eq('organization_id', me.organization_id);

  const totals = new Map<string, number>();
  for (const e of events ?? []) totals.set(e.learner_id, (totals.get(e.learner_id) ?? 0) + e.points);
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const myRankIdx = ranked.findIndex(([id]) => id === me.id);

  const topIds = ranked.slice(0, 20).map(([id]) => id);
  const rows: LeagueRow[] = [];
  if (topIds.length > 0) {
    const { data: learners } = await admin
      .from('learners')
      .select('id, first_name, last_name, avatar_key')
      .in('id', topIds);
    const byId = new Map((learners ?? []).map((l) => [l.id, l]));
    topIds.forEach((id, i) => {
      const l = byId.get(id);
      const points = totals.get(id) ?? 0;
      rows.push({
        rank: i + 1,
        id,
        name: l ? `${l.first_name} ${l.last_name ?? ''}`.trim() : 'Learner',
        avatarKey: l?.avatar_key ?? DEFAULT_AVATAR,
        points,
        tier: tierFor(points).label,
        isMe: id === me.id,
      });
    });
  }

  return {
    rows,
    myRank: myRankIdx >= 0 ? myRankIdx + 1 : null,
    myPoints: totals.get(me.id) ?? 0,
  };
}
