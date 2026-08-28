/**
 * Learner-seat billing math (pure logic).
 *
 * The monetization model is: base subscription (includes N learners) + paid
 * additional learner seats beyond N. Prices and included counts are DATA passed
 * in from the plan record — never hardcoded here.
 *
 * All money is in MINOR units (cents/kobo) to avoid floating point drift.
 */

export interface SeatPlanInput {
  includedLearners: number;
  additionalLearnerPriceMinor: number;
  basePriceMinor: number;
  /** true when the plan grants unlimited learners via entitlements */
  unlimited?: boolean;
}

export interface SeatCalculation {
  activeLearners: number;
  includedLearners: number;
  billableExtraSeats: number;
  basePriceMinor: number;
  extraSeatsPriceMinor: number;
  totalMinor: number;
  unlimited: boolean;
}

/** How many extra (billable) seats are needed for a given active-learner count. */
export function billableExtraSeats(activeLearners: number, includedLearners: number): number {
  return Math.max(0, activeLearners - includedLearners);
}

/** Compute the full recurring charge for an org's current learner count. */
export function calculateSeatBilling(
  plan: SeatPlanInput,
  activeLearners: number,
): SeatCalculation {
  if (plan.unlimited) {
    return {
      activeLearners,
      includedLearners: plan.includedLearners,
      billableExtraSeats: 0,
      basePriceMinor: plan.basePriceMinor,
      extraSeatsPriceMinor: 0,
      totalMinor: plan.basePriceMinor,
      unlimited: true,
    };
  }

  const extra = billableExtraSeats(activeLearners, plan.includedLearners);
  const extraSeatsPriceMinor = extra * plan.additionalLearnerPriceMinor;

  return {
    activeLearners,
    includedLearners: plan.includedLearners,
    billableExtraSeats: extra,
    basePriceMinor: plan.basePriceMinor,
    extraSeatsPriceMinor,
    totalMinor: plan.basePriceMinor + extraSeatsPriceMinor,
    unlimited: false,
  };
}

/**
 * The effective learner limit for a plan given purchased extra seats.
 * Returns null for unlimited.
 */
export function effectiveLearnerLimit(
  includedLearners: number,
  purchasedExtraSeats: number,
  unlimited = false,
): number | null {
  if (unlimited) return null;
  return includedLearners + Math.max(0, purchasedExtraSeats);
}

export function canAddLearner(
  activeLearners: number,
  limit: number | null,
): boolean {
  if (limit === null) return true; // unlimited
  return activeLearners < limit;
}
