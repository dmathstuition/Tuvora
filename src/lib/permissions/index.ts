/**
 * Centralized authorization — the ONLY place role→permission logic lives.
 *
 * Usage:
 *   const ctx = await getAuthContext();               // server-side
 *   if (!can(ctx, 'learners.create')) throw forbidden();
 *
 * The evaluation order is:
 *   1. Platform super admins bypass org permission checks entirely.
 *   2. Organization owners implicitly hold every permission.
 *   3. Otherwise, start from the role's default grants.
 *   4. Apply per-member overrides (revoke wins over grant).
 */

import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type OrgRole,
  type Permission,
  type PlatformRole,
} from '@/constants/roles';

export interface PermissionOverrides {
  grant?: Permission[];
  revoke?: Permission[];
}

/**
 * The authenticated actor's authorization context for a SINGLE organization.
 * Resolved server-side (see '@/lib/auth'); never trust a client-supplied role.
 */
export interface AuthContext {
  userId: string;
  platformRole: PlatformRole;
  /** Null when the user is acting outside any organization (e.g. portal). */
  organizationId: string | null;
  role: OrgRole | null;
  overrides: PermissionOverrides;
}

export function isSuperAdmin(ctx: Pick<AuthContext, 'platformRole'>): boolean {
  return ctx.platformRole === 'super_admin';
}

export function isPlatformStaff(ctx: Pick<AuthContext, 'platformRole'>): boolean {
  return ctx.platformRole === 'super_admin' || ctx.platformRole === 'platform_support';
}

/** Resolve the effective permission set for a role + overrides. */
export function resolvePermissions(
  role: OrgRole,
  overrides: PermissionOverrides = {},
): Set<Permission> {
  const base = ROLE_PERMISSIONS[role];
  const set = new Set<Permission>(base === '*' ? [] : base);
  const isOwnerLike = base === '*';

  // Owners get everything; represented by a sentinel handled in `can`.
  if (isOwnerLike) {
    return set; // caller treats owner specially via can()
  }

  for (const p of overrides.grant ?? []) set.add(p);
  for (const p of overrides.revoke ?? []) set.delete(p);
  return set;
}

/**
 * The core check. Returns true if the actor may perform `permission` in the
 * context's organization.
 */
export function can(ctx: AuthContext, permission: Permission): boolean {
  // 1. Platform super admin bypass.
  if (isSuperAdmin(ctx)) return true;

  // Must be within an organization with a role to hold org permissions.
  if (!ctx.organizationId || !ctx.role) return false;

  // 2. Owner implicitly holds every permission.
  if (ctx.role === 'owner') return true;

  // 3 + 4. Role defaults with overrides applied.
  const effective = resolvePermissions(ctx.role, ctx.overrides);
  return effective.has(permission);
}

/** True only if the actor has ALL of the given permissions. */
export function canAll(ctx: AuthContext, permissions: Permission[]): boolean {
  return permissions.every((p) => can(ctx, p));
}

/** True if the actor has ANY of the given permissions. */
export function canAny(ctx: AuthContext, permissions: Permission[]): boolean {
  return permissions.some((p) => can(ctx, p));
}

/**
 * Expand a context into the concrete list of permissions it holds. Used to
 * drive UI (e.g. which nav items to render). Owners and super admins receive
 * the full catalogue.
 */
export function listPermissions(ctx: AuthContext): Permission[] {
  if (isSuperAdmin(ctx) || ctx.role === 'owner') {
    return [...PERMISSIONS];
  }
  if (!ctx.organizationId || !ctx.role) return [];
  return [...resolvePermissions(ctx.role, ctx.overrides)];
}

/** Thrown/handled by server actions and route handlers on an authz failure. */
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(permission?: Permission) {
    super(permission ? `Missing permission: ${permission}` : 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

/** Guard helper: throws ForbiddenError when the check fails. */
export function assertCan(ctx: AuthContext, permission: Permission): void {
  if (!can(ctx, permission)) throw new ForbiddenError(permission);
}
