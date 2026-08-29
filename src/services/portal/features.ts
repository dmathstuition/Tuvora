'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, isPlatformStaff, ForbiddenError } from '@/lib/permissions';
import { LEARNER_FEATURES, TOGGLEABLE_FEATURES } from '@/constants/learner-features';
import type { FlagMap } from '@/lib/portal/feature-flags';

const PLATFORM_KEY = 'learner_features';

/** Platform-wide availability of learner features (default: all available). */
export async function getPlatformFeatureAvailability(): Promise<FlagMap> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', PLATFORM_KEY)
    .maybeSingle();
  return ((data?.value as FlagMap | null) ?? {}) as FlagMap;
}

/** Teacher view: each toggleable feature's on/off + whether the platform allows it. */
export async function getOrgFeatureSettings(): Promise<
  { key: string; label: string; group: string; enabled: boolean; platformAvailable: boolean }[]
> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const supabase = await createClient();
  const [{ data: org }, platform] = await Promise.all([
    supabase.from('organizations').select('portal_preferences').eq('id', ctx.organizationId).maybeSingle(),
    getPlatformFeatureAvailability(),
  ]);
  const orgMap = (((org?.portal_preferences ?? {}) as { learnerFeatures?: FlagMap }).learnerFeatures ?? {}) as FlagMap;
  return TOGGLEABLE_FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    enabled: orgMap[f.key] !== false,
    platformAvailable: platform[f.key] !== false,
  }));
}

export type FeatureState = { error?: string; success?: boolean };

/** Teacher/admin saves which learner features are enabled for their academy. */
export async function updateLearnerFeaturesAction(
  _prev: FeatureState,
  formData: FormData,
): Promise<FeatureState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'org.branding.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot change these settings.' };
    throw e;
  }

  // Checkboxes only POST when checked → an unchecked toggleable feature is off.
  const map: FlagMap = {};
  for (const f of TOGGLEABLE_FEATURES) {
    map[f.key] = formData.get(`feat_${f.key}`) === 'on';
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('portal_preferences')
    .eq('id', ctx.organizationId)
    .maybeSingle();
  const prefs = (org?.portal_preferences ?? {}) as Record<string, unknown>;

  const { error } = await supabase
    .from('organizations')
    .update({ portal_preferences: { ...prefs, learnerFeatures: map } })
    .eq('id', ctx.organizationId);
  if (error) return { error: 'Could not save. Please try again.' };

  revalidatePath('/dashboard/settings');
  revalidatePath('/portal');
  return { success: true };
}

/** Admin view: each feature's platform availability. */
export async function getPlatformFeatureSettings(): Promise<
  { key: string; label: string; group: string; status: string; available: boolean }[]
> {
  const platform = await getPlatformFeatureAvailability();
  return LEARNER_FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    status: f.status,
    available: platform[f.key] !== false,
  }));
}

/** Super admin sets which learner features are globally available. */
export async function updatePlatformFeaturesAction(
  _prev: FeatureState,
  formData: FormData,
): Promise<FeatureState> {
  const ctx = await getAuthContext();
  if (!ctx || !isPlatformStaff(ctx)) return { error: 'Platform staff only.' };

  const map: FlagMap = {};
  for (const f of LEARNER_FEATURES) {
    map[f.key] = formData.get(`plat_${f.key}`) === 'on';
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('platform_settings')
    .upsert({ key: PLATFORM_KEY, value: map, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return { error: 'Could not save platform settings.' };

  revalidatePath('/admin/learner-features');
  return { success: true };
}
