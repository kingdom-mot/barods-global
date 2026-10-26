import Link from 'next/link';
import { formatDate, type Post } from '@/lib/blog';

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/blog/${post.slug}`} className="relative block overflow-hidden rounded-2xl bg-paper" tabIndex={-1} aria-hidden="true">
        {post.coverUrl ? (
          <img src={post.coverUrl} alt={post.title} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-brand-greenLight"><img src="/brand/icon.png" alt="" className="h-12 w-12 opacity-40" /></div>
        )}
        {post.category && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-ink shadow-sm">{post.category}</span>}
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">By {post.author} · {formatDate(post.publishedAt)} · {post.readMinutes} min read</p>
        <h3 className="mt-2 font-display text-2xl font-bold leading-tight">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-brand-greenDark">{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-[15px] text-muted">{post.excerpt}</p>}
        <Link href={`/blog/${post.slug}`} className="mt-4 text-sm font-bold text-brand-greenDark hover:text-brand-green">Read article →</Link>
      </div>
    </article>
  );
}
