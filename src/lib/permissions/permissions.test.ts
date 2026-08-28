import { describe, it, expect } from 'vitest';
import { can, canAll, canAny, resolvePermissions, type AuthContext } from './index';

function ctx(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    userId: 'u1',
    platformRole: 'none',
    organizationId: 'org1',
    role: 'staff',
    overrides: {},
    ...overrides,
  };
}

describe('permissions.can', () => {
  it('grants super admins everything regardless of org', () => {
    const c = ctx({ platformRole: 'super_admin', organizationId: null, role: null });
    expect(can(c, 'billing.manage')).toBe(true);
    expect(can(c, 'learners.delete')).toBe(true);
  });

  it('grants owners every org permission', () => {
    const c = ctx({ role: 'owner' });
    expect(can(c, 'billing.manage')).toBe(true);
    expect(can(c, 'learners.delete')).toBe(true);
  });

  it('applies role defaults for a tutor', () => {
    const c = ctx({ role: 'tutor' });
    expect(can(c, 'learners.create')).toBe(true);
    expect(can(c, 'assignments.grade')).toBe(true);
    // Tutors cannot manage billing by default.
    expect(can(c, 'billing.manage')).toBe(false);
  });

  it('denies everything when acting without an organization role', () => {
    const c = ctx({ organizationId: null, role: null });
    expect(can(c, 'learners.view')).toBe(false);
  });

  it('honours per-member grant overrides', () => {
    const c = ctx({ role: 'staff', overrides: { grant: ['reports.view'] } });
    expect(can(c, 'reports.view')).toBe(true);
  });

  it('honours per-member revoke overrides (revoke wins)', () => {
    const c = ctx({ role: 'tutor', overrides: { revoke: ['learners.create'] } });
    expect(can(c, 'learners.create')).toBe(false);
  });

  it('accountant can manage billing but not grade assignments', () => {
    const c = ctx({ role: 'accountant' });
    expect(can(c, 'billing.manage')).toBe(true);
    expect(can(c, 'assignments.grade')).toBe(false);
  });
});

describe('permissions.canAll / canAny', () => {
  it('canAll requires every permission', () => {
    const c = ctx({ role: 'tutor' });
    expect(canAll(c, ['learners.view', 'learners.create'])).toBe(true);
    expect(canAll(c, ['learners.view', 'billing.manage'])).toBe(false);
  });

  it('canAny requires at least one', () => {
    const c = ctx({ role: 'staff' });
    expect(canAny(c, ['billing.manage', 'learners.view'])).toBe(true);
    expect(canAny(c, ['billing.manage', 'invoices.manage'])).toBe(false);
  });
});

describe('resolvePermissions', () => {
  it('returns an empty owner set (owner handled specially in can)', () => {
    expect(resolvePermissions('owner').size).toBe(0);
  });

  it('deduplicates grants already present', () => {
    const set = resolvePermissions('tutor', { grant: ['learners.view'] });
    expect(set.has('learners.view')).toBe(true);
  });
});
