import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverEnv } from '@/lib/env';

/**
 * Focused Paystack client for one-off per-learner charges.
 *
 * Security model:
 *  - The SECRET key never leaves the server; the browser is only ever sent a
 *    Paystack-hosted `authorization_url` to redirect to.
 *  - Amounts and metadata are set here from a server-created payment row, never
 *    from the client, and re-checked on verify/webhook.
 *  - Webhooks are authenticated by an HMAC-SHA512 signature of the raw body.
 */

const PAYSTACK_API = 'https://api.paystack.co';

export function paystackConfigured(): boolean {
  return !!serverEnv().PAYSTACK_SECRET_KEY;
}

function secret(): string {
  const key = serverEnv().PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('Paystack is not configured (PAYSTACK_SECRET_KEY missing).');
  return key;
}

export interface InitializeInput {
  email: string;
  /** Amount in the currency's minor unit (kobo for NGN). */
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

export interface InitializeResult {
  authorizationUrl: string;
  reference: string;
}

/** Create a transaction and get the hosted checkout URL to redirect to. */
export async function initializeTransaction(input: InitializeInput): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    cache: 'no-store',
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message ?? 'Could not start the payment.');
  }
  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference ?? input.reference };
}

export interface VerifyResult {
  success: boolean;
  amountMinor: number;
  currency: string;
  reference: string;
  providerPaymentId: string | null;
  metadata: Record<string, unknown>;
}

/** Server-side verification of a transaction by its reference. */
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: 'no-store',
  });
  const json = (await res.json()) as {
    status?: boolean;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      reference?: string;
      id?: number | string;
      metadata?: Record<string, unknown>;
    };
  };
  const d = json.data ?? {};
  return {
    success: !!json.status && d.status === 'success',
    amountMinor: d.amount ?? 0,
    currency: d.currency ?? '',
    reference: d.reference ?? reference,
    providerPaymentId: d.id != null ? String(d.id) : null,
    metadata: d.metadata ?? {},
  };
}

/**
 * Verify a Paystack webhook: signature = HMAC-SHA512(rawBody, secretKey), sent
 * in the `x-paystack-signature` header. Constant-time comparison.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const key = serverEnv().PAYSTACK_WEBHOOK_SECRET || serverEnv().PAYSTACK_SECRET_KEY;
  if (!key) return false;
  const expected = createHmac('sha512', key).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
