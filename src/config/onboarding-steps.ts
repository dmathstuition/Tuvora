/**
 * Onboarding wizard configuration — the single source of truth for the step
 * order, titles and which steps may be skipped. Add a new step by appending an
 * entry here and rendering its case in the wizard; nothing else needs to change.
 */
export interface OnboardingStepMeta {
  key: string;
  title: string;
  subtitle: string;
  /** Optional steps show a "Skip for now" affordance and never block progress. */
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { key: 'about', title: 'About you', subtitle: 'Tell us who you are.' },
  { key: 'organization', title: 'Your organization', subtitle: 'Set up your academy’s identity.' },
  { key: 'teaching', title: 'What you teach', subtitle: 'Subjects, levels and how you deliver.' },
  { key: 'learners', title: 'Your learners', subtitle: 'A quick picture of who you teach.', optional: true },
  { key: 'modules', title: 'What to manage', subtitle: 'Pick the tools you’ll use in Tuvora.' },
  { key: 'workspace', title: 'Workspace preferences', subtitle: 'Defaults for grading and scheduling.' },
  { key: 'team', title: 'Invite your team', subtitle: 'Add tutors and staff — or do it later.', optional: true },
  { key: 'complete', title: 'You’re all set', subtitle: 'Review and enter your dashboard.' },
];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

/** The last step index that still collects data (before the completion screen). */
export const LAST_INPUT_STEP = ONBOARDING_STEPS.length - 2;
