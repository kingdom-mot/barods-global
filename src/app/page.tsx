import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchForm from '@/components/SearchForm';
import { cities, partners, team } from '@/lib/content';
import { getAgents, getCityCounts, getFeatured } from '@/lib/data';
import { getVisitorCurrency } from '@/lib/visitor';

const reviews = [
  { name: 'Adekola Alagbe', stars: 4, text: 'Great people, no gimmicks. What you see is what you get.' },
  { name: 'Kehinde Opemipo', stars: 5, text: 'Hands down the best real estate company in Abeokuta you could ask for.' },
  { name: 'Yetunde Junaid', stars: 5, text: 'One of the best Real Estate company in Abeokuta, Ogun State.' },
];

export default async function HomePage() {
  const currency = getVisitorCurrency();
  const [featured, agents, counts] = await Promise.all([getFeatured(), getAgents(), getCityCounts()]);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-ink">
        <img
          src="https://barodsglobal.com/wp-content/uploads/2025/08/1-584x438.png"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-ink/40 to-brand-ink/80" />
        <div className="container-site py-20 text-center sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">Real Estate and Construction</p>
          <h1 className="font-display text-4xl text-white sm:text-6xl">Welcome To Barods Global Limited</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            Whether you’re buying your first home, selling property, investing in real estate, or building from the ground
            up, Barods is your trusted partner for excellence, innovation, and lasting value.
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {team.slice(0, 4).map((m) => (
            <div key={m.email} className="overflow-hidden rounded-xl border border-line">
              <img src={m.photoUrl} alt={m.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-4">
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-muted">{m.role}</div>
                <a href={`mailto:${m.email}`} className="mt-1 block text-sm text-brand-greenDark hover:underline">{m.email}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="border-y border-line py-12">
        <div className="container-site">
          <h2 className="mb-8 text-center font-display text-2xl">Our Trusted Partners</h2>
          <div className="grid grid-cols-3 items-center gap-6 sm:grid-cols-5 lg:grid-cols-9">
            {partners.map((src) => (
              <img key={src} src={src} alt="Partner logo" className="mx-auto max-h-14 w-auto object-contain grayscale transition hover:grayscale-0" loading="lazy" />
            ))}
          </div>
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
