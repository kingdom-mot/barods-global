import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import PropertyCard from '@/components/PropertyCard';
import { getAgent, getAgentProperties, getProperty } from '@/lib/data';
import { telHref, waNumber } from '@/lib/phone';
import { getContact, loadRates } from '@/lib/settings';
import type { Property } from '@/lib/types';
import { getVisitorCurrency } from '@/lib/visitor';

type Props = { params: { slug: string }; searchParams: { from?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAgent(params.slug);
  return a ? { title: `${a.fullName}${a.position ? ` — ${a.position}` : ''}`, description: a.bio?.slice(0, 160), alternates: { canonical: `/agent/${a.slug}` } } : {};
}

const PURPOSE_LABEL: Record<string, string> = { sale: 'For Sale', rent: 'For Rent', shortlet: 'Shortlet' };

/** "100% Residential", "60% For Sale · 40% For Rent" — the breakdown shown under the buttons. */
function breakdown(list: Property[], key: (p: Property) => string) {
  const counts = new Map<string, number>();
  for (const p of list) counts.set(key(p), (counts.get(key(p)) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, n]) => ({ label, pct: Math.round((n / list.length) * 100) }));
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
  </svg>
);
const MessageIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

export default async function AgentPage({ params, searchParams }: Props) {
  const agent = await getAgent(params.slug);
  if (!agent) permanentRedirect('/agents'); // former agents and old addresses
  const currency = getVisitorCurrency();
  const [, listings, contact] = await Promise.all([loadRates(), getAgentProperties(agent.slug), getContact()]);
  // Arrived from a listing? Only real property slugs are accepted, so this can't link off-site.
  const fromProperty = searchParams.from ? await getProperty(searchParams.from) : undefined;
  const firstName = agent.fullName.replace(/^ESV\s+/, '').split(' ')[0];

  // The agent's own numbers, falling back to the Barods office line.
  const phone = agent.phone || contact.phone;
  const wa = waNumber(agent.whatsapp || agent.phone || contact.whatsapp);
  const waText = encodeURIComponent(`Hello ${firstName}, I found your profile on barodsglobal.com and I'd like to talk about a property.`);
  const types = listings.length ? breakdown(listings, (p) => p.typeName || 'Other') : [];
  const statuses = listings.length ? breakdown(listings, (p) => PURPOSE_LABEL[p.purpose] ?? p.purpose) : [];

  return (
    <>
      <section className="bg-paper pb-10 pt-6">
        <div className="container-site mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-green">Home</Link> ›{' '}
            {fromProperty ? (
              <>
                <Link href="/properties" className="hover:text-brand-green">Properties</Link> ›{' '}
                <Link href={`/property/${fromProperty.slug}`} className="hover:text-brand-green">{fromProperty.title}</Link> ›{' '}
              </>
            ) : (
              <>
                <Link href="/agents" className="hover:text-brand-green">Agents</Link> ›{' '}
              </>
            )}
            <span className="text-brand-ink">{agent.fullName}</span>
          </nav>
          <Link href={fromProperty ? `/property/${fromProperty.slug}` : '/agents'} className="btn-outline min-h-[40px] bg-white px-4">
            ← {fromProperty ? 'Back to property' : 'All agents'}
          </Link>
        </div>

        {/* Profile card: photo, name, areas, then Call / WhatsApp / Send Message, then listing mix */}
        <div className="container-site">
          <div className="grid gap-6 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
            <img
              src={agent.photoUrl}
              alt={agent.fullName}
              className="mx-auto aspect-[4/5] w-full max-w-[240px] rounded-xl object-cover object-top md:mx-0"
            />
            <div className="flex min-w-0 flex-col">
              {agent.verified && (
                <span className="badge mb-2 self-start bg-brand-greenLight text-brand-greenDark">✓ Verified Barods agent</span>
              )}
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">{agent.fullName}</h1>
              <p className="mt-1 text-muted">
                {agent.position ? `${agent.position} at ` : ''}
                <span className="font-semibold text-brand-ink">Barods Global Limited</span>
              </p>

              {agent.serviceAreas && (
                <p className="mt-4 text-[15px]">
                  <span className="font-semibold">Areas:</span> <span className="text-muted">{agent.serviceAreas}</span>
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
                <a href={telHref(phone)} className="btn-green gap-2">
                  <PhoneIcon /> Call {phone}
                </a>
                {wa && (
                  <a
                    href={`https://wa.me/${wa}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn gap-2 bg-[#25D366] text-white hover:bg-[#1DA851]"
                  >
                    <WhatsAppIcon /> WhatsApp
                  </a>
                )}
                <a href="#contact" className="btn-outline gap-2">
                  <MessageIcon /> Send Message
                </a>
              </div>

              {listings.length > 0 && (
                <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Listings</dt>
                    <dd className="mt-1 text-lg font-semibold">{listings.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Property Types</dt>
                    <dd className="mt-1 space-y-0.5 text-[15px]">
                      {types.map((t) => (
                        <div key={t.label}><span className="font-semibold text-brand-greenDark">{t.pct}%</span> {t.label}</div>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Property Status</dt>
                    <dd className="mt-1 space-y-0.5 text-[15px]">
                      {statuses.map((t) => (
                        <div key={t.label}><span className="font-semibold text-brand-greenDark">{t.pct}%</span> {t.label}</div>
                      ))}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two columns with matching headings, so the content and the message card start on the same line */}
      <section className="container-site grid items-start gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0 space-y-12">
          {agent.bio && (
            <div>
              <h2 className="mb-4 font-display text-2xl leading-none">About {firstName}</h2>
              <div className="space-y-3 text-[16px] leading-relaxed text-brand-ink/85">
                {agent.bio.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
          )}
          <div>
            <h2 className="mb-5 font-display text-2xl leading-none">{firstName}’s listings ({listings.length})</h2>
            {listings.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((p) => <PropertyCard key={p.ref} property={p} agent={agent} currency={currency} />)}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">No active listings right now.</p>
            )}
          </div>
        </div>

        <aside id="contact" className="scroll-mt-[150px] lg:sticky lg:top-[150px]">
          <h2 className="mb-5 font-display text-2xl leading-none">Contact {firstName}</h2>
          <div className="rounded-xl border border-line p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
              <img src={agent.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover object-top" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{agent.fullName}</div>
                <div className="truncate text-sm text-muted">{agent.position || 'Barods Global Limited'}</div>
              </div>
            </div>
            <EnquiryForm agentSlug={agent.slug} source="agent_profile" askRole />
          </div>
        </aside>
      </section>
    </>
  );
}
