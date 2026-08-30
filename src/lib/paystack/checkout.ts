import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { initializeTransaction } from '@/lib/paystack/client';
import { defaultPerLearnerMinor } from '@/constants/billing';

/** Resolve an org's per-learner monthly price (minor units) + currency. */
export async function resolveLearnerPrice(
  organizationId: string,
): Promise<{ amountMinor: number; currency: string }> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from('organizations')
    .select('currency')
    .eq('id', organizationId)
    .maybeSingle();
  const currency = org?.currency ?? 'USD';

  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan_id')
    .eq('organization_id', organizationId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let configured = 0;
  if (sub?.plan_id) {
    const { data: price } = await admin
      .from('plan_prices')
      .select('per_learner_monthly_price_minor')
      .eq('plan_id', sub.plan_id)
      .eq('currency', currency)
      .maybeSingle();
    configured = price?.per_learner_monthly_price_minor ?? 0;
  }
  return { amountMinor: configured > 0 ? configured : defaultPerLearnerMinor(currency), currency };
}

/**
 * Create a pending payment and a Paystack checkout for one learner-month, and
 * return the hosted checkout URL to redirect the admin to. The amount is set
 * here (server-side) and the account only opens after the provider confirms the
 * payment against this exact reference.
 */
export async function beginLearnerCheckout(input: {
  organizationId: string;
  learnerId: string;
  payerEmail: string;
  baseUrl: string;
}): Promise<string> {
  const { organizationId, learnerId, payerEmail, baseUrl } = input;
  const { amountMinor, currency } = await resolveLearnerPrice(organizationId);
  if (amountMinor <= 0) throw new Error('A per-learner price is not set.');

  const reference = `TVR-${learnerId.replace(/-/g, '').slice(0, 12)}-${Date.now().toString(36)}`;
  const admin = createAdminClient();

  await admin.from('payments').insert({
    organization_id: organizationId,
    direction: 'platform',
    status: 'pending',
    amount_minor: amountMinor,
    currency,
    provider: 'paystack',
    provider_payment_id: reference,
    payer_learner_id: learnerId,
    metadata: { kind: 'learner_month' },
  });

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: payerEmail,
      amountMinor,
      currency,
      reference,
      callbackUrl: `${baseUrl}/api/paystack/callback`,
      metadata: { learner_id: learnerId, organization_id: organizationId, kind: 'learner_month' },
    });
    return authorizationUrl;
  } catch (e) {
    await admin.from('payments').update({ status: 'failed' }).eq('provider_payment_id', reference);
    throw e;
  }
}
