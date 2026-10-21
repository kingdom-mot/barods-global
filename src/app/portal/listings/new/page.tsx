import ListingForm from '@/components/portal/ListingForm';
import { getLookups } from '@/lib/portalData';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Add a listing' };

export default async function NewListingPage() {
  const me = await requireUser();
  const lookups = await getLookups(createClient(), me.can.listings);
  return (
    <>
      <h1 className="mx-auto mb-6 max-w-3xl font-display text-4xl">Add a listing</h1>
      <ListingForm userId={me.id} isStaff={me.can.listings} lookups={lookups} />
    </>
  );
}
