'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadPublicImage } from '@/lib/storage/images';
import { slugify } from '@/lib/utils';
import { stepSchemas, type OnboardingDraft, type StepKey } from '@/schemas/onboarding';
import { ONBOARDING_STEPS } from '@/config/onboarding-steps';

type Json = Record<string, unknown>;

const ORG_TYPE_BY_BUSINESS: Record<string, string> = {
  solo: 'independent_tutor',
  business: 'tutoring_business',
  centre: 'tutoring_centre',
  online: 'online_tutor',
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

/** The draft org the signed-in user owns (created lazily during onboarding). */
async function ownedOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('organizations')
    .select(
      'id, name, country, city, currency, timezone, subjects, website, phone, email, logo_url, brand_color, settings, onboarding_step, onboarding_completed_at, portal_preferences',
    )
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Make sure the onboarding user has a draft organization to attach answers to,
 * creating it (owner membership + 14-day trial) on first entry. Idempotent —
 * returns the existing org on subsequent calls. Service role is required for the
 * initial org + membership insert (a brand-new user cannot self-insert those).
 */
export async function ensureOnboardingOrg(): Promise<{ completed: boolean }> {
  const { supabase, user } = await requireUser();

  const existing = await ownedOrg(supabase, user.id);
  if (existing) return { completed: !!existing.onboarding_completed_at };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const base = slugify(profile?.full_name ?? 'academy') || 'academy';
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: org, error } = await admin
    .from('organizations')
    .insert({
      name: 'My academy',
      slug,
      type: 'independent_tutor',
      owner_id: user.id,
      settings: {},
      onboarding_step: 0,
    })
    .select('id')
    .single();
  if (error || !org) return { completed: false };

  await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  // 14-day trial so entitlements + the trial banner work from day one.
  const { data: plan } = await admin
    .from('subscription_plans')
    .select('id, trial_days')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (plan?.id) {
    const trialEnds = new Date(Date.now() + (plan.trial_days ?? 14) * 86_400_000).toISOString();
    await admin.from('subscriptions').insert({
      organization_id: org.id,
      plan_id: plan.id,
      status: 'trialing',
      interval: 'monthly',
      trial_ends_at: trialEnds,
      current_period_end: trialEnds,
    });
  }

  await admin.from('profiles').update({ last_active_organization_id: org.id }).eq('id', user.id);
  return { completed: false };
}

export interface OnboardingData {
  step: number;
  draft: OnboardingDraft;
  ownerEmail: string;
  ownerName: string;
}

