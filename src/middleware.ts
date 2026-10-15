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
      to.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
      return NextResponse.redirect(to);
    }
    if (isLogin && user) {
      const to = req.nextUrl.clone();
      to.pathname = '/portal';
      to.search = '';
      return NextResponse.redirect(to);
    }
  }

  if (!req.cookies.get('currency')) {
    const country = req.headers.get('x-vercel-ip-country') ?? 'NG';
    res.cookies.set('currency', COUNTRY_TO_CURRENCY[country] ?? 'NGN', { path: '/', maxAge: 60 * 60 * 24 * 180 });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|api|auth|brand|favicon.ico).*)'] };
