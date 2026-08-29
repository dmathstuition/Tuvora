import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a minor-unit amount (cents) into a localized currency string.
 * Money is stored in minor units everywhere; only format at the edge.
 */
export function formatMoney(
  amountMinor: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  const amount = amountMinor / 100;
  // A missing or invalid ISO-4217 code would make Intl throw a RangeError and
  // crash whatever is rendering the price. Never let a bad currency take down
  // the page — fall back to a plain, code-prefixed amount.
  const code = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

/** Turn a display name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
