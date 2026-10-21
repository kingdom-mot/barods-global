import { SiteTabs, TeamEditor } from '@/components/portal/SiteForms';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Team' };

export default async function TeamContentPage() {
  const me = await requirePerm('website');
  const { data } = await createClient().from('team_members').select('*').order('sort');
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-4xl">Website</h1>
      <SiteTabs />
      <TeamEditor
        userId={me.id}
        rows={(data ?? []).map((t) => ({
          id: t.id,
          full_name: t.full_name,
          role: t.role ?? '',
          email: t.email ?? '',
          photo_url: t.photo_url ?? '',
          show_on_home: t.show_on_home,
          show_on_about: t.show_on_about ?? true,
        }))}
      />
    </div>
  );
}
