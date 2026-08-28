/** Organization-level enums shared between the DB, validation and UI. */

export const ORGANIZATION_TYPES = [
  { value: 'independent_tutor', label: 'Independent Tutor' },
  { value: 'tutoring_business', label: 'Tutoring Business' },
  { value: 'tutoring_centre', label: 'Tutoring Centre' },
  { value: 'online_tutor', label: 'Online Tutor' },
  { value: 'coaching_business', label: 'Coaching Business' },
  { value: 'other', label: 'Other' },
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]['value'];

export const LEARNER_STATUSES = ['active', 'inactive', 'archived'] as const;
export type LearnerStatus = (typeof LEARNER_STATUSES)[number];
