import type { MetadataRoute } from 'next';
import { services } from '@/lib/content';
import { getPosts } from '@/lib/blog';
import { getAgents, searchProperties } from '@/lib/data';

const BASE = 'https://barodsglobal.com';

/** Tells Google about every page, so the new site is indexed quickly after the move. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, agents, posts] = await Promise.all([searchProperties({ status: 'all' }), getAgents(), getPosts()]);
  const pages = ['', '/properties', '/agents', '/about-us', '/our-services', '/contact-us', '/blog'].map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'weekly' as const, priority: p ? 0.7 : 1 }));
  return [
    ...pages,
    ...services.map((s) => ({ url: `${BASE}/our-services/${s.slug}`, priority: 0.6 })),
    ...properties.map((p) => ({ url: `${BASE}/property/${p.slug}`, lastModified: p.updatedAt ?? p.publishedAt, priority: 0.8 })),
    ...agents.map((a) => ({ url: `${BASE}/agent/${a.slug}`, priority: 0.5 })),
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}`, lastModified: p.publishedAt, priority: 0.6 })),
  ];
}
