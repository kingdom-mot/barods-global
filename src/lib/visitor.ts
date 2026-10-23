import { cookies, headers } from 'next/headers';
import { COUNTRY_TO_CURRENCY, countryFrom, isCurrency, type CurrencyCode } from './currency';

export function getVisitorCurrency(): CurrencyCode {
  const fromCookie = cookies().get('currency')?.value;
  if (isCurrency(fromCookie)) return fromCookie;
  const country = countryFrom(headers());
  return COUNTRY_TO_CURRENCY[country] ?? 'NGN';
}
