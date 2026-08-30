import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { parseEntitlement, type EntitlementSet } from './engine';
import { FEATURE_SLUGS, type FeatureSlug } from '@/constants/features';

/** Length of the free trial every new academy gets, in days. */
const TRIAL_DAYS = 14;
const DAY_MS = 86_400_000;

/** Every feature, unlocked — what a live free trial grants. */
const TRIAL_ENTITLEMENTS: EntitlementSet = Object.fromEntries(
  FEATURE_SLUGS.map((slug) => [slug, { kind: 'unlimited' as const }]),
) as EntitlementSet;

type TrialSub = { status: string; trial_ends_at: string | null } | null | undefined;

/**
 * When the free trial ends (epoch ms), or 0 if there is no trial window.
 *
 * The trial is anchored to the academy's creation date so a brand-new org gets
 * a full 14 days of everything even when no subscription/plan row exists yet
 * (e.g. plans haven't been seeded). If a subscription carries its own trial end
 * we honour whichever is later. A genuinely paid plan (active/paused) has no
 * trial window — callers handle that before asking.
 */
function trialEndMs(orgCreatedAt: string | null | undefined, sub: TrialSub): number {
  const fromCreation = orgCreatedAt ? new Date(orgCreatedAt).getTime() + TRIAL_DAYS * DAY_MS : 0;
  const fromSub =
    sub && sub.status === 'trialing' && sub.trial_ends_at
      ? new Date(sub.trial_ends_at).getTime()
      : 0;
  return Math.max(fromCreation, fromSub);
}

/**
 * One org-billing fetch (org creation date + latest live subscription) shared by
 * getEntitlements and getTrialStatus. Cached per request so a page that resolves
 * both entitlements AND trial state hits the DB once, not four times.
 */
const getOrgBilling = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const [{ data: org }, { data: sub }] = await Promise.all([
    supabase.from('organizations').select('created_at').eq('id', organizationId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan_id, status, trial_ends_at')
      .eq('organization_id', organizationId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return { createdAt: org?.created_at ?? null, sub };
});

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
    const { createdAt, sub } = await getOrgBilling(organizationId);

    // A genuinely paid plan takes precedence over any trial window.
    if (sub && (sub.status === 'active' || sub.status === 'paused')) {
      const supabase = await createClient();
      return resolvePlanEntitlements(supabase, sub.plan_id);
    }

    // The free trial unlocks EVERY feature for 14 days from sign-up — no numeric
    // limits, nothing held back — even before any plan is chosen or seeded. Once
    // the window closes the org falls back to its plan (or nothing).
    if (Date.now() < trialEndMs(createdAt, sub)) return { ...TRIAL_ENTITLEMENTS };

    if (sub) {
      const supabase = await createClient();
      return resolvePlanEntitlements(supabase, sub.plan_id);
    }
    return {};
  },
);

/** Resolve a plan's feature rows into a typed EntitlementSet. */
async function resolvePlanEntitlements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
): Promise<EntitlementSet> {
  const { data: rows } = await supabase
    .from('plan_features')
    .select('value, feature:features(slug, type)')
    .eq('plan_id', planId);

  const set: EntitlementSet = {};
  for (const row of rows ?? []) {
    const feature = row.feature as unknown as { slug: FeatureSlug; type: 'boolean' | 'numeric' | 'unlimited' } | null;
    if (!feature) continue;
    set[feature.slug] = parseEntitlement(feature.type, row.value);
  }
  return set;
}

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
  const { createdAt, sub } = await getOrgBilling(organizationId);

  // A paid plan wins over any trial window.
  if (sub && (sub.status === 'active' || sub.status === 'paused')) {
    return { state: 'active', trialEndsAt: null, daysLeft: 0 };
  }

  // The 14-day trial runs from account creation (or the subscription's own trial
  // end, whichever is later), independent of whether a plan exists.
  const end = trialEndMs(createdAt, sub);
  const now = Date.now();
  if (end && now < end) {
    const daysLeft = Math.max(1, Math.ceil((end - now) / DAY_MS));
    return { state: 'trialing', trialEndsAt: new Date(end).toISOString(), daysLeft };
  }

  if (sub && sub.status === 'past_due') return { state: 'past_due', trialEndsAt: null, daysLeft: 0 };
  if (end) return { state: 'trial_expired', trialEndsAt: new Date(end).toISOString(), daysLeft: 0 };
  return { state: 'none', trialEndsAt: null, daysLeft: 0 };
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
