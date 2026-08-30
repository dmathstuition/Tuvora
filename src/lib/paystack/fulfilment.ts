import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

function addMonth(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export interface FulfilResult {
  ok: boolean;
  learnerId?: string;
  reason?: 'unknown' | 'amount_mismatch' | 'already';
}

/**
 * Open a learner's account for one month after a verified Paystack payment.
 *
 * Idempotent: keyed on the pending payment row created at checkout (found by its
 * Paystack `reference`). Runs with the service role because webhooks/callbacks
 * have no user session. Re-checks the paid amount against the amount we asked
 * for, so a tampered client-side amount can never open an account.
 */
export async function fulfilLearnerPayment(input: {
  reference: string;
  paidAmountMinor: number;
  paidCurrency: string;
  providerPaymentId: string | null;
}): Promise<FulfilResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from('payments')
    .select('id, organization_id, payer_learner_id, amount_minor, currency, status')
    .eq('provider', 'paystack')
    .eq('provider_payment_id', input.reference)
    .maybeSingle();

  if (!payment || !payment.payer_learner_id) return { ok: false, reason: 'unknown' };
  if (payment.status === 'succeeded') {
    return { ok: true, learnerId: payment.payer_learner_id, reason: 'already' };
  }

  // Never open on a mismatched amount.
  if (input.paidAmountMinor < payment.amount_minor) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { ok: false, reason: 'amount_mismatch' };
  }

  const now = new Date();
  const periodEnd = addMonth(now);

  await admin
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: now.toISOString(),
      metadata: { kind: 'learner_month', provider_payment_id: input.providerPaymentId },
    })
    .eq('id', payment.id);

  await admin.from('learner_billing').upsert(
    {
      organization_id: payment.organization_id,
      learner_id: payment.payer_learner_id,
      status: 'active',
      is_trial: false,
      provider: 'paystack',
      provider_reference: input.reference,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      last_payment_id: payment.id,
    },
    { onConflict: 'learner_id' },
  );

  await admin
    .from('learners')
    .update({ status: 'active' })
    .eq('id', payment.payer_learner_id)
    .eq('organization_id', payment.organization_id);

  await admin.from('audit_logs').insert({
    organization_id: payment.organization_id,
    actor_id: null,
    action: 'learner.paid',
    resource_type: 'learner',
    resource_id: payment.payer_learner_id,
    metadata: { amount_minor: payment.amount_minor, currency: payment.currency, provider: 'paystack' },
  });

  return { ok: true, learnerId: payment.payer_learner_id };
}
