import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchForm from '@/components/SearchForm';
import { formatDate, getPosts } from '@/lib/blog';
import { cities } from '@/lib/content';
import { getAgents, getCityCounts, getFeatured } from '@/lib/data';
import { getHero, getPartners, getTeam, loadRates } from '@/lib/settings';
import { getVisitorCurrency } from '@/lib/visitor';

const reviews = [
  { name: 'Adekola Alagbe', stars: 4, text: 'Great people, no gimmicks. What you see is what you get.' },
  { name: 'Kehinde Opemipo', stars: 5, text: 'Hands down the best real estate company in Abeokuta you could ask for.' },
  { name: 'Yetunde Junaid', stars: 5, text: 'One of the best Real Estate company in Abeokuta, Ogun State.' },
];

export default async function HomePage() {
  const currency = getVisitorCurrency();
  const [featured, agents, counts, hero, team, partners, , allPosts] = await Promise.all([
    getFeatured(6),
    getAgents(),
    getCityCounts(),
    getHero(),
    getTeam('home'),
    getPartners(),
    loadRates(),
    getPosts(),
  ]);
  // Newest posts first; four across on desktop, like the old homepage.
  const posts = allPosts.slice(0, 4);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-ink">
        <img
          src={hero.image}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        {/* Charcoal overlay so the photo shows through and the text stays easy to read */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-ink/75 via-brand-ink/55 to-brand-ink/80" />
        <div className="container-site py-20 text-center sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">{hero.eyebrow}</p>
          <h1 className="font-display text-4xl text-white sm:text-6xl">{hero.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mx-auto mt-10 max-w-5xl">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="section-title">Discover Our Featured Properties</h2>
          <p className="section-sub">Hand-picked homes and land from the Barods team</p>
        </div>
        <div className="grid grid-cols-1 justify-center gap-5 sm:grid-cols-[repeat(auto-fit,minmax(250px,280px))]">
          {featured.map((p) => (
            <PropertyCard key={p.ref} property={p} agent={agentBySlug.get(p.agentSlug)} currency={currency} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/properties" className="btn-outline">View all properties</Link>
        </div>
      </section>

      {/* Cities */}
      <section className="bg-paper py-16 sm:py-20">
        <div className="container-site">
          <div className="mb-10 text-center">
            <h2 className="section-title">Explore Our Properties by City</h2>
            <p className="section-sub">Discover the best properties across top cities tailored to your needs.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/properties?city=${c.slug}`}
                className="group flex h-36 flex-col justify-end rounded-xl bg-brand-ink p-5 text-white transition-colors hover:bg-brand-greenDark"
              >
                <span className="font-display text-2xl">{c.name}</span>
                <span className="text-sm text-white/75">
                  {counts[c.slug] ?? 0} {counts[c.slug] === 1 ? 'property' : 'properties'} · {c.state}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-sub mx-auto max-w-2xl">
            A remarkable team of professionals with diverse skills and a shared vision, each bringing unique talents to
            your experience.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 lg:grid-cols-4">
          {team.slice(0, 4).map((m) => (
            <div key={m.email} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
              <img src={m.photoUrl} alt={m.name} className="aspect-[4/5] w-full object-cover object-top" loading="lazy" />
              <div className="flex-1 p-3.5 text-center">
                <div className="text-[15px] font-semibold leading-snug">{m.name}</div>
                <div className="mt-0.5 text-[13px] text-muted">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partners: endless carousel; the list is doubled so the loop has no gap */}
      <section className="border-y border-line bg-white py-14">
        <h2 className="mb-8 text-center font-display text-3xl">Our Trusted Partners</h2>
        <div
          className="marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          aria-label="Partner logos"
        >
          <ul className="marquee-track flex w-max gap-6">
            {[...partners, ...partners].map((p, i) => (
              <li
                key={i}
                aria-hidden={i >= partners.length}
                className="flex h-28 w-48 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-4 shadow-sm"
              >
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" tabIndex={i >= partners.length ? -1 : undefined}>
                    <img src={p.logo} alt={i < partners.length ? p.name : ''} className="max-h-20 w-auto object-contain" loading="lazy" />
                  </a>
                ) : (
                  <img src={p.logo} alt={i < partners.length ? p.name : ''} className="max-h-20 w-auto object-contain" loading="lazy" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-paper py-16 sm:py-20">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title">What Our Clients Say</h2>
              <p className="section-sub">From our Google reviews</p>
            </div>
            <a
              href="https://search.google.com/local/writereview?placeid=ChIJX3Gh7dpLOhARZ02Vmo30ODc"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Write a review
            </a>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="rounded-xl border border-line bg-white p-6">
                <div className="text-brand-orange" aria-label={`${r.stars} out of 5 stars`}>
                  {'★'.repeat(r.stars)}
                  <span className="text-line">{'★'.repeat(5 - r.stars)}</span>
                </div>
                <blockquote className="mt-3 text-[15px]">“{r.text}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="container-site py-16 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Read From Our Blog</h2>
              <p className="section-sub">Stay Inspired With Expert Stories, Ideas, and Trends.</p>
            </div>
            <Link href="/blog" className="btn-outline">Read more</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => (
              <article key={post.slug} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
                <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block overflow-hidden">
                  {post.coverUrl ? (
                    <img src={post.coverUrl} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-brand-greenLight">
                      <img src="/brand/icon.png" alt="" className="h-12 w-12 opacity-40" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted">
                    {formatDate(post.publishedAt)}
                    {post.category && <> · <span className="font-semibold text-brand-greenDark">{post.category}</span></>}
                  </p>
                  <h3 className="mt-2 text-[17px] font-semibold leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-brand-greenDark">{post.title}</Link>
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
                  <div className="mt-auto space-y-2 pt-4 text-sm">
                    {post.author && <p className="text-muted">by {post.author}</p>}
                    <Link href={`/blog/${post.slug}`} className="inline-block font-semibold text-brand-greenDark hover:underline">
                      Continue reading →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-green">
        <div className="container-site flex flex-wrap items-center justify-between gap-6 py-12 text-white">
          <div>
            <h2 className="font-display text-3xl">Need Help? Talk to an expert</h2>
            <p className="text-white/90">Your property journey made simple with expert support.</p>
          </div>
          <Link href="/contact-us" className="btn bg-white text-brand-ink hover:bg-brand-ink hover:text-white">
            Talk to an Agent
          </Link>
        </div>
      </section>
    </>
  );
}
