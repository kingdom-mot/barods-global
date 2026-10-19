import Link from 'next/link';
import { createClient, requireStaff } from '@/lib/supabase/server';

export const metadata = { title: 'Blog' };

const STATUS: Record<string, string> = {
  published: 'bg-brand-greenLight text-brand-greenDark',
  scheduled: 'bg-amber-100 text-amber-900',
  draft: 'bg-line text-brand-ink',
};

export default async function PortalBlogPage() {
  await requireStaff();
  const { data: posts } = await createClient()
    .from('posts')
    .select('id, slug, title, category, status, published_at, updated_at, featured, cover_url')
    .order('updated_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Blog</h1>
          <p className="text-sm text-muted">Write, schedule and update articles on barodsglobal.com/blog.</p>
        </div>
        <Link href="/portal/blog/new" className="btn-green px-6">+ New post</Link>
      </div>
      {!posts || posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">No posts yet.</p>
          <Link href="/portal/blog/new" className="btn-green mt-4">Write the first post</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const live = p.status === 'scheduled' && p.published_at && new Date(p.published_at) <= new Date();
            const status = live ? 'published' : p.status;
            return (
              <li key={p.id} className="flex items-center gap-4 rounded-xl border border-line bg-white p-3">
                {p.cover_url ? <img src={p.cover_url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-24 shrink-0 rounded-lg bg-paper" />}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${STATUS[status] ?? STATUS.draft}`}>{status === 'published' ? 'Live' : status === 'scheduled' ? 'Scheduled' : 'Draft'}</span>
                    {p.featured && <span className="badge bg-brand-orange text-white">Featured</span>}
                    {p.category && <span className="text-xs text-muted">{p.category}</span>}
                  </div>
                  <Link href={`/portal/blog/${p.id}`} className="block truncate font-semibold hover:text-brand-greenDark">{p.title}</Link>
                  <p className="text-xs text-muted">
                    {status === 'scheduled' && p.published_at
                      ? `Goes live ${new Date(p.published_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
                      : `Updated ${new Date(p.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {status === 'published' && <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-green">View</Link>}
                  <Link href={`/portal/blog/${p.id}`} className="rounded-md bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-greenDark">Edit</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
