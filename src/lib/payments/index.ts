import 'server-only';
import type { PaymentProvider, ProviderName } from './types';
import { StripeProvider } from './providers/stripe';
import { PaystackProvider } from './providers/paystack';

/**
 * Provider factory. Business logic calls getPaymentProvider() and depends only
 * on the PaymentProvider interface — swapping or adding providers never touches
 * subscription/entitlement code.
 */
export function getPaymentProvider(name?: ProviderName): PaymentProvider {
  const provider =
    name ?? (process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER as ProviderName) ?? 'paystack';

  switch (provider) {
    case 'stripe':
      return new StripeProvider(process.env.STRIPE_SECRET_KEY ?? '');
    case 'paystack':
      return new PaystackProvider(process.env.PAYSTACK_SECRET_KEY ?? '');
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

export * from './types';
