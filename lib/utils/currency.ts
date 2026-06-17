/**
 * Format cents to a dollar string.
 * Safe against non-finite values (NaN, Infinity).
 * Uses locale formatting with thousands separators for amounts >= $100.
 */
export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  if (Math.abs(cents) >= 100_00) {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format cents with a +/- prefix for activity lists. */
export function formatCentsSigned(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  const prefix = cents < 0 ? '-' : '+';
  return `${prefix}$${(Math.abs(cents) / 100).toFixed(2)}`;
}
