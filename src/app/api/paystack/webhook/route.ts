import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack/client';
import { fulfilLearnerPayment } from '@/lib/paystack/fulfilment';

/**
 * Paystack webhook. The authoritative confirmation of payment.
 *
 * Security: the raw body is authenticated via HMAC-SHA512 (x-paystack-signature)
 * before anything is trusted. On charge.success we open the learner's account
 * idempotently, re-checking the paid amount server-side.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  if (event.event === 'charge.success' && event.data) {
    const d = event.data as { reference?: string; amount?: number; currency?: string; id?: number | string };
    if (d.reference) {
      await fulfilLearnerPayment({
        reference: d.reference,
        paidAmountMinor: d.amount ?? 0,
        paidCurrency: d.currency ?? '',
        providerPaymentId: d.id != null ? String(d.id) : null,
      });
    }
  }

  // Always 200 so Paystack doesn't retry a handled (or irrelevant) event.
  return NextResponse.json({ received: true });
}
