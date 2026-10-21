import BlogEditor from '@/components/portal/BlogEditor';
import { BLOG_CATEGORIES } from '@/lib/blog';
import { requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'New post' };

export default async function NewPostPage() {
  const me = await requirePerm('blog');
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-display text-4xl">New post</h1>
      <BlogEditor
        userId={me.id}
        categories={BLOG_CATEGORIES}
        initial={{ title: '', slug: '', excerpt: '', body: '', coverUrl: null, category: '', author: me.agent?.fullName ?? me.fullName, featured: false }}
      />
    </div>
  );
}
