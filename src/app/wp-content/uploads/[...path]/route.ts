import { NextResponse, type NextRequest } from 'next/server';

/**
 * Every old WordPress image address (/wp-content/uploads/…) keeps working, including links Google
 * already has. Images that have been copied are served from Supabase storage; anything not copied
 * yet still comes from the WordPress server, as long as WordPress is running somewhere else.
 */
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const WP_ORIGIN = (process.env.WP_ORIGIN ?? 'https://barodsglobal.com').replace(/\/$/, '');

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.map((p) => encodeURIComponent(decodeURIComponent(p))).join('/');

  if (SUPABASE) {
    const copied = `${SUPABASE}/storage/v1/object/public/wp-media/${path}`;
    const head = await fetch(copied, { method: 'HEAD', next: { revalidate: 3600 } }).catch(() => null);
    if (head?.ok) {
      return NextResponse.redirect(copied, { status: 308, headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } });
    }
  }

  // Not copied yet: fall back to WordPress, unless WordPress is this very site (after the domain move).
  if (new URL(WP_ORIGIN).host !== req.nextUrl.host) {
    return NextResponse.redirect(`${WP_ORIGIN}/wp-content/uploads/${path}`, { status: 307, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
  }
  return new NextResponse('Not found', { status: 404 });
}
