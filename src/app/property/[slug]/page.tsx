import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import PropertyCard, { statusBadge } from '@/components/PropertyCard';
import { formatPrice } from '@/lib/currency';
import { getAgent, getAgents, getProperty, searchProperties } from '@/lib/data';
import { getVisitorCurrency } from '@/lib/visitor';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProperty(params.slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description ?? `${p.typeName} in ${p.city}, ${p.state}`,
    openGraph: { images: p.photos.slice(0, 1) },
  };
}

export default async function PropertyPage({ params }: Props) {
  const p = await getProperty(params.slug);
  if (!p) notFound();
  const currency = getVisitorCurrency();
  const [agent, agents, similarAll] = await Promise.all([
    getAgent(p.agentSlug),
    getAgents(),
    searchProperties({ purpose: p.purpose, city: p.citySlug }),
  ]);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
  const similar = similarAll.filter((s) => s.ref !== p.ref).slice(0, 3);
  const price = formatPrice(p.price, p.currency, p.pricePeriod, currency);
  const badge = statusBadge(p);
  const place = [p.area, p.city, p.state].filter(Boolean).join(', ');
  const whatsappText = encodeURIComponent(`Hello, I'm interested in ${p.title} (${p.ref}) on barodsglobal.com`);
  const whatsappNumber = (agent?.whatsapp ?? '+2348022288806').replace(/[^0-9]/g, '');

  const facts: [string, string | number | undefined][] = [
    ['Type', p.typeName],
    ['Bedrooms', p.bedrooms],
    ['Bathrooms', p.bathrooms],
    ['Toilets', p.toilets],
    ['Parking', p.parking],
    ['Floor size', p.floorSizeSqm ? `${p.floorSizeSqm} sqm` : undefined],
    ['Land size', p.landSize],
    ['Condition', p.condition],
    ['Furnishing', p.furnishing],
    ['Title document', p.titleDocument],
  ];
  const terms: [string, string | undefined][] =
    p.purpose === 'rent'
      ? [
          ['Service charge', p.serviceCharge],
          ['Agency fee', p.agencyFee],
          ['Legal fee', p.legalFee],
          ['Caution fee', p.cautionFee],
          ['Minimum tenure', p.minimumTenure],
        ]
      : [];

  return (
    <div className="container-site py-8">
      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-ink">Home</Link> ›{' '}
        <Link href="/properties" className="hover:text-brand-ink">Properties</Link> ›{' '}
        <Link href={`/properties?city=${p.citySlug}`} className="hover:text-brand-ink">{p.city}</Link>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex gap-1.5">
            <span className={`badge ${badge.cls}`}>{badge.text}</span>
            {p.label && p.availability === 'available' && <span className="badge bg-brand-green text-white">{p.label}</span>}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl">{p.title}</h1>
          <p className="mt-1 text-muted">{place} · Ref {p.ref}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-brand-greenDark">{price.main}</div>
          {price.original && <div className="text-sm text-muted">Listed at {price.original}</div>}
        </div>
      </div>

      {p.photos.length > 1 ? (
        <div className="grid gap-3 sm:h-[460px] sm:grid-cols-4 sm:grid-rows-2">
          <img src={p.photos[0]} alt={p.title} className="aspect-[4/3] h-full w-full rounded-xl object-cover sm:col-span-3 sm:row-span-2 sm:aspect-auto" />
          {p.photos.slice(1, 3).map((src) => (
            <img key={src} src={src} alt="" className="hidden h-full w-full rounded-xl object-cover sm:block" />
          ))}
        </div>
      ) : (
        <img src={p.photos[0]} alt={p.title} className="aspect-[4/3] w-full rounded-xl object-cover sm:aspect-auto sm:h-[460px]" />
      )}

      <div className="mt-10 flex flex-wrap gap-10">
        <div className="min-w-0 flex-[999_1_560px] space-y-10">
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-paper p-5 sm:grid-cols-3">
            {facts
              .filter(([, v]) => v !== undefined && v !== '')
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
          </dl>

          {p.description && (
            <section>
              <h2 className="mb-3 font-display text-2xl">Description</h2>
              <p className="leading-relaxed text-brand-ink/90">{p.description}</p>
            </section>
          )}

          {terms.some(([, v]) => v) && (
            <section>
              <h2 className="mb-3 font-display text-2xl">Rent and fees</h2>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {terms.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
            </section>
          )}

          {p.amenities.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-2xl">Features and amenities</h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <span className="text-brand-green" aria-hidden="true">✓</span> {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="border-t border-line pt-4 text-xs text-muted">
            Listed {new Date(p.publishedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            <Link href={`/contact-us?report=${p.ref}`} className="underline">Report this listing</Link>
          </p>
        </div>

        <aside className="flex-[1_1_300px] space-y-5 lg:max-w-sm">
          <div className="rounded-xl border border-line p-5">
            {agent && (
              <Link href={`/agent/${agent.slug}`} className="mb-4 flex items-center gap-3">
                <img src={agent.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <div className="font-semibold">{agent.fullName}</div>
                  <div className="text-sm text-muted">{agent.position}{agent.verified ? ' · Verified' : ''}</div>
                </div>
              </Link>
            )}
            <div className="mb-5 grid grid-cols-2 gap-2">
              <a href={agent?.phone ? `tel:${agent.phone}` : 'tel:+2348022288806'} className="btn-outline">Call</a>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-[#1E7A4F] text-white hover:bg-[#165c3b]"
              >
                WhatsApp
              </a>
            </div>
            <EnquiryForm
              propertyRef={p.ref}
              agentSlug={agent?.slug}
              defaultMessage={`I'd like to know more about ${p.title} (${p.ref}).`}
              allowViewing
            />
          </div>
          <div className="rounded-xl bg-paper p-5 text-sm">
            <h2 className="mb-2 font-semibold">Safety tips</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>Inspect the property and meet the agent before paying anything.</li>
              <li>Pay only into Barods Global Limited’s official account.</li>
            </ul>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-3xl">Similar properties</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <PropertyCard key={s.ref} property={s} agent={agentBySlug.get(s.agentSlug)} currency={currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
