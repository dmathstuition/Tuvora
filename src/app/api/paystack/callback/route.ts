import { NextResponse, type NextRequest } from 'next/server';
import { verifyTransaction } from '@/lib/paystack/client';
import { fulfilLearnerPayment } from '@/lib/paystack/fulfilment';

/**
 * Where Paystack sends the admin back after checkout. We verify the transaction
 * server-side (defense in depth alongside the webhook) and, on success, open the
 * learner's account before redirecting back to the learners list.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(`${origin}/dashboard/learners?payment=failed`);
  }

  try {
    const result = await verifyTransaction(reference);
    if (result.success) {
      await fulfilLearnerPayment({
        reference: result.reference,
        paidAmountMinor: result.amountMinor,
        paidCurrency: result.currency,
        providerPaymentId: result.providerPaymentId,
      });
      return NextResponse.redirect(`${origin}/dashboard/learners?payment=success`);
    }
  } catch {
    // fall through to the failure redirect
  }

  return NextResponse.redirect(`${origin}/dashboard/learners?payment=failed`);
}
