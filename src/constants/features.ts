/**
 * Feature slugs referenced by the entitlement engine. These MUST match the
 * `features.slug` values seeded in the database. The list here gives the app
 * compile-time safety when calling hasFeature('advanced_reports') etc.; the
 * authoritative values and limits always come from the database at runtime.
 */
export const FEATURE_SLUGS = [
  'learners',
  'classes',
  'courses',
  'staff',
  'storage',
  'assignments',
  'assessments',
  'attendance',
  'reports',
  'advanced_reports',
  'parent_portal',
  'messaging',
  'payments',
  'invoices',
  'certificates',
  'custom_branding',
  'custom_domain',
  'ai_tools',
  'automation',
  'multiple_tutors',
  'api_access',
  'advanced_analytics',
] as const;

export type FeatureSlug = (typeof FEATURE_SLUGS)[number];
