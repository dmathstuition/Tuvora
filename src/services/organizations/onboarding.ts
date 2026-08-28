'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOrganizationSchema } from '@/schemas/organization';
import { slugify } from '@/lib/utils';

export type OnboardingState = { error?: string };

/**
 * Create an organization during onboarding.
 *
 * Runs under the SERVICE ROLE for the two writes that a brand-new user cannot
 * perform under RLS: creating the organization and inserting their own OWNER
 * membership row (self-insert into organization_members is intentionally
 * disallowed by policy to stop privilege escalation). The acting user is always
 * re-derived server-side from the session — never trusted from the client.
 *
 * A 14-day trial subscription is attached to the plan chosen at signup (or the
 * lowest-priced public plan by default) so entitlements resolve immediately.
 */
export async function createOrganizationAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const subjectsRaw = (formData.get('subjects') as string) ?? '';
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get('name'),
    ownerName: formData.get('ownerName'),
    businessModel: formData.get('businessModel'),
    country: formData.get('country') || undefined,
    currency: (formData.get('currency') as string) || 'USD',
    timezone: (formData.get('timezone') as string) || 'UTC',
    portalName: formData.get('portalName') || '',
    portalWelcome: formData.get('portalWelcome') || '',
    themeColor: formData.get('themeColor') || '',
    subjects: subjectsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  const admin = createAdminClient();

  // Ensure a unique slug.
  const base = slugify(parsed.data.name) || 'org';
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const employsTutors = parsed.data.businessModel === 'business';
  const orgType = employsTutors ? 'tutoring_business' : 'independent_tutor';
  const portalPreferences = {
    displayName: parsed.data.portalName || parsed.data.name,
    welcome: parsed.data.portalWelcome || null,
    themeColor: parsed.data.themeColor || null,
  };

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: parsed.data.name,
      slug,
      type: orgType,
      owner_id: user.id,
      country: parsed.data.country ?? null,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      subjects: parsed.data.subjects,
      employs_tutors: employsTutors,
      portal_preferences: portalPreferences,
      brand_color: parsed.data.themeColor || null,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: 'Could not create your organization. Please try again.' };
  }

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  });
  if (memberError) {
    return { error: 'Could not set up your membership. Please contact support.' };
  }

  // Attach a trial on the chosen plan (or the cheapest public plan).
  const chosenSlug = (formData.get('plan') as string) || null;
  const { data: plan } = await admin
    .from('subscription_plans')
    .select('id, trial_days')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  const planId = chosenSlug
    ? (
        await admin
          .from('subscription_plans')
          .select('id, trial_days')
          .eq('slug', chosenSlug)
          .maybeSingle()
      ).data?.id ?? plan?.id
    : plan?.id;

  if (planId) {
    const trialDays = plan?.trial_days ?? 14;
    const trialEnds = new Date(Date.now() + trialDays * 86_400_000).toISOString();
    await admin.from('subscriptions').insert({
      organization_id: org.id,
      plan_id: planId,
      status: 'trialing',
      interval: 'monthly',
      trial_ends_at: trialEnds,
      current_period_end: trialEnds,
    });
  }

  await admin
    .from('profiles')
    .update({
      last_active_organization_id: org.id,
      full_name: parsed.data.ownerName,
    })
    .eq('id', user.id);

  await admin
    .from('organizations')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', org.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
