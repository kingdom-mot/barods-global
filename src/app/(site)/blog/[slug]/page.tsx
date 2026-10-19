import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import ShareBar from '@/components/ShareBar';
import { formatDate, getPost, getPosts, renderMarkdown } from '@/lib/blog';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPost(params.slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt ?? undefined,
    openGraph: { type: 'article', title: p.title, description: p.excerpt ?? undefined, images: p.coverUrl ? [p.coverUrl] : undefined, publishedTime: p.publishedAt },
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const all = await getPosts();
  const more = [...all.filter((p) => p.id !== post.id && p.category === post.category), ...all.filter((p) => p.id !== post.id && p.category !== post.category)].slice(0, 3);
  const initials = (post.author ?? 'Barods Global').split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <article>
      <header className="container-site max-w-4xl pb-8 pt-10 text-center sm:pt-14">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-green">Home</Link> › <Link href="/blog" className="hover:text-brand-green">Blog</Link>
          {post.category && <> › <Link href={`/blog?category=${encodeURIComponent(post.category.toLowerCase())}`} className="hover:text-brand-green">{post.category}</Link></>}
        </nav>
        {post.category && <span className="rounded-full bg-brand-greenLight px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-greenDark">{post.category}</span>}
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{post.excerpt}</p>}
        <div className="mt-7 flex items-center justify-center gap-3 text-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">{initials}</span>
          <span className="text-left">
            <span className="block font-semibold">{post.author ?? 'Barods Global'}</span>
            <span className="text-muted">{formatDate(post.publishedAt)} · {post.readMinutes} min read</span>
          </span>
        </div>
      </header>

      {post.coverUrl && (
        <div className="container-site max-w-6xl">
          <img src={post.coverUrl} alt="" className="aspect-[21/9] w-full rounded-3xl object-cover" />
        </div>
      )}

      <div className="container-site max-w-[720px] py-12">
        <div className="article" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        <div className="mt-12 border-t border-line pt-6">
          <ShareBar title={post.title} path={`/blog/${post.slug}`} />
        </div>
      </div>

      {more.length > 0 && (
        <section className="border-t border-line bg-paper py-16">
          <div className="container-site">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold">Keep reading</h2>
              <Link href="/blog" className="text-sm font-bold text-brand-greenDark hover:text-brand-green">All articles →</Link>
            </div>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
