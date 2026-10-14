// Visitor currency: set from Vercel's country header in middleware.ts, ₦ by default.
// Rates are units of the currency per ₦1 (replaced by the currency_rates table once live).
export const CURRENCIES = {
  NGN: { symbol: '₦', perNgn: 1, label: 'NGN' },
  ZAR: { symbol: 'R', perNgn: 0.0118, label: 'ZAR' },
  USD: { symbol: '$', perNgn: 0.00065, label: 'USD' },
  GBP: { symbol: '£', perNgn: 0.0005, label: 'GBP' },
  EUR: { symbol: '€', perNgn: 0.0006, label: 'EUR' },
  CAD: { symbol: 'C$', perNgn: 0.0009, label: 'CAD' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  NG: 'NGN', ZA: 'ZAR', US: 'USD', GB: 'GBP', CA: 'CAD',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR', FI: 'EUR',
};

export function isCurrency(v: string | undefined): v is CurrencyCode {
  return !!v && v in CURRENCIES;
}

function fmt(amount: number, code: CurrencyCode) {
  const { symbol } = CURRENCIES[code];
  const digits = code === 'NGN' ? 0 : amount >= 1000 ? 0 : 2;
  return `${symbol}${amount.toLocaleString('en-NG', { maximumFractionDigits: digits })}`;
}

const PERIOD: Record<string, string> = { once: '', year: '/year', month: '/month', night: '/night' };

/** Price in the visitor's currency, plus the original when converted. */
export function formatPrice(
  price: number | null,
  listingCurrency: 'NGN' | 'ZAR',
  period: string,
  visitor: CurrencyCode,
): { main: string; original?: string } {
  if (price === null) return { main: 'POA' };
  const suffix = PERIOD[period] ?? '';
  if (visitor === listingCurrency) return { main: fmt(price, visitor) + suffix };
  const inNgn = price / CURRENCIES[listingCurrency].perNgn;
  const converted = inNgn * CURRENCIES[visitor].perNgn;
  return { main: `≈ ${fmt(Math.round(converted), visitor)}${suffix}`, original: fmt(price, listingCurrency) + suffix };
}
