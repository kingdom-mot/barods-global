import Link from 'next/link';
import { HomeCitiesEditor, LocationList, SiteTabs } from '@/components/portal/SiteForms';
import { getHomeCities } from '@/lib/settings';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Locations' };

/** Country → state → city → area. Add the cities and areas agents ask for; hide ones you don't use. */
export default async function LocationsPage({ searchParams }: { searchParams: { state?: string; city?: string } }) {
  const me = await requirePerm('website');
  const supabase = createClient();
  const homeCities = await getHomeCities();
  const { data: states } = await supabase.from('states').select('id, name, country_code').order('country_code').order('name');
  const state = (states ?? []).find((s) => s.id === searchParams.state) ?? (states ?? []).find((s) => s.name === 'Ogun');
  const [{ data: cities }, cityRes] = await Promise.all([
    state ? supabase.from('cities').select('id, name, active').eq('state_id', state.id).order('name') : Promise.resolve({ data: [] }),
    searchParams.city ? supabase.from('cities').select('id, name, state_id').eq('id', searchParams.city).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const city = cityRes.data && cityRes.data.state_id === state?.id ? cityRes.data : null;
  const { data: areas } = city ? await supabase.from('areas').select('id, name, active').eq('city_id', city.id).order('name') : { data: [] };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-4xl">Website</h1>
      <SiteTabs />
      <HomeCitiesEditor userId={me.id} initial={homeCities} />
      <h2 className="mb-1 font-semibold">Location lists</h2>
      <p className="mb-5 text-sm text-muted">These lists feed the location dropdowns in the listing form. Hidden ones stay on existing listings but can’t be picked for new ones.</p>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_1fr]">
        <nav className="max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white p-2" aria-label="States">
          {['NG', 'ZA'].map((cc) => (
            <div key={cc}>
              <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-muted">{cc === 'NG' ? 'Nigeria' : 'South Africa'}</div>
              {(states ?? []).filter((s) => s.country_code === cc).map((s) => (
                <Link key={s.id} href={`/portal/site/locations?state=${s.id}`} className={`block rounded-md px-3 py-1.5 text-sm ${s.id === state?.id ? 'bg-brand-green font-semibold text-white' : 'hover:bg-paper'}`}>
                  {s.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        {state && (
          <LocationList kind="city" parentId={state.id} parentName={state.name} items={cities ?? []} linkBase={`/portal/site/locations?state=${state.id}&city=`} />
        )}
        {city ? (
          <LocationList kind="area" parentId={city.id} parentName={city.name} items={areas ?? []} />
        ) : (
          <div className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">Pick a city to see and add its areas.</div>
        )}
      </div>
    </div>
  );
}
