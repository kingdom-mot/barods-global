import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/blog';
import { getAgents, searchProperties } from '@/lib/data';
import { getServices } from '@/lib/settings';

const BASE = 'https://barodsglobal.com';
export const revalidate = 3600; // refreshed hourly, so new listings and posts appear quickly

/** Every public page, for Google, Bing and the rest. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, agents, posts, services] = await Promise.all([searchProperties({ status: 'all' }), getAgents(), getPosts(), getServices()]);
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'daily', priority: 1, lastModified: now },
    { url: `${BASE}/properties`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/properties?purpose=sale`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/properties?purpose=rent`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/properties?purpose=shortlet`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/agents`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/about-us`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/our-services`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact-us`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  return [
    ...pages,
    ...services.map((s) => ({ url: `${BASE}/our-services/${s.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...properties.map((p) => ({
      url: `${BASE}/property/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt,
      changeFrequency: 'weekly' as const,
      priority: p.availability === 'sold' || p.availability === 'let' ? 0.4 : 0.8,
      images: p.photos.slice(0, 5).map((u) => (u.startsWith('http') ? u : `${BASE}${u}`)),
    })),
    ...agents.map((a) => ({ url: `${BASE}/agent/${a.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}`, lastModified: p.publishedAt, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
