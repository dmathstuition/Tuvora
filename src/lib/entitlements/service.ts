import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { parseEntitlement, type EntitlementSet } from './engine';
import type { FeatureSlug } from '@/constants/features';

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
      .select('plan_id, status')
      .eq('organization_id', organizationId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return {};

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
