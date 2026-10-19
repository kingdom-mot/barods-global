import type { Metadata } from 'next';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { BLOG_CATEGORIES, formatDate, getPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog: Property Insights and News',
  description: 'Guides on buying, renting and investing in Nigerian property, plus news from Barods Global.',
};

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const all = await getPosts();
  const category = BLOG_CATEGORIES.find((c) => c.toLowerCase() === searchParams.category?.toLowerCase());
  const posts = category ? all.filter((p) => p.category === category) : all;
  const lead = category ? undefined : (posts.find((p) => p.featured) ?? posts[0]);
  const rest = posts.filter((p) => p !== lead);
  const used = new Set(all.map((p) => p.category).filter(Boolean));

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-site py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-green">Barods Insights</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl">Property insights, guides and news</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">Practical advice on buying, renting and investing in Nigerian property, from the Barods Global team.</p>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
            <Link href="/blog" className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${!category ? 'bg-brand-ink text-white' : 'bg-white text-brand-ink ring-1 ring-line hover:ring-brand-green'}`}>All</Link>
            {BLOG_CATEGORIES.filter((c) => used.has(c)).map((c) => (
              <Link
                key={c}
                href={`/blog?category=${encodeURIComponent(c.toLowerCase())}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${category === c ? 'bg-brand-ink text-white' : 'bg-white text-brand-ink ring-1 ring-line hover:ring-brand-green'}`}
              >
                {c}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-site py-14">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-line p-12 text-center">
            <img src="/brand/icon.png" alt="" className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="font-display text-2xl font-bold">New articles are on the way</p>
            <p className="mt-2 text-muted">Check back soon for guides on buying, renting and investing.</p>
          </div>
        ) : (
          <>
            {lead && (
              <article className="group mb-16 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
                <Link href={`/blog/${lead.slug}`} className="block overflow-hidden rounded-3xl bg-paper" tabIndex={-1} aria-hidden="true">
                  {lead.coverUrl ? (
                    <img src={lead.coverUrl} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="aspect-[16/10] w-full bg-brand-greenLight" />
                  )}
                </Link>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <span className="rounded-full bg-brand-green px-3 py-1 text-white">Featured</span>
                    {lead.category && <span className="rounded-full bg-paper px-3 py-1 text-brand-ink">{lead.category}</span>}
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                    <Link href={`/blog/${lead.slug}`} className="transition-colors hover:text-brand-greenDark">{lead.title}</Link>
                  </h2>
                  {lead.excerpt && <p className="mt-4 text-lg text-muted">{lead.excerpt}</p>}
                  <p className="mt-5 text-sm text-muted">
                    <span className="font-semibold text-brand-ink">{lead.author ?? 'Barods Global'}</span> · {formatDate(lead.publishedAt)} · {lead.readMinutes} min read
                  </p>
                  <Link href={`/blog/${lead.slug}`} className="btn-green mt-6 px-6">Read article</Link>
                </div>
              </article>
            )}
            {rest.length > 0 && (
              <>
                {lead && <h2 className="mb-8 font-display text-3xl font-bold">Latest articles</h2>}
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <section className="container-site pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-ink p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-display text-3xl font-bold">Ready to find your next property?</h2>
            <p className="mt-2 text-white/75">Browse verified listings or talk to a Barods agent today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/properties" className="btn-green px-6">Browse properties</Link>
            <Link href="/contact-us" className="btn border border-white/30 px-6 text-white hover:bg-white hover:text-brand-ink">Talk to an agent</Link>
          </div>
        </div>
      </section>
    </>
  );
}
