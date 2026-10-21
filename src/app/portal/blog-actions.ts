'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requirePerm } from '@/lib/supabase/server';

export type PostInput = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  category: string;
  author: string;
  featured: boolean;
  intent: 'draft' | 'publish' | 'schedule';
  scheduleAt?: string | null; // ISO date-time for scheduled posts
};

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

export async function savePost(input: PostInput): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const me = await requirePerm('blog');
  const supabase = createClient();
  const title = input.title.trim();
  if (title.length < 5) return { ok: false, error: 'Add a title (at least 5 characters).' };
  if (input.intent !== 'draft' && input.body.trim().length < 50) return { ok: false, error: 'The article is too short to publish.' };
  const slug = slugify(input.slug || title);
  if (!slug) return { ok: false, error: 'Add a web address for the post.' };

  let status: 'draft' | 'published' | 'scheduled' = 'draft';
  let publishedAt: string | null = null;
  if (input.intent === 'publish') {
    status = 'published';
    publishedAt = new Date().toISOString();
  } else if (input.intent === 'schedule') {
    if (!input.scheduleAt || Number.isNaN(Date.parse(input.scheduleAt))) return { ok: false, error: 'Pick a date and time to schedule.' };
    if (Date.parse(input.scheduleAt) < Date.now() - 60_000) return { ok: false, error: 'The scheduled time is in the past.' };
    status = 'scheduled';
    publishedAt = new Date(input.scheduleAt).toISOString();
  }

  // Keep the original publish date when editing a live post.
  if (input.id && status === 'published') {
    const { data: prev } = await supabase.from('posts').select('status, published_at').eq('id', input.id).maybeSingle();
    if (prev?.status === 'published' && prev.published_at) publishedAt = prev.published_at;
  }

  const { data: clash } = await supabase.from('posts').select('id').eq('slug', slug).maybeSingle();
  if (clash && clash.id !== input.id) return { ok: false, error: 'Another post already uses this web address. Change the title or the address.' };

  const row = {
    title: title.slice(0, 200),
    slug,
    excerpt: input.excerpt.trim().slice(0, 400) || null,
    body: input.body.slice(0, 60000),
    cover_url: input.coverUrl,
    category: input.category || null,
    author: input.author.trim() || me.agent?.fullName || me.fullName,
    featured: input.featured,
    status,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  const res = input.id
    ? await supabase.from('posts').update(row).eq('id', input.id).select('id, slug').single()
    : await supabase.from('posts').insert(row).select('id, slug').single();
  if (res.error || !res.data) return { ok: false, error: res.error?.message ?? 'Couldn’t save the post.' };

  // Only one post leads the blog page at a time.
  if (input.featured) await supabase.from('posts').update({ featured: false }).neq('id', res.data.id).eq('featured', true);

  await supabase.from('activity_log').insert({ actor: me.id, action: `post ${status}`, entity: 'post', entity_id: res.data.id });
  revalidatePath('/blog');
  revalidatePath(`/blog/${res.data.slug}`);
  revalidatePath('/portal/blog');
  return { ok: true, id: res.data.id, slug: res.data.slug };
}

export async function deletePost(id: string) {
  const me = await requirePerm('blog');
  const supabase = createClient();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (!error) await supabase.from('activity_log').insert({ actor: me.id, action: 'post deleted', entity: 'post', entity_id: id });
  revalidatePath('/blog');
  revalidatePath('/portal/blog');
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}
