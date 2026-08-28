import { describe, it, expect } from 'vitest';
import {
  billableExtraSeats,
  calculateSeatBilling,
  effectiveLearnerLimit,
  canAddLearner,
} from './seats';

const plan = {
  includedLearners: 10,
  additionalLearnerPriceMinor: 150, // $1.50 per extra learner
  basePriceMinor: 4900, // $49 base
};

describe('billableExtraSeats', () => {
  it('is zero at or below the included count', () => {
    expect(billableExtraSeats(10, 10)).toBe(0);
    expect(billableExtraSeats(5, 10)).toBe(0);
  });
  it('counts learners beyond the included allowance', () => {
    expect(billableExtraSeats(20, 10)).toBe(10);
    expect(billableExtraSeats(30, 10)).toBe(20);
  });
});

describe('calculateSeatBilling', () => {
  it('charges only the base price within the included allowance', () => {
    const r = calculateSeatBilling(plan, 10);
    expect(r.billableExtraSeats).toBe(0);
    expect(r.totalMinor).toBe(4900);
  });

  it('adds extra-seat charges beyond the allowance (spec example: 20 learners)', () => {
    const r = calculateSeatBilling(plan, 20);
    expect(r.billableExtraSeats).toBe(10);
    expect(r.extraSeatsPriceMinor).toBe(1500);
    expect(r.totalMinor).toBe(6400);
  });

  it('spec example: 30 learners → base + 20 seats', () => {
    const r = calculateSeatBilling(plan, 30);
    expect(r.billableExtraSeats).toBe(20);
    expect(r.totalMinor).toBe(4900 + 20 * 150);
  });

  it('unlimited plans never charge for extra seats', () => {
    const r = calculateSeatBilling({ ...plan, unlimited: true }, 500);
    expect(r.billableExtraSeats).toBe(0);
    expect(r.totalMinor).toBe(4900);
    expect(r.unlimited).toBe(true);
  });
});

describe('effectiveLearnerLimit & canAddLearner', () => {
  it('adds purchased seats to the included count', () => {
    expect(effectiveLearnerLimit(10, 5)).toBe(15);
  });
  it('returns null (no cap) when unlimited', () => {
    expect(effectiveLearnerLimit(10, 5, true)).toBeNull();
  });
  it('blocks adding a learner at the cap', () => {
    expect(canAddLearner(15, 15)).toBe(false);
    expect(canAddLearner(14, 15)).toBe(true);
  });
  it('always allows adding when unlimited', () => {
    expect(canAddLearner(9999, null)).toBe(true);
  });
});
