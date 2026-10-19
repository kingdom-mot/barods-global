import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import PropertyCard from '@/components/PropertyCard';
import { getAgent, getAgentProperties, getProperty } from '@/lib/data';
import { loadRates } from '@/lib/settings';
import { getVisitorCurrency } from '@/lib/visitor';

type Props = { params: { slug: string }; searchParams: { from?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAgent(params.slug);
  return a ? { title: `${a.fullName} — ${a.position}` } : {};
}

export default async function AgentPage({ params, searchParams }: Props) {
  const agent = await getAgent(params.slug);
  if (!agent) notFound();
  const currency = getVisitorCurrency();
  await loadRates();
  const listings = await getAgentProperties(agent.slug);
  // Arrived from a listing? Only real property slugs are accepted, so this can't link off-site.
  const fromProperty = searchParams.from ? await getProperty(searchParams.from) : undefined;
  const firstName = agent.fullName.replace(/^ESV\s+/, '').split(' ')[0];

  return (
    <>
      <section className="bg-paper pb-12 pt-6">
        <div className="container-site mb-8 flex flex-wrap items-center justify-between gap-3">
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
        <div className="container-site flex flex-wrap items-center gap-8">
          <img src={agent.photoUrl} alt={agent.fullName} className="h-40 w-40 rounded-full border-4 border-white object-cover shadow" />
          <div className="min-w-0 flex-1">
            {agent.verified && <span className="badge mb-2 bg-brand-greenLight text-brand-greenDark">Verified Barods agent</span>}
            <h1 className="font-display text-4xl">{agent.fullName}</h1>
            <p className="text-muted">{agent.position} · <a href={`mailto:${agent.email}`} className="hover:underline">{agent.email}</a></p>
            {agent.bio && <p className="mt-3 max-w-2xl">{agent.bio}</p>}
          </div>
        </div>
      </section>
      {/* Two columns with matching headings, so the first listing card and the message card start on the same line */}
      <section className="container-site grid items-start gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
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
        <aside className="lg:sticky lg:top-24">
          <h2 className="mb-5 font-display text-2xl leading-none">Contact {firstName}</h2>
          <div className="rounded-xl border border-line p-5">
            <EnquiryForm agentSlug={agent.slug} source="agent_profile" />
          </div>
        </aside>
      </section>
    </>
  );
}
