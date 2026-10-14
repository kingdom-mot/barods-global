import { cookies, headers } from 'next/headers';
import { COUNTRY_TO_CURRENCY, isCurrency, type CurrencyCode } from './currency';

export function getVisitorCurrency(): CurrencyCode {
  const fromCookie = cookies().get('currency')?.value;
  if (isCurrency(fromCookie)) return fromCookie;
  const country = headers().get('x-vercel-ip-country') ?? 'NG';
  return COUNTRY_TO_CURRENCY[country] ?? 'NGN';
}
