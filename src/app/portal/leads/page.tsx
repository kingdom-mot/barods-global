import Link from 'next/link';
import LeadRow, { LEAD_STATUS } from '@/components/portal/LeadRow';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Leads' };

const SOURCE: Record<string, string> = {
  property_enquiry: 'Property enquiry',
  viewing_request: 'Tour request',
  agent_profile: 'Via your profile',
  contact: 'Contact page',
  service: 'Service enquiry',
};

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  const me = await requireUser();
  let q = createClient()
    .from('leads')
    .select('id, name, phone, email, message, source, status, internal_note, viewing_at, created_at, properties(ref, title, slug), agents(full_name)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (searchParams.status) q = q.eq('status', searchParams.status);
  const { data: leads } = await q;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-display text-4xl">{me.isStaff ? 'All leads' : 'My leads'}</h1>
      <p className="mb-6 text-sm text-muted">Everyone who enquired or asked for a tour{me.isStaff ? '' : ' on your listings or profile'}. Call or WhatsApp them, then update the status.</p>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {[['', 'All'] as [string, string], ...LEAD_STATUS].map(([v, l]) => (
          <Link
            key={v}
            href={v ? `/portal/leads?status=${v}` : '/portal/leads'}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${(searchParams.status ?? '') === v ? 'border-brand-green bg-brand-green text-white' : 'border-line bg-white hover:border-brand-green'}`}
          >
            {l}
          </Link>
        ))}
      </nav>

      {!leads || leads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">No leads here yet.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => {
            const prop = l.properties as unknown as { ref: string; title: string; slug: string } | null;
            const agent = (l.agents as unknown as { full_name: string } | null)?.full_name;
            const wa = l.phone ? l.phone.replace(/[^0-9]/g, '').replace(/^0/, '234') : '';
            return (
              <li key={l.id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:flex-row sm:justify-between">
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">{l.name}</span>
                    {l.status === 'new' && <span className="badge bg-brand-orange text-white">New</span>}
                    <span className="text-xs text-muted">
                      {SOURCE[l.source] ?? l.source} · {new Date(l.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  {prop && (
                    <div>
                      Listing: <Link href={`/property/${prop.slug}`} target="_blank" className="text-brand-greenDark hover:underline">{prop.title}</Link> ({prop.ref})
                    </div>
                  )}
                  {l.viewing_at && (
                    <div className="font-semibold text-brand-greenDark">
                      Tour requested for {new Date(l.viewing_at).toLocaleString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                  {me.isStaff && agent && <div className="text-muted">Agent: {agent}</div>}
                  {l.message && <p className="whitespace-pre-line text-muted">{l.message}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {l.phone && <a href={`tel:${l.phone}`} className="rounded-md border border-line px-3 py-1.5 font-semibold hover:border-brand-green">Call {l.phone}</a>}
                    {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#1E7A4F] px-3 py-1.5 font-semibold text-white">WhatsApp</a>}
                    {l.email && <a href={`mailto:${l.email}`} className="rounded-md border border-line px-3 py-1.5 font-semibold hover:border-brand-green">Email</a>}
                  </div>
                </div>
                <LeadRow id={l.id} status={l.status} note={l.internal_note} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
