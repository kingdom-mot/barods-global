import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import PropertyCard from '@/components/PropertyCard';
import { getAgent, getAgentProperties } from '@/lib/data';
import { getVisitorCurrency } from '@/lib/visitor';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAgent(params.slug);
  return a ? { title: `${a.fullName} — ${a.position}` } : {};
}

export default async function AgentPage({ params }: Props) {
  const agent = await getAgent(params.slug);
  if (!agent) notFound();
  const currency = getVisitorCurrency();
  const listings = await getAgentProperties(agent.slug);
  const firstName = agent.fullName.replace(/^ESV\s+/, '').split(' ')[0];

  return (
    <>
      <section className="bg-paper py-12">
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
