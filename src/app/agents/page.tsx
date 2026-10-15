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
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {agents.map((a, i) => (
          <article key={a.slug} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
            <Link href={`/agent/${a.slug}`} tabIndex={-1} aria-hidden="true">
              <img src={a.photoUrl} alt="" className="aspect-[4/5] w-full object-cover object-top" loading="lazy" />
            </Link>
            <div className="flex flex-1 flex-col p-4 text-center">
              {a.verified && <span className="badge mx-auto mb-2 bg-brand-greenLight text-brand-greenDark">Verified</span>}
              <h2 className="text-[15px] font-semibold leading-snug">{a.fullName}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{a.position}</p>
              <p className="mt-1 text-[13px]">{counts[i]} active {counts[i] === 1 ? 'listing' : 'listings'}</p>
              <div className="mt-auto pt-4">
                <Link href={`/agent/${a.slug}`} className="btn-outline w-full">View profile</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
