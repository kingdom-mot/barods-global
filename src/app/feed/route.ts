import { getPosts } from '@/lib/blog';
import { feedResponse, rss, SITE_URL } from '@/lib/rss';

export const revalidate = 1800; // refreshed every 30 minutes

/** Blog RSS feed: newest 30 posts. Also answers the old WordPress /feed address. */
export async function GET() {
  const posts = (await getPosts()).slice(0, 30);
  return feedResponse(
    rss({
      title: 'Barods Global Blog',
      link: `${SITE_URL}/blog`,
      self: `${SITE_URL}/feed`,
      description: 'Property advice, market news and guides from Barods Global Limited, Abeokuta.',
      items: posts.map((p) => ({
        title: p.title,
        link: `${SITE_URL}/blog/${p.slug}`,
        description: p.excerpt ?? '',
        date: p.publishedAt,
        image: p.coverUrl,
        category: p.category,
        author: p.author,
      })),
    }),
  );
}
