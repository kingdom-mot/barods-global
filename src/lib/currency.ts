// Visitor currency: set from Vercel's country header in middleware.ts, ₦ by default.
// Rates are units of the currency per ₦1 (replaced by the currency_rates table once live).
/**
 * Visitor's country from whichever network sits in front of the site:
 * Vercel, Cloudflare, or a CDN that forwards a country code. Unknown → Nigeria.
 */
export function countryFrom(h: { get(name: string): string | null }): string {
  const c = h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry') ?? h.get('x-country-code') ?? h.get('x-geo-country') ?? '';
  return /^[A-Z]{2}$/i.test(c) && c.toUpperCase() !== 'XX' ? c.toUpperCase() : 'NG';
}

export const CURRENCIES = {
  NGN: { symbol: '₦', perNgn: 1, label: 'NGN' },
  ZAR: { symbol: 'R', perNgn: 0.0118, label: 'ZAR' },
  USD: { symbol: '$', perNgn: 0.00065, label: 'USD' },
  GBP: { symbol: '£', perNgn: 0.0005, label: 'GBP' },
  EUR: { symbol: '€', perNgn: 0.0006, label: 'EUR' },
  CAD: { symbol: 'C$', perNgn: 0.0009, label: 'CAD' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Live rates (units per ₦1) loaded from the database each day; the numbers above are the fallback.
let LIVE: Partial<Record<CurrencyCode, number>> = {};
export function applyRates(r: Record<string, number>) {
  const next: Partial<Record<CurrencyCode, number>> = {};
  for (const [k, v] of Object.entries(r)) if (isCurrencyKey(k) && Number.isFinite(v) && v > 0) next[k] = v;
  LIVE = { ...LIVE, ...next };
}
function isCurrencyKey(k: string): k is CurrencyCode {
  return k in CURRENCIES;
}
/** Units of `code` per ₦1, using today's rate when known. */
export function perNgn(code: CurrencyCode, rates?: Partial<Record<string, number>>): number {
  if (code === 'NGN') return 1;
  return rates?.[code] ?? LIVE[code] ?? CURRENCIES[code].perNgn;
}

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
  const inNgn = price / perNgn(listingCurrency);
  const converted = inNgn * perNgn(visitor);
  return { main: `≈ ${fmt(Math.round(converted), visitor)}${suffix}`, original: fmt(price, listingCurrency) + suffix };
}
