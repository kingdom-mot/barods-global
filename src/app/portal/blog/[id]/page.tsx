import { notFound } from 'next/navigation';
import BlogEditor from '@/components/portal/BlogEditor';
import { BLOG_CATEGORIES } from '@/lib/blog';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Edit post' };

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const me = await requirePerm('blog');
  const { data: p } = await createClient().from('posts').select('*').eq('id', params.id).maybeSingle();
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-display text-4xl">Edit post</h1>
      <BlogEditor
        userId={me.id}
        categories={BLOG_CATEGORIES}
        initial={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? '',
          body: p.body ?? '',
          coverUrl: p.cover_url,
          category: p.category ?? '',
          author: p.author ?? '',
          featured: Boolean(p.featured),
          status: p.status,
          publishedAt: p.published_at,
        }}
      />
    </div>
  );
}
