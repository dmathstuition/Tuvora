import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { parseEntitlement, type EntitlementSet } from './engine';
import { FEATURE_SLUGS, type FeatureSlug } from '@/constants/features';

/** Every feature, unlocked — what a live free trial grants. */
const TRIAL_ENTITLEMENTS: EntitlementSet = Object.fromEntries(
  FEATURE_SLUGS.map((slug) => [slug, { kind: 'unlimited' as const }]),
) as EntitlementSet;

/**
 * Loads an organization's live entitlement set from its active subscription's
 * plan. This is the DB-backed bridge to the pure engine in ./engine.
 *
 * Resolution:
 *   subscription (active) → plan → plan_features (+ feature type) → EntitlementSet
 *
 * When no active subscription exists the org has no entitlements (empty set);
 * the UI surfaces an upgrade prompt and data stays read-only — we never delete.
 */
export const getEntitlements = cache(
  async (organizationId: string): Promise<EntitlementSet> => {
    const supabase = await createClient();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status, trial_ends_at')
      .eq('organization_id', organizationId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return {};

    // A live free trial unlocks every feature. Once the 14-day window closes,
    // the trial grants nothing until the org picks a paid plan.
    if (sub.status === 'trialing') {
      const endsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : 0;
      return endsAt && Date.now() < endsAt ? { ...TRIAL_ENTITLEMENTS } : {};
    }

    const { data: rows } = await supabase
      .from('plan_features')
      .select('value, feature:features(slug, type)')
      .eq('plan_id', sub.plan_id);

    const set: EntitlementSet = {};
    for (const row of rows ?? []) {
      const feature = row.feature as unknown as { slug: FeatureSlug; type: 'boolean' | 'numeric' | 'unlimited' } | null;
      if (!feature) continue;
      set[feature.slug] = parseEntitlement(feature.type, row.value);
    }
    return set;
  },
);

export interface TrialStatus {
  state: 'trialing' | 'trial_expired' | 'active' | 'past_due' | 'none';
  trialEndsAt: string | null;
  daysLeft: number;
}

/**
 * The org's billing state for gating and banners. A trial that has run past its
 * 14-day window reads as `trial_expired` even if the row still says 'trialing'
 * (nothing flips it server-side until a plan is chosen).
 */
export const getTrialStatus = cache(async (organizationId: string): Promise<TrialStatus> => {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('organization_id', organizationId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return { state: 'none', trialEndsAt: null, daysLeft: 0 };
  if (sub.status === 'active' || sub.status === 'paused') {
    return { state: 'active', trialEndsAt: null, daysLeft: 0 };
  }
  if (sub.status === 'past_due') return { state: 'past_due', trialEndsAt: null, daysLeft: 0 };

  // trialing
  const end = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : 0;
  if (!end || Date.now() >= end) {
    return { state: 'trial_expired', trialEndsAt: sub.trial_ends_at, daysLeft: 0 };
  }
  const daysLeft = Math.max(1, Math.ceil((end - Date.now()) / 86_400_000));
  return { state: 'trialing', trialEndsAt: sub.trial_ends_at, daysLeft };
});

/** Current active-learner count for an org (delegates to the DB function). */
export async function getActiveLearnerCount(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_active_learner_count', { org: organizationId });
  return data ?? 0;
}

/** The org's learner seat limit (null = unlimited). Delegates to the DB. */
export async function getLearnerLimit(organizationId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_learner_limit', { org: organizationId });
  return data ?? null;
}

/** Whether one more active learner may be added right now (DB-authoritative). */
export async function canAddLearner(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('can_add_learner', { org: organizationId });
  return data ?? false;
}
