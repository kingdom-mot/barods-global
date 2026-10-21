import { ServicesEditor, SiteTabs } from '@/components/portal/SiteForms';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Services' };

export default async function ServicesContentPage() {
  const me = await requirePerm('website');
  const { data } = await createClient().from('services').select('*').order('sort');
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-4xl">Website</h1>
      <SiteTabs />
      <ServicesEditor userId={me.id} rows={data ?? []} />
    </div>
  );
}
