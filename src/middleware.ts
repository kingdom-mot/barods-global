import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_TO_CURRENCY } from '@/lib/currency';

// First visit: pick the currency from the visitor's country (Vercel header), ₦ by default.
// The header switcher overrides it by writing the same cookie.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get('currency')) {
    const country = req.headers.get('x-vercel-ip-country') ?? 'NG';
    res.cookies.set('currency', COUNTRY_TO_CURRENCY[country] ?? 'NGN', { path: '/', maxAge: 60 * 60 * 24 * 180 });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|api|brand|favicon.ico).*)'] };
