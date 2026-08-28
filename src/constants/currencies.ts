/**
 * Supported billing currencies and the payment provider each routes to.
 * Adding a currency here (plus a plan_prices row and provider support) is all
 * that's needed to sell into a new market — no business logic changes.
 */
import type { ProviderName } from '@/lib/payments/types';

export interface CurrencyConfig {
  code: string;
  label: string;
  symbol: string;
  provider: ProviderName;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', provider: 'stripe' },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', provider: 'paystack' },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code: string): CurrencyConfig | undefined {
  return BY_CODE.get(code);
}

/** Which payment provider handles a given currency (defaults to Paystack). */
export function providerForCurrency(code: string): ProviderName {
  return BY_CODE.get(code)?.provider ?? 'paystack';
}

/** Rough country→currency default used to preselect currency at onboarding. */
export function defaultCurrencyForCountry(country?: string | null): string {
  if (!country) return 'USD';
  return country.toUpperCase() === 'NG' ? 'NGN' : 'USD';
}
