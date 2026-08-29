'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { CURRENCY_CODES } from '@/constants/currencies';
import { z } from 'zod';

export interface OrgSettings {
  id: string;
  name: string;
  type: string;
  email: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  subjects: string[];
  employsTutors: boolean;
  brandColor: string | null;
  logoUrl: string | null;
  portal: { displayName: string; welcome: string | null };
}

export async function getOrgSettings(): Promise<OrgSettings | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select(
      'id, name, type, email, country, currency, timezone, subjects, employs_tutors, brand_color, logo_url, portal_preferences',
    )
    .eq('id', ctx.organizationId)
    .maybeSingle();
  if (!data) return null;
  const prefs = (data.portal_preferences ?? {}) as { displayName?: string; welcome?: string };
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    email: data.email,
    country: data.country,
    currency: data.currency,
    timezone: data.timezone,
    subjects: data.subjects ?? [],
    employsTutors: data.employs_tutors,
    brandColor: data.brand_color,
    logoUrl: data.logo_url,
    portal: { displayName: prefs.displayName ?? data.name, welcome: prefs.welcome ?? null },
  };
}

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email('Enter a valid email').max(120).optional().or(z.literal('')),
  country: z.string().max(10).optional().or(z.literal('')),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
  timezone: z.string().max(60).optional().or(z.literal('')),
  employsTutors: z.coerce.boolean(),
});

export type SettingsState = { error?: string; success?: boolean };

export async function updateOrgProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'org.settings.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot change these settings.' };
    throw e;
  }

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    country: formData.get('country') || '',
    currency: formData.get('currency'),
    timezone: formData.get('timezone') || '',
    employsTutors: formData.get('employsTutors') === 'on' || formData.get('employsTutors') === 'true',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };

  const subjects = String(formData.get('subjects') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      country: parsed.data.country || null,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone || 'UTC',
      subjects,
      employs_tutors: parsed.data.employsTutors,
    })
    .eq('id', ctx.organizationId);
  if (error) return { error: 'Could not save. Please try again.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'org.settings_changed',
    resource_type: 'organization',
    resource_id: ctx.organizationId,
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateBrandingAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'org.branding.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot change branding.' };
    throw e;
  }

  const brandColor = String(formData.get('brandColor') ?? '');
  const displayName = String(formData.get('portalName') ?? '').slice(0, 60);
  const welcome = String(formData.get('portalWelcome') ?? '').slice(0, 300);
  if (brandColor && !/^#([0-9a-fA-F]{6})$/.test(brandColor)) {
    return { error: 'Use a hex colour like #4F46E5.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      brand_color: brandColor || null,
      portal_preferences: {
        displayName: displayName || null,
        welcome: welcome || null,
        themeColor: brandColor || null,
      },
    })
    .eq('id', ctx.organizationId);
  if (error) return { error: 'Could not save branding.' };

  revalidatePath('/dashboard/settings');
  return { success: true };
}

/**
 * Upload an academy logo to the public `org-logos` bucket and store its URL on
 * the organization. Uses the service-role client for the storage write (storage
 * RLS is bypassed) after verifying the caller may manage branding.
 */
export async function uploadLogoAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'org.branding.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot change branding.' };
    throw e;
  }

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image to upload.' };
  if (!file.type.startsWith('image/')) return { error: 'Please upload an image file.' };
  if (file.size > 2 * 1024 * 1024) return { error: 'Image must be under 2MB.' };

  const admin = createAdminClient();
  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${ctx.organizationId}/logo-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from('org-logos')
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { error: 'Upload failed. Please try again.' };

  const { data: pub } = admin.storage.from('org-logos').getPublicUrl(path);

  const { error } = await admin
    .from('organizations')
    .update({ logo_url: pub.publicUrl })
    .eq('id', ctx.organizationId);
  if (error) return { error: 'Could not save the logo.' };

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

/** Remove the academy logo. */
export async function removeLogoAction(
  _prev: SettingsState,
  _formData: FormData,
): Promise<SettingsState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'org.branding.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot change branding.' };
    throw e;
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('organizations')
    .update({ logo_url: null })
    .eq('id', ctx.organizationId);
  if (error) return { error: 'Could not remove the logo.' };
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}
