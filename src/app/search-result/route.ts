import { NextResponse, type NextRequest } from 'next/server';

/** Old Houzez search links (/search-result/?status=for-sale&location=…) → the new search page. */
export function GET(req: NextRequest) {
  const old = req.nextUrl.searchParams;
  const q = new URLSearchParams();
  const first = (...keys: string[]) => keys.map((k) => old.get(k) ?? old.getAll(`${k}[]`)[0]).find(Boolean);

  const status = first('status') ?? '';
  if (/rent/.test(status)) q.set('purpose', 'rent');
  else if (/short/.test(status)) q.set('purpose', 'shortlet');
  else if (/sale|buy/.test(status)) q.set('purpose', 'sale');
  const location = first('location', 'areas', 'area', 'city', 'state');
  if (location) q.set('location', location.replace(/-/g, ' '));
  const keyword = first('keyword', 'property_id');
  if (keyword) q.set('q', keyword);
  const beds = first('bedrooms', 'min-beds');
  if (beds) q.set('beds', beds.replace(/[^0-9]/g, ''));
  const baths = first('bathrooms', 'min-baths');
  if (baths) q.set('baths', baths.replace(/[^0-9]/g, ''));
  const min = first('min-price');
  if (min) q.set('minPrice', min.replace(/[^0-9]/g, ''));
  const max = first('max-price');
  if (max) q.set('maxPrice', max.replace(/[^0-9]/g, ''));
  const type = first('type');
  if (type) q.set('type', type);

  const to = req.nextUrl.clone();
  to.pathname = '/properties';
  to.search = q.toString();
  return NextResponse.redirect(to, 308);
}
