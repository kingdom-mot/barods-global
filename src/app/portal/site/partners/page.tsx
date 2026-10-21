import { PartnersEditor, SiteTabs } from '@/components/portal/SiteForms';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Partners' };

export default async function PartnersContentPage() {
  const me = await requirePerm('website');
  const { data } = await createClient().from('partners').select('*').order('sort');
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-4xl">Website</h1>
      <SiteTabs />
      <PartnersEditor userId={me.id} rows={data ?? []} />
    </div>
  );
}