/** Load the wizard's saved progress + a sensibly pre-filled draft. */
export async function getOnboardingData(): Promise<OnboardingData> {
  const { supabase, user } = await requireUser();
  const org = await ownedOrg(supabase, user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, country, timezone')
    .eq('id', user.id)
    .maybeSingle();

  const settings = (org?.settings ?? {}) as Json;
  const saved = (settings.onboarding ?? {}) as OnboardingDraft;

  // Fall back to profile / org columns for the very first visit.
  const draft: OnboardingDraft = {
    about: saved.about ?? {
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      personalCountry: profile?.country ?? '',
      personalTimezone: profile?.timezone ?? '',
      businessType: 'solo',
    },
    organization: saved.organization,
    teaching: saved.teaching,
    learners: saved.learners,
    modules: saved.modules,
    workspace: saved.workspace,
    logoUrl: saved.logoUrl ?? org?.logo_url ?? null,
  };

  return {
    step: org?.onboarding_step ?? 0,
    draft,
    ownerEmail: profile?.email ?? user.email ?? '',
    ownerName: profile?.full_name ?? '',
  };
}

export type SaveStepState = { error?: string; success?: boolean; step?: number };

/**
 * Validate + persist a single wizard step, then advance the saved progress.
 * The full step payload is kept verbatim in settings.onboarding for perfect
 * resume, while canonical fields are mirrored to their real columns.
 */
export async function saveOnboardingStepAction(
  _prev: SaveStepState,
  formData: FormData,
): Promise<SaveStepState> {
  const { supabase, user } = await requireUser();
  const org = await ownedOrg(supabase, user.id);
  if (!org) return { error: 'Your workspace is not ready yet. Please refresh.' };

  const stepKey = String(formData.get('stepKey') ?? '') as StepKey;
  const schema = stepSchemas[stepKey] as z.ZodTypeAny | undefined;
  if (!schema) return { error: 'Unknown step.' };

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: 'Could not read the form.' };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const value = parsed.data;

  const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.key === stepKey);
  const settings = { ...((org.settings ?? {}) as Json) };
  const onboarding = { ...((settings.onboarding ?? {}) as Json), [stepKey]: value };
  settings.onboarding = onboarding;

  const orgUpdate: Record<string, unknown> = {
    settings,
    onboarding_step: Math.max(org.onboarding_step ?? 0, stepIndex + 1),
  };

  // Mirror canonical columns per step.
  if (stepKey === 'about') {
    const v = value as z.infer<typeof stepSchemas.about>;
    orgUpdate.type = ORG_TYPE_BY_BUSINESS[v.businessType] ?? 'independent_tutor';
    orgUpdate.employs_tutors = v.businessType === 'business' || v.businessType === 'centre';
    await supabase
      .from('profiles')
      .update({
        full_name: v.fullName,
        phone: v.phone || null,
        country: v.personalCountry || null,
        timezone: v.personalTimezone || null,
      })
      .eq('id', user.id);
  } else if (stepKey === 'organization') {
    const v = value as z.infer<typeof stepSchemas.organization>;
    orgUpdate.name = v.orgName;
    orgUpdate.country = v.country || null;
    orgUpdate.city = v.city || null;
    orgUpdate.currency = v.currency;
    orgUpdate.timezone = v.timezone || 'UTC';
    orgUpdate.website = v.website || null;
    orgUpdate.phone = v.businessPhone || null;
    orgUpdate.email = v.businessEmail || null;
    orgUpdate.portal_preferences = {
      ...((org.portal_preferences ?? {}) as Json),
      displayName: v.orgName,
    };
  } else if (stepKey === 'teaching') {
    const v = value as z.infer<typeof stepSchemas.teaching>;
    orgUpdate.subjects = v.subjects;
  } else if (stepKey === 'workspace') {
    const v = value as z.infer<typeof stepSchemas.workspace>;
    orgUpdate.currency = v.currency;
    orgUpdate.timezone = v.timezone || 'UTC';
  }

  const { error } = await supabase.from('organizations').update(orgUpdate as never).eq('id', org.id);
  if (error) return { error: 'Could not save your progress. Please try again.' };

  revalidatePath('/onboarding');
  return { success: true, step: stepIndex + 1 };
}

export type LogoState = { error?: string; url?: string };

/** Upload the organization logo during onboarding. */
export async function uploadOnboardingLogoAction(
  _prev: LogoState,
  formData: FormData,
): Promise<LogoState> {
  const { supabase, user } = await requireUser();
  const org = await ownedOrg(supabase, user.id);
  if (!org) return { error: 'Your workspace is not ready yet.' };

  const uploaded = await uploadPublicImage(`${org.id}/logo`, formData.get('image'));
  if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? 'Upload failed.' };

  const settings = { ...((org.settings ?? {}) as Json) };
  settings.onboarding = { ...((settings.onboarding ?? {}) as Json), logoUrl: uploaded.url };
  await supabase
    .from('organizations')
    .update({ logo_url: uploaded.url, settings } as never)
    .eq('id', org.id);
  return { url: uploaded.url };
}

export type InviteState = { error?: string; success?: boolean };

/** Invite a teammate during onboarding (reuses the organization invite flow). */
export async function inviteFromOnboardingAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { inviteMemberAction } = await import('@/services/organizations/members');
  const res = await inviteMemberAction({}, formData);
  if (res.error) return { error: res.error };
  return { success: true };
}

/** Finish onboarding — mark complete and go to the dashboard. */
export async function completeOnboardingAction(): Promise<void> {
  const { supabase, user } = await requireUser();
  const org = await ownedOrg(supabase, user.id);
  if (!org) redirect('/onboarding');

  await supabase
    .from('organizations')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: ONBOARDING_STEPS.length - 1,
    })
    .eq('id', org.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
