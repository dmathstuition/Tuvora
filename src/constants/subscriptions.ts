/** Subscription lifecycle constants and the access semantics of each state. */

export const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired',
  'incomplete',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_INTERVALS = ['monthly', 'yearly'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/**
 * States in which the organization retains full write access to the product.
 * Note `past_due` keeps access during the configurable grace period; the
 * entitlement layer, not the UI, decides when the grace window closes.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  'trialing',
  'active',
  'past_due',
];

/**
 * States in which data is preserved but premium functionality is restricted to
 * read-only. We NEVER delete tenant data on expiry — the org can renew.
 */
export const READ_ONLY_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  'paused',
  'cancelled',
  'expired',
];

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}
