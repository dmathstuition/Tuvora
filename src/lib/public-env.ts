/** Public (browser-safe) environment values. Only NEXT_PUBLIC_* belong here. */

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Tuvoria',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  defaultPaymentProvider: (process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER ?? 'paystack') as
    | 'paystack'
    | 'stripe',
} as const;
