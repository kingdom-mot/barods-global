import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_TO_CURRENCY } from '@/lib/currency';

type CookieList = { name: string; value: string; options: CookieOptions }[];

/**
 * 1. First visit: pick the currency from the visitor's country (Vercel header), ₦ by default.
 * 2. Portal pages: keep the Supabase sign-in fresh and send signed-out visitors to /login.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const isPortal = req.nextUrl.pathname.startsWith('/portal');
  const isLogin = req.nextUrl.pathname === '/login';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((isPortal || isLogin) && url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: CookieList) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    if (isPortal && !user) {
      const to = req.nextUrl.clone();
      to.pathname = '/login';
      to.search = '';
      return NextResponse.redirect(to);
    }
    if (isLogin && user) {
      const to = req.nextUrl.clone();
      to.pathname = '/portal';
      to.search = '';
      return NextResponse.redirect(to);
    }
  }

  // Only barodsglobal.com goes in search results; the temporary vercel.app address stays out of them.
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').replace(/^www\./, '').split(':')[0];
  if (host !== 'barodsglobal.com' || isPortal || isLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');

  // Never let the browser keep portal pages: after signing out, Back can't show them again.
  if (isPortal) res.headers.set('Cache-Control', 'private, no-store, max-age=0');

  if (!req.cookies.get('currency')) {
    const country = req.headers.get('x-vercel-ip-country') ?? 'NG';
    res.cookies.set('currency', COUNTRY_TO_CURRENCY[country] ?? 'NGN', { path: '/', maxAge: 60 * 60 * 24 * 180 });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|api|auth|brand|wp-content|search-result|favicon.ico|sitemap.xml|robots.txt).*)'] };
