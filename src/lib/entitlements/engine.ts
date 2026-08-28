/**
 * Feature entitlement engine (pure logic).
 *
 * The engine answers: given an organization's plan entitlements + current usage,
 * what may it do? It is intentionally free of I/O so it is trivial to unit-test.
 * A thin server layer ('@/lib/entitlements/service') loads the entitlement set
 * and usage from the database and delegates to these functions.
 *
 * A feature value is one of:
 *   boolean   → { enabled: boolean }
 *   numeric   → { limit: number }        (a hard cap)
 *   unlimited → { unlimited: true }
 */

import type { FeatureSlug } from '@/constants/features';

export type EntitlementValue =
  | { kind: 'boolean'; enabled: boolean }
  | { kind: 'numeric'; limit: number }
  | { kind: 'unlimited' };

export type EntitlementSet = Partial<Record<FeatureSlug, EntitlementValue>>;

/**
 * Normalize a raw DB `plan_features.value` (jsonb) + feature type into a typed
 * EntitlementValue. Unknown/missing shapes fall back to a disabled boolean.
 */
export function parseEntitlement(
  type: 'boolean' | 'numeric' | 'unlimited',
  value: unknown,
): EntitlementValue {
  if (type === 'unlimited') return { kind: 'unlimited' };

  if (type === 'boolean') {
    if (typeof value === 'boolean') return { kind: 'boolean', enabled: value };
    return { kind: 'boolean', enabled: false };
  }

  // numeric
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.unlimited === true) return { kind: 'unlimited' };
    if (typeof obj.limit === 'number') return { kind: 'numeric', limit: obj.limit };
  }
  if (typeof value === 'number') return { kind: 'numeric', limit: value };
  return { kind: 'numeric', limit: 0 };
}

/** Is a (typically boolean) feature switched on for this org? */
export function hasFeature(entitlements: EntitlementSet, slug: FeatureSlug): boolean {
  const v = entitlements[slug];
  if (!v) return false;
  if (v.kind === 'unlimited') return true;
  if (v.kind === 'boolean') return v.enabled;
  // A numeric feature is "available" when its limit is non-zero or unlimited.
  return v.limit > 0;
}

/** The numeric limit for a feature; null means unlimited; 0 means unavailable. */
export function getFeatureLimit(entitlements: EntitlementSet, slug: FeatureSlug): number | null {
  const v = entitlements[slug];
  if (!v) return 0;
  if (v.kind === 'unlimited') return null;
  if (v.kind === 'boolean') return v.enabled ? null : 0;
  return v.limit;
}

/**
 * Given current usage, how many more of a resource may be created?
 * Returns Infinity for unlimited, 0 when unavailable/at-cap.
 */
export function getRemainingCapacity(
  entitlements: EntitlementSet,
  slug: FeatureSlug,
  currentUsage: number,
): number {
  const limit = getFeatureLimit(entitlements, slug);
  if (limit === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - currentUsage);
}

/** Can the org create one more of `slug` given current usage? */
export function canUseFeature(
  entitlements: EntitlementSet,
  slug: FeatureSlug,
  currentUsage: number,
): boolean {
  if (!hasFeature(entitlements, slug)) return false;
  return getRemainingCapacity(entitlements, slug, currentUsage) > 0;
}
