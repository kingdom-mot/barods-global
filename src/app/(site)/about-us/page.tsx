import type { Metadata } from 'next';
import Link from 'next/link';
import { getHero, getTeam } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Barods Global Limited is a Nigerian real estate and property advisory company headquartered in Abeokuta, Ogun State, serving individuals, families, investors, developers and Nigerians in the diaspora.',
};

const WHAT_WE_DO: { title: string; body: string; icon: string }[] = [
  {
    title: 'Property Sales and Acquisition',
    body: 'We help clients identify, evaluate, buy, and sell land, residential properties, commercial buildings, blocks of flats, and other real estate assets. Our approach combines market knowledge with an understanding of each client’s objectives and budget.',
    icon: 'M3 10.5 12 3l9 7.5V21H3V10.5Zm6 10.5v-6h6v6',
  },
  {
    title: 'Real Estate Investment Advisory',
    body: 'We provide property investment guidance to individuals and businesses seeking opportunities for capital growth, portfolio diversification, rental income, and long-term wealth creation. We help clients assess opportunities and make decisions aligned with their investment goals.',
    icon: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  },
  {
    title: 'Diaspora Property Solutions',
    body: 'For Nigerians living abroad, investing in property back home should be an opportunity, not a source of uncertainty. We help diaspora clients navigate property searches, acquisition decisions, development planning, and project coordination in Nigeria, with an emphasis on communication, transparency, and accountability.',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z',
  },
  {
    title: 'Property Development and Building Projects',
    body: 'Through our network of construction professionals, architects, engineers, and other specialists, we support clients seeking to turn land and building concepts into practical development projects. Our services can include project planning, design coordination, construction advisory, and development support.',
    icon: 'M4 21V9l8-5 8 5v12M9 21v-5h6v5M4 21h16',
  },
  {
    title: 'Renovation and Interior Design',
    body: 'We help property owners improve the functionality, appearance, and value of their properties through renovation solutions, interior design, and creative space planning tailored to their preferences and lifestyle.',
    icon: 'M14 4l6 6-9 9H5v-6l9-9Zm-3 3 6 6',
  },
  {
    title: 'Property Consultancy and Due Diligence',
    body: 'We assist clients in evaluating property opportunities, understanding relevant documentation, assessing potential risks, and making more informed acquisition and investment decisions. Where required, we work with appropriate legal, surveying, engineering, and other qualified professionals.',
    icon: 'M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z',
  },
];

const WHY: { title: string; body: string }[] = [
  { title: 'Integrity and Transparency', body: 'We believe trust is earned through honest communication, clear expectations, and responsible service.' },
  { title: 'Client-Centred Solutions', body: 'Every client has different needs, financial objectives, and lifestyle aspirations. We tailor our approach to the individual rather than offering a one-size-fits-all solution.' },
  { title: 'Market Knowledge and Experience', body: 'Our experience across property sales, investment advisory, and real estate markets in Nigeria and South Africa informs the guidance we provide to our clients.' },
  { title: 'A Network of Professionals', body: 'We work with relevant property, design, construction, and professional service providers to help clients navigate different stages of their property journey.' },
  { title: 'A Long-Term Perspective', body: 'We look beyond the immediate transaction to consider the quality, suitability, potential value, and long-term usefulness of each property opportunity.' },
];

