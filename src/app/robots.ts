import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/portal', '/login', '/auth', '/api'] },
    sitemap: 'https://barodsglobal.com/sitemap.xml',
  };
}
