import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

const PRIMARY = 'barodsglobal.com';

/**
 * barodsglobal.com: every search engine may crawl the whole public site.
 * Any other address (the temporary vercel.app one, previews): keep it out of search results,
 * so it never competes with the real domain.
 */
export default function robots(): MetadataRoute.Robots {
  const host = (headers().get('x-forwarded-host') ?? headers().get('host') ?? '').replace(/^www\./, '').split(':')[0];
  if (host !== PRIMARY) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/portal', '/login', '/auth', '/api', '/search-result'] }],
    sitemap: `https://${PRIMARY}/sitemap.xml`,
    host: `https://${PRIMARY}`,
  };
}
