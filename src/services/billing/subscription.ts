'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { getEntitlements } from '@/lib/entitlements/service';
import { getActiveLearnerCount, getLearnerLimit } from '@/lib/entitlements/service';
import { getPublicPlans, type PublicPlan } from './plans';
import { hasFeature, getFeatureLimit } from '@/lib/entitlements/engine';
import { FEATURE_SLUGS } from '@/constants/features';
import type { SubscriptionStatus, BillingInterval } from '@/constants/subscriptions';

export interface SubscriptionOverview {
  hasSubscription: boolean;
  planId: string | null;
  planName: string | null;
  status: SubscriptionStatus | null;
  interval: BillingInterval | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  provider: string | null;
  seats: { active: number; limit: number | null };
  features: { slug: string; name: string; available: boolean; limit: number | null }[];
  plans: PublicPlan[];
}

const FEATURE_NAMES: Record<string, string> = {
  learners: 'Learners',
  classes: 'Classes',
  courses: 'Courses',
  staff: 'Staff members',
  storage: 'Storage',
  assignments: 'Assignments',
  assessments: 'Assessments',
  attendance: 'Attendance',
  reports: 'Reports',
  advanced_reports: 'Advanced reports',
  parent_portal: 'Parent portal',
  messaging: 'Messaging',
  payments: 'Payments',
  invoices: 'Invoices',
  certificates: 'Certificates',
  custom_branding: 'Custom branding',
  custom_domain: 'Custom domain',
  ai_tools: 'AI tools',
  automation: 'Automation',
  multiple_tutors: 'Multiple tutors',
  api_access: 'API access',
  advanced_analytics: 'Advanced analytics',
};

/** Everything the subscription page needs, scoped to the active organization. */
export async function getSubscriptionOverview(): Promise<SubscriptionOverview | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'billing.view');
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select(
      'plan_id, status, interval, trial_ends_at, current_period_end, provider',
    )
    .eq('organization_id', ctx.organizationId)
    .in('status', ['trialing', 'active', 'past_due', 'paused', 'incomplete'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let planName: string | null = null;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', sub.plan_id)
      .maybeSingle();
    planName = plan?.name ?? null;
  }

  // Price plans in the organization's own currency.
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', ctx.organizationId)
    .maybeSingle();
  const orgCurrency = orgRow?.currency ?? 'USD';

  const [entitlements, active, limit, plans] = await Promise.all([
    getEntitlements(ctx.organizationId),
    getActiveLearnerCount(ctx.organizationId),
    getLearnerLimit(ctx.organizationId),
    getPublicPlans(orgCurrency),
  ]);

  const features = FEATURE_SLUGS.map((slug) => ({
    slug,
    name: FEATURE_NAMES[slug] ?? slug,
    available: hasFeature(entitlements, slug),
    limit: getFeatureLimit(entitlements, slug),
  }));

  return {
    hasSubscription: !!sub,
    planId: sub?.plan_id ?? null,
    planName,
    status: (sub?.status as SubscriptionStatus) ?? null,
    interval: (sub?.interval as BillingInterval) ?? null,
    trialEndsAt: sub?.trial_ends_at ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    provider: sub?.provider ?? null,
    seats: { active, limit },
    features,
    plans,
  };
}

export type SwitchPlanState = { error?: string; success?: string; checkoutUrl?: string };

/**
 * Change the organization's plan.
 *
 * During a trial (or an incomplete subscription) the org is not yet being
 * charged, so we can switch plan_id directly — the provider will bill the new
 * plan when the trial converts. For an ACTIVE (paying) subscription a plan
 * change must go through the payment provider so proration and charging are
 * handled correctly; we route that through the PaymentProvider abstraction and
 * report clearly when online checkout is not yet configured, rather than faking
 * a charge.
 */
export async function switchPlanAction(
  _prev: SwitchPlanState,
  formData: FormData,
): Promise<SwitchPlanState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'billing.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage billing.' };
    throw e;
  }

  const planId = formData.get('planId') as string;
  const interval = ((formData.get('interval') as string) || 'monthly') as BillingInterval;
  if (!planId) return { error: 'Select a plan.' };

  const supabase = await createClient();

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, name')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle();
  if (!plan) return { error: 'That plan is not available.' };

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('organization_id', ctx.organizationId)
    .in('status', ['trialing', 'active', 'past_due', 'paused', 'incomplete'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Trial / incomplete → switch the selected plan directly (no charge yet).
  if (!sub || sub.status === 'trialing' || sub.status === 'incomplete') {
    if (sub) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan_id: planId, interval })
        .eq('id', sub.id)
        .eq('organization_id', ctx.organizationId);
      if (error) return { error: 'Could not change the plan.' };
    }
    await supabase.from('audit_logs').insert({
      organization_id: ctx.organizationId,
      actor_id: ctx.userId,
      action: 'subscription.plan_selected',
      resource_type: 'subscription',
      metadata: { plan: plan.name, interval },
    });
    revalidatePath('/dashboard/subscription');
    return { success: `Your plan will be ${plan.name} when your trial converts.` };
  }

  // Active subscription → must go through the payment provider.
  try {
    const { getPaymentProvider } = await import('@/lib/payments');
    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      organizationId: ctx.organizationId,
      planId,
      interval,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?changed=1`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    });
    return { checkoutUrl: session.url };
  } catch {
    return {
      error:
        'Online checkout is not configured yet. Add your payment provider keys to enable plan changes for active subscriptions.',
    };
  }
}
