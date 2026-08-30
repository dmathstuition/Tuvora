/**
 * Per-learner monthly pricing.
 *
 * Amounts are in each currency's MINOR unit (kobo for NGN, cents for USD, etc.).
 * These are the defaults used when an organization's plan doesn't set an explicit
 * per-learner price in `plan_prices`.
 */
export const DEFAULT_PER_LEARNER_MINOR: Record<string, number> = {
  NGN: 1_500_000, // ₦15,000
};

/** Fallback when the currency has no configured default. */
export const FALLBACK_PER_LEARNER_MINOR = 1_500_000;

export function defaultPerLearnerMinor(currency: string): number {
  return DEFAULT_PER_LEARNER_MINOR[currency] ?? FALLBACK_PER_LEARNER_MINOR;
}
