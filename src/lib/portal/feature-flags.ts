import { LEARNER_FEATURES } from '@/constants/learner-features';

export type FlagMap = Record<string, boolean>;

/**
 * The set of feature keys a learner should see: present in the catalogue, not
 * switched off platform-wide, and not hidden by their academy. Pure so it can
 * be shared by the portal loader and the settings services.
 */
export function effectiveEnabledFeatures(orgPrefs: unknown, platform: FlagMap): Set<string> {
  const orgMap = (((orgPrefs ?? {}) as { learnerFeatures?: FlagMap }).learnerFeatures ?? {}) as FlagMap;
  const enabled = new Set<string>();
  for (const f of LEARNER_FEATURES) {
    if (platform[f.key] === false) continue;
    if (orgMap[f.key] === false) continue;
    enabled.add(f.key);
  }
  return enabled;
}
