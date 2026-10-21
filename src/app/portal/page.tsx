import Link from 'next/link';
import { naira } from '@/lib/portalData';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const me = await requireUser();
  const supabase = createClient();

  const [{ data: listings }, { data: leads }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, ref, title, status, availability, price, currency, review_note, updated_at, agent_id')
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase
      .from('leads')
      .select('id, name, phone, source, status, created_at, viewing_at, properties(ref, title)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Staff can read every listing; the dashboard counts only their own unless they're staff.
  const own = (listings ?? []).filter((l) => me.can.listings || l.agent_id === me.agent?.id);
  const count = (s: string) => own.filter((l) => l.status === s).length;
  const sentBack = own.filter((l) => l.status === 'sent_back');
  const firstName = (me.agent?.fullName ?? me.fullName).replace(/^ESV\s+/, '').split(' ')[0];

  const tiles = [
    { label: 'Live on the website', value: count('published'), href: '/portal/listings?status=published' },
    { label: me.can.listings ? 'Waiting for your approval' : 'Awaiting approval', value: count('pending_review'), href: me.can.listings ? '/portal/approvals' : '/portal/listings?status=pending_review' },
    { label: 'Drafts', value: count('draft'), href: '/portal/listings?status=draft' },
    { label: 'Sent back to fix', value: count('sent_back'), href: '/portal/listings?status=sent_back' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="font-display text-4xl">Hello, {firstName}</h1>
        </div>
        <Link href="/portal/listings/new" className="btn-green px-6">+ Add a listing</Link>
      </div>

      {me.agent?.status === 'invited' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Finish your profile.</strong> Add your photo and phone number so buyers can see who they’re talking to.
          Your card appears on the Agents page once it’s complete.{' '}
          <Link href="/portal/profile" className="font-semibold underline">Complete my profile →</Link>
        </div>
      )}

      {sentBack.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <strong>{sentBack.length} {sentBack.length === 1 ? 'listing needs' : 'listings need'} changes before going live.</strong>
          <ul className="mt-2 space-y-1">
            {sentBack.slice(0, 3).map((l) => (
              <li key={l.id}>
                <Link href={`/portal/listings/${l.id}`} className="font-semibold underline">{l.title}</Link>
                {l.review_note && <span>: “{l.review_note}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-xl border border-line bg-white p-5 transition-shadow hover:shadow-md">
            <div className="text-3xl font-extrabold text-brand-ink">{t.value}</div>
            <div className="mt-1 text-sm text-muted">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Latest leads</h2>
            <Link href="/portal/leads" className="text-sm font-semibold text-brand-greenDark hover:underline">See all</Link>
          </div>
          {leads && leads.length > 0 ? (
            <ul className="divide-y divide-line">
              {leads.map((l) => {
                const prop = l.properties as unknown as { ref: string; title: string } | null;
                return (
                  <li key={l.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold">{l.name}{l.status === 'new' && <span className="badge ml-2 bg-brand-orange text-white">New</span>}</div>
                      <div className="truncate text-muted">{l.source === 'viewing_request' ? 'Tour request' : 'Enquiry'}{prop ? ` · ${prop.ref}` : ''}</div>
                    </div>
                    <a href={`tel:${l.phone}`} className="shrink-0 font-semibold text-brand-greenDark hover:underline">{l.phone}</a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">No leads yet. Enquiries and tour requests on your listings will appear here.</p>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recently updated listings</h2>
            <Link href="/portal/listings" className="text-sm font-semibold text-brand-greenDark hover:underline">See all</Link>
          </div>
          {own.length > 0 ? (
            <ul className="divide-y divide-line">
              {own.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link href={`/portal/listings/${l.id}`} className="min-w-0 truncate font-medium hover:text-brand-greenDark">{l.title}</Link>
                  <span className="shrink-0 text-muted">{naira(l.price, l.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">You haven’t added any listings yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
