'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

export interface PerLearnerPrice {
  amountMinor: number;
  currency: string;
}

/**
 * The per-learner monthly price for an organization, in its own currency.
 * Resolved from the active subscription's plan → plan_prices. Falls back to 0
 * when nothing is configured (the UI then shows "price not set").
 */
export async function getPerLearnerPrice(organizationId: string): Promise<PerLearnerPrice> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', organizationId)
    .maybeSingle();
  const currency = org?.currency ?? 'USD';

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('organization_id', organizationId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.plan_id) return { amountMinor: 0, currency };

  const { data: price } = await supabase
    .from('plan_prices')
    .select('per_learner_monthly_price_minor')
    .eq('plan_id', sub.plan_id)
    .eq('currency', currency)
    .maybeSingle();

  return { amountMinor: price?.per_learner_monthly_price_minor ?? 0, currency };
}

export interface LearnerBillingSummary {
  open: number;
  trialUsed: boolean;
  price: PerLearnerPrice;
}

export async function getLearnerBillingSummary(
  organizationId: string,
): Promise<LearnerBillingSummary> {
  const supabase = await createClient();
  const [{ data: openCount }, { data: trialUsed }, price] = await Promise.all([
    supabase.rpc('get_open_learner_count', { org: organizationId }),
    supabase.rpc('org_free_trial_used', { org: organizationId }),
    getPerLearnerPrice(organizationId),
  ]);
  return { open: openCount ?? 0, trialUsed: trialUsed ?? false, price };
}

/** Add one month to a date. */
function addMonth(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export type ActivateLearnerState = { error?: string; success?: boolean };

/**
 * Activate (pay for) a learner for the current month.
 *
 * INTERIM: while online checkout is not wired, an owner/admin records the
 * month's payment manually — this creates a platform payment record and opens
 * the learner's account for one month. When Paystack/Stripe checkout is wired,
 * this action will instead start a checkout and the account opens on the
 * provider webhook. Enforces billing.manage.
 */
export async function activateLearnerAction(
  _prev: ActivateLearnerState,
  formData: FormData,
): Promise<ActivateLearnerState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'billing.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage learner billing.' };
    throw e;
  }

  const learnerId = formData.get('learnerId') as string;
  if (!learnerId) return { error: 'No learner specified.' };

  const supabase = await createClient();

  // Confirm the learner belongs to this org.
  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('id', learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!learner) return { error: 'Learner not found.' };

  const price = await getPerLearnerPrice(ctx.organizationId);
  const now = new Date();
  const periodEnd = addMonth(now);

  // Record the platform payment (organization -> Tuvora) for this learner-month.
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      organization_id: ctx.organizationId,
      direction: 'platform',
      status: 'succeeded',
      amount_minor: price.amountMinor,
      currency: price.currency,
      payer_learner_id: learnerId,
      metadata: { kind: 'learner_month', manual: true },
      paid_at: now.toISOString(),
    })
    .select('id')
    .single();

  // Open the learner's account for the month.
  const { error: billErr } = await supabase.from('learner_billing').upsert(
    {
      organization_id: ctx.organizationId,
      learner_id: learnerId,
      status: 'active',
      is_trial: false,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      last_payment_id: payment?.id ?? null,
    },
    { onConflict: 'learner_id' },
  );
  if (billErr) return { error: 'Could not activate the learner. Please try again.' };

  await supabase
    .from('learners')
    .update({ status: 'active' })
    .eq('id', learnerId)
    .eq('organization_id', ctx.organizationId);

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'learner.activated',
    resource_type: 'learner',
    resource_id: learnerId,
    metadata: { amount_minor: price.amountMinor, currency: price.currency },
  });

  revalidatePath('/dashboard/learners');
  return { success: true };
}
