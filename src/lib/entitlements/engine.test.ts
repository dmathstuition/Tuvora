import { describe, it, expect } from 'vitest';
import {
  parseEntitlement,
  hasFeature,
  getFeatureLimit,
  getRemainingCapacity,
  canUseFeature,
  type EntitlementSet,
} from './engine';

describe('parseEntitlement', () => {
  it('parses booleans', () => {
    expect(parseEntitlement('boolean', true)).toEqual({ kind: 'boolean', enabled: true });
    expect(parseEntitlement('boolean', false)).toEqual({ kind: 'boolean', enabled: false });
  });
  it('parses numeric limits', () => {
    expect(parseEntitlement('numeric', { limit: 50 })).toEqual({ kind: 'numeric', limit: 50 });
  });
  it('parses unlimited encoded on a numeric feature', () => {
    expect(parseEntitlement('numeric', { unlimited: true })).toEqual({ kind: 'unlimited' });
  });
  it('falls back safely on garbage', () => {
    expect(parseEntitlement('numeric', 'oops')).toEqual({ kind: 'numeric', limit: 0 });
    expect(parseEntitlement('boolean', 'oops')).toEqual({ kind: 'boolean', enabled: false });
  });
});

const entitlements: EntitlementSet = {
  learners: { kind: 'numeric', limit: 50 },
  classes: { kind: 'unlimited' },
  advanced_reports: { kind: 'boolean', enabled: true },
  parent_portal: { kind: 'boolean', enabled: false },
};

describe('hasFeature', () => {
  it('true for enabled booleans and unlimited', () => {
    expect(hasFeature(entitlements, 'advanced_reports')).toBe(true);
    expect(hasFeature(entitlements, 'classes')).toBe(true);
  });
  it('false for disabled or absent', () => {
    expect(hasFeature(entitlements, 'parent_portal')).toBe(false);
    expect(hasFeature(entitlements, 'ai_tools')).toBe(false);
  });
});

describe('limits and capacity', () => {
  it('returns numeric limits and null for unlimited', () => {
    expect(getFeatureLimit(entitlements, 'learners')).toBe(50);
    expect(getFeatureLimit(entitlements, 'classes')).toBeNull();
  });
  it('computes remaining capacity', () => {
    expect(getRemainingCapacity(entitlements, 'learners', 45)).toBe(5);
    expect(getRemainingCapacity(entitlements, 'learners', 50)).toBe(0);
    expect(getRemainingCapacity(entitlements, 'classes', 999)).toBe(Number.POSITIVE_INFINITY);
  });
  it('canUseFeature respects the cap', () => {
    expect(canUseFeature(entitlements, 'learners', 49)).toBe(true);
    expect(canUseFeature(entitlements, 'learners', 50)).toBe(false);
    expect(canUseFeature(entitlements, 'classes', 10_000)).toBe(true);
  });
});
