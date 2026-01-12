/**
 * Currency utility functions for handling Stripe amounts
 * Stripe uses cents, not dollars
 */

/**
 * Convert dollars to cents for Stripe API
 * @param dollars - Amount in dollars (e.g., 13.50)
 * @returns Amount in cents (e.g., 1350)
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars for display
 * @param cents - Amount in cents (e.g., 1350)
 * @returns Amount in dollars (e.g., 13.50)
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Format amount for display with currency symbol
 * @param cents - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted string (e.g., "$13.50")
 */
export const formatCurrency = (
  cents: number,
  currency: string = 'USD'
): string => {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
};

/**
 * Format amount in dollars (when amount is already in dollars)
 * @param dollars - Amount in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted string (e.g., "$13.50")
 */
export const formatDollars = (
  dollars: number,
  currency: string = 'USD'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
};

/**
 * Parse currency string to cents
 * @param currencyString - String like "$13.50" or "13.50"
 * @returns Amount in cents (e.g., 1350)
 */
export const parseCurrencyToCents = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^0-9.]/g, '');
  const dollars = parseFloat(cleaned);
  return dollarsToCents(dollars);
};
