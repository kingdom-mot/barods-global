import { waNumber } from '@/lib/phone';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import MortgageCalculator from '@/components/MortgageCalculator';
import PropertyCard, { statusBadge } from '@/components/PropertyCard';
import PropertyGallery from '@/components/PropertyGallery';
import ScheduleTour from '@/components/ScheduleTour';
import ShareBar from '@/components/ShareBar';
import { SpecIcon } from '@/components/SpecIcons';
import { formatPrice } from '@/lib/currency';
import { getAgent, getAgents, getProperty, getPropertyByWpSlug, searchProperties } from '@/lib/data';
import { getContact, getMortgageSettings, loadRates } from '@/lib/settings';
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

const STATUS_TEXT = { sale: 'For Sale', rent: 'For Rent', shortlet: 'Shortlet' } as const;
const COUNTRY = { NG: 'Nigeria', ZA: 'South Africa' } as const;

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-40 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 className="mb-5 border-b border-line pb-3 font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function youTubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function PropertyPage({ params }: Props) {
  const p = await getProperty(params.slug);
  if (!p) {
    const moved = await getPropertyByWpSlug(params.slug);
    if (moved) permanentRedirect(`/property/${moved.slug}`);
    notFound();
  }
  const currency = getVisitorCurrency();
  const [rates, mortgageSettings, contact] = await Promise.all([loadRates(), getMortgageSettings(), getContact()]);
  const [agent, agents, similarAll] = await Promise.all([
    getAgent(p.agentSlug),
    getAgents(),
    searchProperties({ purpose: p.purpose, city: p.citySlug }),
  ]);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
  const similar = similarAll.filter((s) => s.ref !== p.ref).slice(0, 4);
  const price = formatPrice(p.price, p.currency, p.pricePeriod, currency);
  const badge = statusBadge(p);
  const place = [p.address && p.address !== p.area ? p.address : null, p.area, p.city, `${p.state} State`, COUNTRY[p.countryCode]]
    .filter(Boolean)
    .join(', ');
  const mapQuery = [p.address ?? p.area, p.city, p.state, COUNTRY[p.countryCode]].filter(Boolean).join(', ');
  const whatsappText = encodeURIComponent(`Hello, I'm interested in ${p.title} (${p.ref}) on barodsglobal.com`);
  const whatsappNumber = waNumber(agent?.whatsapp || agent?.phone || contact.whatsapp);
  const isLand = /land|plot/i.test(p.typeName);
  const sizeSqm = p.floorSizeSqm ?? (p.landSize ? Number(p.landSize.replace(/[^0-9.]/g, '')) || undefined : undefined);
  const perSqm = p.price && sizeSqm && p.purpose === 'sale' ? formatPrice(Math.round(p.price / sizeSqm), p.currency, 'once', currency) : null;
  const statusText = p.availability === 'sold' ? 'Sold' : p.availability === 'let' ? 'Let' : p.availability === 'under_offer' ? 'Under offer' : STATUS_TEXT[p.purpose];
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const video = p.videoUrl ? youTubeEmbed(p.videoUrl) : null;
  const showMortgage = p.purpose === 'sale' && p.price !== null && p.availability !== 'sold';
  const agentHref = agent ? `/agent/${agent.slug}?from=${encodeURIComponent(p.slug)}` : '/agents';

  const details: [string, string | number | undefined][] = [
    ['Property ID', p.ref],
    ['Price', price.main + (price.original ? ` (${price.original})` : '')],
    ['Property size', p.floorSizeSqm ? `${p.floorSizeSqm} sqm` : undefined],
    ['Land area', p.landSize],
    ['Bedrooms', p.bedrooms],
    ['Bathrooms', p.bathrooms],
    ['Toilets', p.toilets],
    ['Parking spaces', p.parking],
    ['Property type', p.typeName],
    ['Property status', statusText],
    ['Title document', p.titleDocument],
    ['Condition', p.condition],
    ['Furnishing', p.furnishing],
    ['Listed on', fmtDate(p.publishedAt)],
    ['Updated on', p.updatedAt ? fmtDate(p.updatedAt) : undefined],
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

  const nav = [
    ['overview', 'Overview'],
    ['description', 'Description'],
    ['address', 'Address'],
    ['details', 'Details'],
    ...(p.amenities.length ? [['features', 'Features']] : []),
    ...(showMortgage ? [['mortgage', 'Mortgage calculator']] : []),
    ['tour', 'Schedule a tour'],
    ['contact', 'Contact'],
    ...(similar.length ? [['similar', 'Similar listings']] : []),
  ];

  const overview: { label: string; value?: string | number; icon?: 'bed' | 'bath' | 'toilet' | 'car' | 'area' }[] = [
    { label: 'Property type', value: p.typeName },
    { label: 'Bedrooms', value: p.bedrooms, icon: 'bed' },
    { label: 'Bathrooms', value: p.bathrooms, icon: 'bath' },
    { label: 'Toilets', value: p.toilets, icon: 'toilet' },
    { label: 'Parking', value: p.parking, icon: 'car' },
    { label: p.floorSizeSqm ? 'Property size' : 'Land area', value: p.floorSizeSqm ? `${p.floorSizeSqm} sqm` : p.landSize, icon: 'area' },
    { label: 'Title', value: p.titleDocument?.match(/\(([^)]+)\)/)?.[1] ?? p.titleDocument },
  ];

  return (
    <div className="bg-paper pb-16">
      <div className="container-site pt-6">
        <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-green">Home</Link> ›{' '}
          <Link href="/properties" className="hover:text-brand-green">Properties</Link> ›{' '}
          <Link href={`/properties?type=${p.typeSlug}`} className="hover:text-brand-green">{p.typeName}</Link> ›{' '}
          <span className="text-brand-ink">{p.title}</span>
        </nav>

        <div className="mb-5 grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {p.featured && <span className="badge bg-brand-orange text-white">Featured</span>}
              <span className={`badge ${badge.cls}`}>{badge.text}</span>
              {p.label && p.availability === 'available' && <span className="badge bg-brand-green text-white">{p.label}</span>}
            </div>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">{p.title}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {place}
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl font-extrabold text-brand-greenDark">{price.main}</div>
            {price.original && <div className="text-sm text-muted">Listed at {price.original}</div>}
            {perSqm && <div className="text-sm text-muted">{perSqm.main}/sqm</div>}
          </div>
        </div>

        <div className="mb-5">
          <ShareBar title={p.title} path={`/property/${p.slug}`} />
        </div>

        <PropertyGallery photos={p.photos} title={p.title} mapQuery={mapQuery} />
      </div>

      {/* Section jump menu, as on the current site */}
      <nav className="sticky top-[76px] z-30 mt-6 border-y border-line bg-white" aria-label="Sections">
        <div className="container-site flex gap-1 overflow-x-auto py-2 text-sm">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-3 py-2 font-medium hover:bg-brand-greenLight hover:text-brand-greenDark">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-site mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Block id="overview" title="Overview">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              {overview
                .filter((o) => o.value !== undefined && o.value !== '')
                .map((o) => (
                  <div key={o.label} className="flex items-start gap-2.5">
                    {o.icon && <span className="mt-0.5 text-brand-green"><SpecIcon name={o.icon} className="h-6 w-6" /></span>}
                    <div>
                      <dd className="font-bold">{o.value}</dd>
                      <dt className="text-xs uppercase tracking-wide text-muted">{o.label}</dt>
                    </div>
                  </div>
                ))}
            </dl>
          </Block>

          <Block id="description" title="Description">
            <p className="whitespace-pre-line leading-relaxed text-brand-ink/90">{p.description ?? 'Contact the agent for more information about this property.'}</p>
          </Block>

          <Block id="address" title="Address">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {(
                [
                  ['Address', p.address ?? p.area],
                  ['Area', p.area],
                  ['City', p.city],
                  ['State', `${p.state} State`],
                  ['Country', COUNTRY[p.countryCode]],
                ] as [string, string | undefined][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-right text-muted">{v}</dd>
                  </div>
                ))}
            </dl>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline mt-5"
            >
              Open on Google Maps
            </a>
          </Block>

          <Block id="details" title="Details">
            <dl className="grid gap-x-8 rounded-lg bg-brand-greenLight/60 px-4 sm:grid-cols-2">
              {details
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-brand-green/15 py-2.5 text-sm">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
            </dl>
            {terms.some(([, v]) => v) && (
              <>
                <h3 className="mb-2 mt-6 font-semibold">Rent and fees</h3>
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {terms.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
                      <dt className="font-semibold">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </Block>

          {p.amenities.length > 0 && (
            <Block id="features" title="Features">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green text-[11px] text-white" aria-hidden="true">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {p.videoUrl && (
            <Block id="video" title="Video">
              {video ? (
                <iframe src={video} title={`${p.title} video`} className="aspect-video w-full rounded-lg" allowFullScreen loading="lazy" />
              ) : (
                <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">Watch the video</a>
              )}
            </Block>
          )}

          {p.virtualTourUrl && (
            <Block id="virtual-tour" title="360° virtual tour">
              <iframe src={p.virtualTourUrl} title={`${p.title} virtual tour`} className="aspect-video w-full rounded-lg" allowFullScreen loading="lazy" />
            </Block>
          )}

          {showMortgage && (
            <Block id="mortgage" title="Mortgage calculator">
              <MortgageCalculator price={p.price!} currency={p.currency} country={p.countryCode} visitorCurrency={currency} isLand={isLand} settings={mortgageSettings} rates={rates} />
            </Block>
          )}

          <Block id="tour" title="Schedule a tour">
            <ScheduleTour propertyRef={p.ref} agentSlug={agent?.slug} title={p.title} />
          </Block>

          <div className="rounded-xl bg-white p-5 text-sm">
            <h2 className="mb-2 font-semibold">Safety tips</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>Inspect the property and meet the agent before paying anything.</li>
              <li>Ask to see the original title document and carry out a search at the state land registry.</li>
              <li>Pay only into Barods Global Limited’s official account.</li>
            </ul>
            <p className="mt-3 text-xs text-muted">
              Ref {p.ref} · <Link href={`/contact-us?report=${p.ref}`} className="underline hover:text-brand-green">Report this listing</Link>
            </p>
          </div>
        </div>

        <aside id="contact" className="scroll-mt-40 lg:sticky lg:top-[140px]">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 font-semibold">Enquire about this property</h2>
            {agent && (
              <div className="mb-4 flex items-center gap-3">
                <Link href={agentHref} className="shrink-0">
                  <img src={agent.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <Link href={agentHref} className="font-semibold hover:text-brand-green">{agent.fullName}</Link>
                  <div className="text-sm text-muted">{agent.position}{agent.verified ? ' · Verified' : ''}</div>
                  <Link href={agentHref} className="text-sm font-semibold text-brand-green hover:underline">View listings</Link>
                </div>
              </div>
            )}
            <div className="mb-5 grid grid-cols-2 gap-2">
              <a href={`tel:${(agent?.phone ?? contact.phone).replace(/[^0-9+]/g, '')}`} className="btn-outline">Call</a>
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
              defaultMessage={`Hello, I am interested in ${p.title} (${p.ref}).`}
              askRole
            />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section id="similar" className="container-site mt-14 scroll-mt-40">
          <h2 className="mb-6 font-display text-3xl">Similar listings</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
            {similar.map((s) => (
              <PropertyCard key={s.ref} property={s} agent={agentBySlug.get(s.agentSlug)} currency={currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
