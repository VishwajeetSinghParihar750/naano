/** Format integer USD cents as a currency string (e.g. $65.00). */
export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Cents → decimal string for a number input (e.g. 6500 → "65.00"). */
export function centsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * USD input string → integer cents. Accepts comma or dot decimals.
 * Invalid / negative → 0.
 */
export function euroInputToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
