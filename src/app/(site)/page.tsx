import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchForm from '@/components/SearchForm';
import GoogleReviews from '@/components/GoogleReviews';
import TrustindexWidget from '@/components/TrustindexWidget';
import { formatDate, getPosts } from '@/lib/blog';
import { getGoogleReviews, WRITE_REVIEW_URL } from '@/lib/reviews';
import { getAgents, getFeatured, getPlaceCounts } from '@/lib/data';
import { citySlug, getHero, getHomeCities, getPartners, getReviewsWidgetId, getTeam, loadRates } from '@/lib/settings';
import { getVisitorCurrency } from '@/lib/visitor';


export default async function HomePage() {
  const currency = getVisitorCurrency();
  const [featured, agents, hero, team, partners, , allPosts, cities, reviews, widgetId] = await Promise.all([
    getFeatured(6),
    getAgents(),
    getHero(),
    getTeam('home'),
    getPartners(),
    loadRates(),
    getPosts(),
    getHomeCities(),
    getGoogleReviews(),
    getReviewsWidgetId(),
  ]);
  // Newest posts first; four across on desktop, like the old homepage.
  const posts = allPosts.slice(0, 4);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
  const counts = await getPlaceCounts(cities.map((c) => c.name));

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
          <h1 className="mx-auto max-w-4xl text-balance font-display text-3xl leading-tight text-white sm:text-4xl lg:text-[44px]">{hero.title}</h1>
          <p className="mx-auto mt-5 max-w-[1040px] text-pretty text-base leading-relaxed text-white/85 sm:text-[17px]">
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
        {/* Three across, edge to edge with the other sections; a short row (1–2 listings) is centred */}
        <div
          className={
            featured.length >= 3
              ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-[calc((100%-3rem)*2/3+1.5rem)]'
          }
        >
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
            {cities.map((c) => {
              const slug = citySlug(c.name);
              const n = counts[c.name] ?? 0;
              return (
                <Link
                  key={slug}
                  href={`/properties?location=${encodeURIComponent(c.name)}`}
                  className="group relative isolate flex h-44 flex-col justify-end overflow-hidden rounded-xl bg-brand-ink p-5 text-white sm:h-52"
                >
                  {c.image && (
                    <img src={c.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  )}
                  {/* Darkens the bottom of the photo so the name stays readable; turns green on hover */}
                  <span className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-ink/90 via-brand-ink/35 to-transparent transition-colors duration-300 group-hover:from-brand-greenDark/90" aria-hidden="true" />
                  <span className="font-display text-2xl">{c.name}</span>
                  <span className="text-sm text-white/80">
                    {n} {n === 1 ? 'property' : 'properties'}{c.state ? ` · ${c.state}` : ''}
                  </span>
                </Link>
              );
            })}
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
          {widgetId ? (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="section-title">What Our Clients Say</h2>
                  <p className="section-sub">From our Google reviews</p>
                </div>
                <a href={WRITE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">Write a review</a>
              </div>
              <TrustindexWidget id={widgetId} />
            </>
          ) : (
            <GoogleReviews data={reviews} writeUrl={WRITE_REVIEW_URL} />
          )}
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
