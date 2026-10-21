import Link from 'next/link';
import ListingRowActions from '@/components/portal/ListingRowActions';
import { STATUS_LABEL } from '@/lib/listingOptions';
import { naira } from '@/lib/portalData';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Listings' };

const FILTERS = [
  ['', 'All'],
  ['published', 'Live'],
  ['pending_review', 'Awaiting approval'],
  ['draft', 'Drafts'],
  ['sent_back', 'Sent back'],
  ['archived', 'Archived'],
] as const;

const SAVED_MSG = {
  draft: 'saved as a draft',
  submit: 'submitted for approval. An admin will review it shortly',
  publish: 'published on the website',
} as const;

export default async function ListingsPage({ searchParams }: { searchParams: { status?: string; saved?: string; as?: keyof typeof SAVED_MSG } }) {
  const me = await requireUser();
  const supabase = createClient();
  let q = supabase
    .from('properties')
    .select('id, ref, slug, title, purpose, status, availability, featured, label, price, currency, price_on_application, updated_at, review_note, agent_id, agents(full_name), property_media(url, sort, kind)')
    .order('updated_at', { ascending: false })
    .limit(300);
  if (!me.can.listings) q = q.eq('agent_id', me.agent?.id ?? '00000000-0000-0000-0000-000000000000');
  if (searchParams.status) q = q.eq('status', searchParams.status);
  const { data: rows } = await q;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl">{me.can.listings ? 'All listings' : 'My listings'}</h1>
        <Link href="/portal/listings/new" className="btn-green px-6">+ Add a listing</Link>
      </div>

      {searchParams.saved && (
        <p className="mb-5 rounded-lg bg-brand-greenLight p-3 text-sm text-brand-greenDark" role="status">
          Listing {searchParams.saved} {SAVED_MSG[searchParams.as ?? 'draft'] ?? 'saved'}.
        </p>
      )}

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {FILTERS.map(([v, l]) => (
          <Link
            key={v}
            href={v ? `/portal/listings?status=${v}` : '/portal/listings'}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              (searchParams.status ?? '') === v ? 'border-brand-green bg-brand-green text-white' : 'border-line bg-white hover:border-brand-green hover:text-brand-greenDark'
            }`}
          >
            {l}
          </Link>
        ))}
      </nav>

      {!rows || rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">No listings here yet.</p>
          <Link href="/portal/listings/new" className="btn-green mt-4">Add your first listing</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const cover = (r.property_media ?? [])
              .filter((m: { kind: string }) => m.kind === 'photo')
              .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)[0]?.url;
            const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.draft;
            const agentName = (r.agents as unknown as { full_name: string } | null)?.full_name;
            return (
              <li key={r.id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-3 sm:flex-row sm:items-center">
                <Link href={`/portal/listings/${r.id}`} className="shrink-0">
                  {cover ? (
                    <img src={cover} alt="" className="aspect-[4/3] w-full rounded-lg object-cover sm:w-36" />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-paper text-xs text-muted sm:w-36">No photo</div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${st.cls}`}>{st.text}</span>
                    {r.status === 'published' && r.availability !== 'available' && (
                      <span className="badge bg-red-700 text-white">{r.availability.replace('_', ' ')}</span>
                    )}
                    <span className="text-xs text-muted">{r.ref}</span>
                  </div>
                  <Link href={`/portal/listings/${r.id}`} className="block truncate font-semibold hover:text-brand-greenDark">{r.title}</Link>
                  <div className="text-sm text-muted">
                    {r.price_on_application ? 'Price on request' : naira(r.price, r.currency)}
                    {me.can.listings && agentName ? ` · ${agentName}` : ''}
                    {' · '}updated {new Date(r.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </div>
                  {r.status === 'sent_back' && r.review_note && <p className="mt-1 text-sm text-red-800">Admin note: {r.review_note}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <ListingRowActions id={r.id} status={r.status} availability={r.availability} purpose={r.purpose} isStaff={me.can.listings} featured={r.featured} label={r.label} />
                  {r.status === 'published' && (
                    <Link href={`/property/${r.slug}`} target="_blank" className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-green">View live</Link>
                  )}
                  <Link href={`/portal/listings/${r.id}`} className="rounded-md bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-greenDark">Edit</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
