/**
 * Shared formatting utilities — single source of truth.
 * Import from here instead of defining local copies in each page.
 */

/** Format a USD price.  Handles null/undefined and sub-cent values. */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "$0.00";
  if (price > 0 && price < 0.01) return `$${price}`;
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a percentage with a +/- prefix.  Default: 2 decimal places. */
export function formatPercent(num: number, decimals = 2): string {
  return `${num > 0 ? "+" : ""}${num.toFixed(decimals)}%`;
}
