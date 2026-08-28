import 'server-only';
import type {
  PaymentProvider,
  CreateCustomerInput,
  CreateCheckoutInput,
  CheckoutSession,
  ProviderSubscription,
  NormalizedWebhookEvent,
} from '@/lib/payments/types';

/**
 * Stripe provider adapter.
 *
 * This is an architecture-complete stub: it implements the PaymentProvider
 * contract with the correct shape and TODOs where the Stripe SDK calls go. The
 * `stripe` package is added when the integration is wired; keeping the adapter
 * SDK-free here means the rest of the app already compiles against the
 * abstraction. Do not put business logic in adapters.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;

  constructor(private readonly secretKey: string) {}

  async createCustomer(_input: CreateCustomerInput): Promise<{ customerId: string }> {
    throw new Error('StripeProvider.createCustomer not yet implemented');
  }

  async createCheckout(_input: CreateCheckoutInput): Promise<CheckoutSession> {
    throw new Error('StripeProvider.createCheckout not yet implemented');
  }

  async getSubscription(_id: string): Promise<ProviderSubscription> {
    throw new Error('StripeProvider.getSubscription not yet implemented');
  }

  async cancelSubscription(_id: string): Promise<void> {
    throw new Error('StripeProvider.cancelSubscription not yet implemented');
  }

  async pauseSubscription(_id: string): Promise<void> {
    throw new Error('StripeProvider.pauseSubscription not yet implemented');
  }

  async resumeSubscription(_id: string): Promise<void> {
    throw new Error('StripeProvider.resumeSubscription not yet implemented');
  }

  async verifyAndParseWebhook(
    _rawBody: string,
    _signature: string | null,
  ): Promise<NormalizedWebhookEvent> {
    // TODO: stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    throw new Error('StripeProvider.verifyAndParseWebhook not yet implemented');
  }
}
