/**
 * Payment provider abstraction.
 *
 * Business logic depends ONLY on this interface, never on Stripe or Paystack
 * directly. Adding a new provider means implementing PaymentProvider — no
 * changes to subscription/entitlement code. Webhook handling is normalized to a
 * provider-agnostic event so downstream processing is identical.
 */

export type ProviderName = 'stripe' | 'paystack';

export interface CreateCustomerInput {
  organizationId: string;
  email: string;
  name?: string;
}

export interface CreateCheckoutInput {
  organizationId: string;
  planId: string;
  interval: 'monthly' | 'yearly';
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  /** Additional learner seats to bill beyond the plan's included allowance. */
  extraSeats?: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface ProviderSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * A provider webhook normalized into a canonical shape. `dedupeKey` (provider
 * event id) drives idempotency: it is stored in billing_events with a UNIQUE
 * constraint so a replayed webhook is a no-op.
 */
export type NormalizedEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'unknown';

export interface NormalizedWebhookEvent {
  provider: ProviderName;
  dedupeKey: string;
  type: NormalizedEventType;
  organizationId?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: ProviderName;

  createCustomer(input: CreateCustomerInput): Promise<{ customerId: string }>;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getSubscription(providerSubscriptionId: string): Promise<ProviderSubscription>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  pauseSubscription(providerSubscriptionId: string): Promise<void>;
  resumeSubscription(providerSubscriptionId: string): Promise<void>;

  /**
   * Verify a raw webhook (signature check) and normalize it. Implementations
   * MUST reject invalid signatures by throwing.
   */
  verifyAndParseWebhook(rawBody: string, signature: string | null): Promise<NormalizedWebhookEvent>;
}