const WHO_WE_SERVE = [
  'Individuals and families looking to acquire their first home or upgrade their living spaces.',
  'Nigerians in the diaspora seeking dependable support for property investments and building projects back home.',
  'Investors looking to acquire land, residential properties, commercial assets, and income-generating real estate.',
  'Property developers seeking marketing, sales, and development advisory support.',
  'Property owners looking to renovate, improve, or maximise the potential of their assets.',
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${light ? 'text-brand-green' : 'text-brand-greenDark'}`}>{children}</p>;
}

export default async function AboutPage() {
  const [team, hero] = await Promise.all([getTeam('about'), getHero()]);
  const founderPhoto = team.find((m) => /babatunde|denton/i.test(m.name))?.photoUrl || '/wp-content/uploads/2025/08/1-1.jpg';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-ink py-16 text-white sm:py-20">
        {/* A different photo from the one further down the page (the homepage banner photo) */}
        <img src={hero.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/85 to-brand-ink/40" />
        <div className="container-site relative">
          <Eyebrow light>About Us</Eyebrow>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">Real Estate Solutions Built Around Your Dreams</h1>
          <p className="mt-5 inline-block border-l-4 border-brand-green pl-4 text-xl font-semibold">You Dream, We Build.</p>
        </div>
      </section>

      {/* Our company */}
      <section className="container-site grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <Eyebrow>Our Company</Eyebrow>
          <h2 className="section-title mt-2">More than buying land or building a house</h2>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-brand-ink/85">
            <p>
              At Barods Global Limited, we believe that real estate is more than buying land or building a house. It is about creating
              opportunities, securing your future, building lasting value, and turning your aspirations into reality.
            </p>
            <p>
              <strong className="text-brand-ink">Barods Global Limited</strong> is a Nigerian real estate and property advisory company
              headquartered in Abeokuta, Ogun State, with a growing reach across Nigeria and international property markets. We serve
              individuals, families, investors, developers, and Nigerians in the diaspora seeking reliable guidance and professional support
              throughout their real estate journey.
            </p>
            <p>
              Founded on the principles of integrity, transparency, professionalism, and service excellence, we provide tailored solutions
              that help our clients make informed property decisions with greater confidence.
            </p>
            <p>
              From acquiring land and purchasing residential or commercial properties to property development, construction advisory,
              renovation, and real estate investment consultancy, we bring together market knowledge, strategic thinking, and a
              client-focused approach to every project.
            </p>
          </div>
        </div>
        <img src="/wp-content/uploads/2025/07/Barods-image.jpeg" alt="A Barods Global building project" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg" />
      </section>

      {/* Mission & vision */}
      <section className="bg-paper py-14">
        <div className="container-site grid gap-6 md:grid-cols-2">
          {[
            ['Our Mission', 'To make real estate ownership, development, and investment more accessible, transparent, and rewarding by providing professional guidance, dependable service, and solutions tailored to our clients’ individual goals.'],
            ['Our Vision', 'To become a trusted, internationally connected real estate brand recognised for helping people build wealth, create exceptional living spaces, and achieve lasting value through property.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border-t-4 border-brand-green bg-white p-7 shadow-sm">
              <h2 className="font-display text-2xl">{t}</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-brand-ink/85">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <section className="container-site py-14 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What We Do</Eyebrow>
          <h2 className="section-title mt-2">Support at every stage of your property journey</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_WE_DO.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line p-6 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-greenLight text-brand-greenDark">
                <Icon d={s.icon} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/our-services" className="btn-outline">Explore our services</Link>
        </div>
      </section>

      {/* International connections */}
      <section className="bg-brand-ink py-14 text-white lg:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <Eyebrow light>Our International Connections</Eyebrow>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Real estate opportunities extend beyond geographical boundaries</h2>
          </div>
          <div className="space-y-4 text-[17px] leading-relaxed text-white/80">
            <p>
              Barods Global Limited leverages professional relationships and international market experience to support clients whose
              property interests span Nigeria and other markets.
            </p>
            <p>
              Our professional network includes relationships with property practitioners in Johannesburg, South Africa, including
              Hassenfeld Properties, as well as contacts and partners across markets such as the United States, Canada, and the United Arab
              Emirates.
            </p>
            <p>These relationships help us connect clients with relevant expertise and opportunities while providing a broader perspective on property ownership and investment.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Nigeria', 'South Africa', 'United States', 'Canada', 'United Arab Emirates'].map((c, i, all) => (
                <span key={c} className="rounded-full border border-white/25 px-3 py-1 text-sm text-white">
                  {c}
                  {i < all.length - 1 && <span className="sr-only">, </span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="container-site py-14 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why Choose Barods Global?</Eyebrow>
          <h2 className="section-title mt-2">A trusted partner, not just a transaction</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => (
            <div key={w.title} className="rounded-2xl bg-paper p-6">
              <span className="font-display text-3xl text-brand-green">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="bg-brand-greenLight py-14 lg:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-[minmax(0,380px)_1fr]">
          <img src={founderPhoto} alt="Babatunde Denton, Founder and CEO of Barods Global Limited" className="mx-auto aspect-[4/5] w-full max-w-sm rounded-2xl object-cover object-top shadow-lg" />
          <div>
            <Eyebrow>Meet Our Founder</Eyebrow>
            <h2 className="section-title mt-2">Babatunde Denton</h2>
            <p className="mt-1 font-semibold text-brand-greenDark">Founder and Chief Executive Officer</p>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-brand-ink/85">
              <p>Babatunde Denton founded Barods Global Limited with a vision of helping people turn their property aspirations into tangible achievements.</p>
              <p>
                With extensive experience in real estate sales, property consultancy, and client advisory, including professional practice in
                Johannesburg, South Africa, he brings an international perspective to the Nigerian property market.
              </p>
              <p>His approach is grounded in integrity, relationship-building, practical market knowledge, and a commitment to helping clients make better-informed property decisions.</p>
              <p>
                Under his leadership, Barods Global Limited continues to build its network, strengthen its service offerings, and support
                clients pursuing property ownership, development, and investment opportunities.
              </p>
            </div>
            <blockquote className="mt-6 border-l-4 border-brand-green pl-5 font-display text-xl leading-snug">
              “Every client’s dream deserves a thoughtful plan, professional execution, and a commitment to lasting value.”
            </blockquote>
          </div>
        </div>
      </section>

      {/* Who we serve + presence */}
      <section className="container-site grid gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <Eyebrow>Who We Serve</Eyebrow>
          <ul className="mt-5 space-y-3">
            {WHO_WE_SERVE.map((w) => (
              <li key={w} className="flex gap-3 text-[16px] leading-relaxed">
                <svg viewBox="0 0 24 24" className="mt-1 h-5 w-5 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line p-7">
          <Eyebrow>Our Presence</Eyebrow>
          <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-brand-ink/85">
            <p>Our headquarters is in Abeokuta, Ogun State, Nigeria, with services extending to Lagos, Ibadan, and other locations where we can support our clients and projects.</p>
            <p>Through our professional relationships and international connections, we also help clients explore relevant property opportunities beyond Nigeria.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Abeokuta (HQ)', 'Lagos', 'Ibadan'].map((c, i, all) => (
              <span key={c} className="rounded-full bg-brand-greenLight px-3 py-1 text-sm font-medium text-brand-greenDark">
                {c}
                {i < all.length - 1 && <span className="sr-only">, </span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="bg-paper py-14">
          <div className="container-site">
            <h2 className="section-title mb-8 text-center">Meet Our Team</h2>
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {team.map((m) => (
                <div key={m.name} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
                  <img src={m.photoUrl} alt={m.name} className="aspect-[4/5] w-full object-cover object-top" loading="lazy" />
                  <div className="flex-1 p-3.5 text-center">
                    <div className="text-[15px] font-semibold leading-snug">{m.name}</div>
                    <div className="mt-0.5 text-[13px] text-muted">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-site py-14 lg:py-20">
        <div className="rounded-3xl bg-brand-ink px-6 py-12 text-center text-white sm:px-12">
          <Eyebrow light>Your Dream. Our Commitment.</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl sm:text-4xl">Let’s make your dream our next project.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-white/80">
            Whether you want to acquire your first plot of land, build your dream home, invest in property, develop an estate, or manage a
            property project from abroad, Barods Global Limited is ready to help you take the next step.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-[17px] leading-relaxed text-white/80">
            You do not have to navigate your property journey alone. Let us help you assess your options, plan with confidence, and move
            towards your goals with a trusted real estate partner.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/contact-us" className="btn-green">Talk to us</Link>
            <Link href="/properties" className="rounded-md border border-white/40 px-5 py-3 font-semibold text-white hover:border-brand-green hover:text-brand-green">
              Browse properties
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
