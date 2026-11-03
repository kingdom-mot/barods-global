import { formatPrice } from '@/lib/currency';
import { searchProperties } from '@/lib/data';
import { describeProperty } from '@/lib/describe';
import { feedResponse, rss, SITE_URL } from '@/lib/rss';

export const revalidate = 1800; // refreshed every 30 minutes

/** New listings RSS feed: the 40 newest available listings, newest first (for auto-posting to social media). */
export async function GET() {
  const live = (await searchProperties({ sort: 'newest' }))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 40);
  return feedResponse(
    rss({
      title: 'Barods Global: New Properties',
      link: `${SITE_URL}/properties`,
      self: `${SITE_URL}/properties/feed`,
      description: 'The newest homes, land and commercial property listed by Barods Global across Nigeria and South Africa.',
      items: live.map((p) => {
        const price = p.price === null ? 'Price on request' : formatPrice(p.price, p.currency, p.pricePeriod, p.currency).main;
        const where = [p.area, p.city, p.state].filter(Boolean).join(', ');
        return {
          title: `${p.title} · ${price}`,
          link: `${SITE_URL}/property/${p.slug}`,
          description: `${describeProperty(p)}. ${price}.${where ? ` Location: ${where}.` : ''} Ref ${p.ref}.`,
          date: p.publishedAt,
          image: p.photos[0] ?? null,
          category: p.purpose === 'rent' ? 'For Rent' : p.purpose === 'shortlet' ? 'Shortlet' : 'For Sale',
        };
      }),
    }),
  );
}
