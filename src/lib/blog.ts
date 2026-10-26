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

/** Markdown → plain words (for summaries and reading time). */
function plain(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/gm, '')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A one-line summary for posts saved without one: the opening sentence, at most ~160 characters. */
function summarise(md: string) {
  const text = plain(md);
  const first = text.match(/^.{40,200}?[.!?](\s|$)/)?.[0]?.trim() ?? text;
  if (first.length <= 170) return first;
  const cut = first.slice(0, 160);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

const KEEP_UPPER = new Set(['BQ', 'GRA', 'NHF', 'FCT', 'C', 'O', 'CofO', 'LGA', 'ROI', 'UK', 'US', 'USA', 'UAE', 'FAQ', 'FAQS', 'II', 'III', 'IV']);
const KEEP_LOWER = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with', 'from']);
/** Titles typed in ALL CAPS are shown in normal title case, so every post looks the same. */
function tidyTitle(t: string) {
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length < 8 || letters !== letters.toUpperCase()) return t;
  return t
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => {
      const bare = w.replace(/[^a-z]/gi, '');
      if (KEEP_UPPER.has(bare.toUpperCase()) && bare.length > 1) return w.toUpperCase();
      if (i > 0 && KEEP_LOWER.has(bare)) return w;
      return w.replace(/[a-z]/, (c) => c.toUpperCase());
    })
    .join('');
}

function toPost(r: Record<string, unknown>): Post {
  const body = String(r.body ?? '');
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: tidyTitle(String(r.title)),
    excerpt: ((r.excerpt as string) ?? '').trim() || (body ? summarise(body) : null),
    body,
    coverUrl: (r.cover_url as string) ?? null,
    category: (r.category as string) ?? null,
    author: ((r.author as string) ?? '').trim() || 'Barods Global',
    publishedAt: String(r.published_at ?? r.created_at ?? new Date().toISOString()),
    featured: Boolean(r.featured),
    readMinutes: Math.max(1, Math.ceil(plain(body).split(' ').filter(Boolean).length / 220)),
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
