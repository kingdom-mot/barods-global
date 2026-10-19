import { cache } from 'react';
import { supabase } from './data';

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  category: string | null;
  author: string | null;
  publishedAt: string;
  featured: boolean;
  readMinutes: number;
};

export const BLOG_CATEGORIES = ['Buying', 'Renting', 'Investment', 'Construction', 'Market news', 'Company news'];

export { renderMarkdown } from './markdown';

function toPost(r: Record<string, unknown>): Post {
  const body = String(r.body ?? '');
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    excerpt: (r.excerpt as string) ?? null,
    body,
    coverUrl: (r.cover_url as string) ?? null,
    category: (r.category as string) ?? null,
    author: (r.author as string) ?? null,
    publishedAt: String(r.published_at ?? r.created_at ?? new Date().toISOString()),
    featured: Boolean(r.featured),
    readMinutes: Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200)),
  };
}

/** Live posts, newest first. Row-level security already hides drafts and future scheduled posts. */
export const getPosts = cache(async (): Promise<Post[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('posts').select('*').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(200);
    if (error || !data) return [];
    return data.map(toPost);
  } catch {
    return [];
  }
});

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}

export const formatDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
