/**
 * Roles and permissions — the single source of truth for authorization.
 *
 * Permissions are expressed as `resource.action` strings and grouped into roles.
 * Application code NEVER hardcodes role checks (e.g. `if (role === 'owner')`);
 * it calls `can(user, 'learners.create')` from '@/lib/permissions'. This keeps
 * authorization centralized and extensible.
 */

export const ORG_ROLES = [
  'owner',
  'admin',
  'tutor',
  'assistant',
  'accountant',
  'staff',
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PLATFORM_ROLES = ['none', 'platform_support', 'super_admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * The full permission catalogue. Add new permissions here; never invent
 * permission strings inline. Grouped by domain for readability.
 */
export const PERMISSIONS = [
  // Organization & settings
  'org.manage',
  'org.settings.manage',
  'org.branding.manage',
  'members.view',
  'members.invite',
  'members.manage',
  'members.remove',
  // Billing (Tuvoria subscription)
  'billing.view',
  'billing.manage',
  // Learners
  'learners.view',
  'learners.create',
  'learners.update',
  'learners.archive',
  'learners.delete',
  // Parents
  'parents.view',
  'parents.manage',
  // Classes / online lessons
  'classes.view',
  'classes.manage',
  'lessons.view',
  'lessons.manage',
  // Assignments & assessments
  'assignments.view',
  'assignments.manage',
  'assignments.grade',
  'assessments.view',
  'assessments.manage',
  'assessments.grade',
  // Attendance & grades & progress
  'attendance.view',
  'attendance.manage',
  'grades.view',
  'grades.manage',
  'progress.view',
  // Rewards, sanctions & leaderboard (gamification)
  'rewards.view',
  'rewards.manage',
  // Reports & resources
  'reports.view',
  'reports.generate',
  'resources.view',
  'resources.manage',
  // Communication & calendar
  'messages.view',
  'messages.send',
  'calendar.view',
  'calendar.manage',
  // Tutor-side payments (parent/learner → tutor)
  'payments.view',
  'payments.manage',
  'invoices.view',
  'invoices.manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Default permission grants per organization role. A member's effective
 * permissions are these defaults, then adjusted by per-member overrides
 * (organization_members.permission_overrides).
 *
 * `owner` implicitly has every permission (handled in can()), so it is listed
 * as '*' for clarity but the code short-circuits owners.
 */
export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[] | '*'> = {
  owner: '*',
  admin: [
    'org.settings.manage',
    'org.branding.manage',
    'members.view',
    'members.invite',
    'members.manage',
    'members.remove',
    'billing.view',
    'billing.manage',
    'learners.view',
    'learners.create',
    'learners.update',
    'learners.archive',
    'learners.delete',
    'parents.view',
    'parents.manage',
    'classes.view',
    'classes.manage',
    'lessons.view',
    'lessons.manage',
    'assignments.view',
    'assignments.manage',
    'assignments.grade',
    'assessments.view',
    'assessments.manage',
    'assessments.grade',
    'attendance.view',
    'attendance.manage',
    'grades.view',
    'grades.manage',
    'progress.view',
    'rewards.view',
    'rewards.manage',
    'reports.view',
    'reports.generate',
    'resources.view',
    'resources.manage',
    'messages.view',
    'messages.send',
    'calendar.view',
    'calendar.manage',
    'payments.view',
    'payments.manage',
    'invoices.view',
    'invoices.manage',
  ],
  tutor: [
    'members.view',
    'learners.view',
    'learners.create',
    'learners.update',
    'parents.view',
    'classes.view',
    'classes.manage',
    'lessons.view',
    'lessons.manage',
    'assignments.view',
    'assignments.manage',
    'assignments.grade',
    'assessments.view',
    'assessments.manage',
    'assessments.grade',
    'attendance.view',
    'attendance.manage',
    'grades.view',
    'grades.manage',
    'progress.view',
    'rewards.view',
    'rewards.manage',
    'reports.view',
    'reports.generate',
    'resources.view',
    'resources.manage',
    'messages.view',
    'messages.send',
    'calendar.view',
    'calendar.manage',
  ],
  assistant: [
    'learners.view',
    'classes.view',
    'assignments.view',
    'assessments.view',
    'attendance.view',
    'attendance.manage',
    'grades.view',
    'rewards.view',
    'rewards.manage',
    'resources.view',
    'messages.view',
    'messages.send',
    'calendar.view',
  ],
  accountant: [
    'billing.view',
    'billing.manage',
    'learners.view',
    'reports.view',
    'payments.view',
    'payments.manage',
    'invoices.view',
    'invoices.manage',
  ],
  staff: ['learners.view', 'classes.view', 'calendar.view', 'messages.view', 'rewards.view'],
};
