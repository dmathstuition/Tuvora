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
 * Paystack provider adapter (architecture-complete stub).
 *
 * Paystack uses an HMAC-SHA512 signature of the raw body with the secret key in
 * the `x-paystack-signature` header — verifyAndParseWebhook will implement that
 * check. Kept SDK-free for now; see StripeProvider for the same rationale.
 */
export class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack' as const;

  constructor(private readonly secretKey: string) {}

  async createCustomer(_input: CreateCustomerInput): Promise<{ customerId: string }> {
    throw new Error('PaystackProvider.createCustomer not yet implemented');
  }

  async createCheckout(_input: CreateCheckoutInput): Promise<CheckoutSession> {
    throw new Error('PaystackProvider.createCheckout not yet implemented');
  }

  async getSubscription(_id: string): Promise<ProviderSubscription> {
    throw new Error('PaystackProvider.getSubscription not yet implemented');
  }

  async cancelSubscription(_id: string): Promise<void> {
    throw new Error('PaystackProvider.cancelSubscription not yet implemented');
  }

  async pauseSubscription(_id: string): Promise<void> {
    throw new Error('PaystackProvider.pauseSubscription not yet implemented');
  }

  async resumeSubscription(_id: string): Promise<void> {
    throw new Error('PaystackProvider.resumeSubscription not yet implemented');
  }

  async verifyAndParseWebhook(
    _rawBody: string,
    _signature: string | null,
  ): Promise<NormalizedWebhookEvent> {
    // TODO: verify HMAC-SHA512(rawBody, secretKey) === signature, then normalize.
    throw new Error('PaystackProvider.verifyAndParseWebhook not yet implemented');
  }
}
