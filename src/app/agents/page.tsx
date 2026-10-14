import type { Metadata } from 'next';
import Link from 'next/link';
import { getAgentProperties, getAgents } from '@/lib/data';

export const metadata: Metadata = { title: 'Our Agents' };

export default async function AgentsPage() {
  const agents = await getAgents();
  const counts = await Promise.all(agents.map((a) => getAgentProperties(a.slug).then((l) => l.length)));

  return (
    <div className="container-site py-14">
      <div className="mb-10 text-center">
        <h1 className="section-title">Our Agents</h1>
        <p className="section-sub">Verified Barods Global property consultants</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a, i) => (
          <article key={a.slug} className="overflow-hidden rounded-xl border border-line">
            <img src={a.photoUrl} alt={a.fullName} className="aspect-[4/3] w-full object-cover object-top" loading="lazy" />
            <div className="p-5">
              {a.verified && <span className="badge mb-2 bg-brand-greenLight text-brand-greenDark">Verified</span>}
              <h2 className="text-lg font-semibold">{a.fullName}</h2>
              <p className="text-sm text-muted">{a.position}</p>
              <p className="mt-1 text-sm">{counts[i]} active {counts[i] === 1 ? 'listing' : 'listings'}</p>
              <Link href={`/agent/${a.slug}`} className="btn-outline mt-4">View profile</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
