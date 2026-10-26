import type { Metadata } from 'next';
import Link from 'next/link';
import { getAgentProperties, getAgents } from '@/lib/data';
import { telHref, waNumber } from '@/lib/phone';

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
              <img src={a.photoUrl} alt={`${a.fullName}, ${a.position || 'Barods Global agent'}`} className="aspect-[4/5] w-full object-cover object-top" loading="lazy" />
            </Link>
            <div className="flex flex-1 flex-col p-4 text-center">
              {a.verified && <span className="badge mx-auto mb-2 bg-brand-greenLight text-brand-greenDark">Verified</span>}
              <h2 className="text-[15px] font-semibold leading-snug">{a.fullName}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{a.position}</p>
              <p className="mt-1 text-[13px]">{counts[i]} active {counts[i] === 1 ? 'listing' : 'listings'}</p>
              <div className="mt-auto space-y-2 pt-4">
                {(a.phone || a.whatsapp) && (
                  <div className="grid grid-cols-2 gap-2">
                    {a.phone && (
                      <a href={telHref(a.phone)} className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-line text-sm font-semibold hover:border-brand-green hover:text-brand-greenDark" aria-label={`Call ${a.fullName}`}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
                        Call
                      </a>
                    )}
                    <a
                      href={`https://wa.me/${waNumber(a.whatsapp || a.phone)}?text=${encodeURIComponent(`Hello ${a.fullName.replace(/^ESV\s+/, '').split(' ')[0]}, I found you on the Barods Global website.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-md bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1DA851] ${a.phone ? '' : 'col-span-2'}`}
                      aria-label={`WhatsApp ${a.fullName}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" /></svg>
                      WhatsApp
                    </a>
                  </div>
                )}
                <Link href={`/agent/${a.slug}`} className="btn-outline w-full">View profile</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
