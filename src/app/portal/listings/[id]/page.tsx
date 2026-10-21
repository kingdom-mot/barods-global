import { notFound } from 'next/navigation';
import ListingForm from '@/components/portal/ListingForm';
import { STATUS_LABEL } from '@/lib/listingOptions';
import { getListingForEdit, getLookups } from '@/lib/portalData';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Edit listing' };

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const me = await requireUser();
  const supabase = createClient();
  const [listing, lookups] = await Promise.all([getListingForEdit(supabase, params.id), getLookups(supabase, me.can.listings)]);
  if (!listing) notFound();
  const st = STATUS_LABEL[listing.status ?? 'draft'];
  return (
    <>
      <div className="mx-auto mb-6 max-w-3xl">
        <p className="text-sm text-muted">{listing.ref} · <span className={`badge ${st.cls}`}>{st.text}</span></p>
        <h1 className="font-display text-4xl">Edit listing</h1>
      </div>
      <ListingForm userId={me.id} isStaff={me.can.listings} lookups={lookups} initial={listing} />
    </>
  );
}
