/**
 * Currency symbols + formatting helpers used across the app.
 */

export const CURRENCIES = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
]

export function getCurrencySymbol(code) {
  const c = CURRENCIES.find((x) => x.code === code)
  return c?.symbol || '$'
}

export function getCurrencyLabel(code) {
  const c = CURRENCIES.find((x) => x.code === code)
  return c?.label || 'US Dollar'
}

/**
 * Format a salary range with the correct currency symbol.
 * Returns e.g. "₦500,000 – ₦800,000" or "$60,000 – $90,000".
 */
export function formatSalaryRange(currency, min, max) {
  const symbol = getCurrencySymbol(currency)
  const fmt = (n) => (typeof n === 'number' && !isNaN(n) ? n.toLocaleString() : null)
  const minStr = fmt(min)
  const maxStr = fmt(max)
  if (!minStr && !maxStr) return ''
  if (minStr && maxStr) return `${symbol}${minStr} – ${symbol}${maxStr}`
  if (minStr) return `${symbol}${minStr}+`
  return `Up to ${symbol}${maxStr}`
}

/**
 * Format a single amount with symbol. Returns "₦500,000" or "—".
 */
export function formatAmount(currency, amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '—'
  return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`
}