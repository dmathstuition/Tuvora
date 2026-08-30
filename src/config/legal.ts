/**
 * Legal / company details used across the policy pages.
 *
 * IMPORTANT: fill these in with your real registered details before launch, and
 * have the policy pages reviewed by a qualified lawyer for your jurisdiction —
 * they are a solid, plain-English starting point, not legal advice.
 */
export const legalConfig = {
  /** Trading/product name. */
  product: 'Tuvora',
  /** Registered legal entity that operates the service. */
  companyName: 'D-Maths Academy',
  /** Registered business address. */
  address: 'Infant Jesus Academy',
  /** Country whose laws govern the agreement. */
  jurisdiction: '[Asaba/ Delta]',
  /** General + role-specific contact addresses. */
  contactEmail: 'support@dmaths.academy',
  privacyEmail: 'support@dmaths.academy',
  supportEmail: 'support@dmaths.academy',
  /** Last time the legal documents were updated. */
  lastUpdated: 'August 30, 2026',
} as const;

export const LEGAL_PAGES = [
  { href: '/terms', title: 'Terms of Service' },
  { href: '/privacy', title: 'Privacy Policy' },
  { href: '/cookies', title: 'Cookie Policy' },
  { href: '/acceptable-use', title: 'Acceptable Use Policy' },
] as const;
