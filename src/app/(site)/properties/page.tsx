import type { Metadata } from 'next';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchForm from '@/components/SearchForm';
import { getAgents, searchProperties } from '@/lib/data';
import type { SearchParams } from '@/lib/types';
import { getVisitorCurrency } from '@/lib/visitor';

export const metadata: Metadata = {
  title: 'Properties for Sale, Rent and Shortlet',
  description: 'Search homes, land and commercial property listed by Barods Global across Nigeria and South Africa.',
};

const PURPOSE_TITLE: Record<string, string> = { sale: 'for sale', rent: 'for rent', shortlet: 'shortlets' };

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const currency = getVisitorCurrency();
  const [results, agents] = await Promise.all([searchProperties(searchParams), getAgents()]);
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
  const baseHeading = searchParams.purpose ? `Properties ${PURPOSE_TITLE[searchParams.purpose] ?? ''}` : 'All properties';
  const heading = searchParams.location?.trim() ? `${baseHeading} in ${searchParams.location.trim().replace(/\b\w/g, (c) => c.toUpperCase())}` : baseHeading;

  const sortLink = (sort: string) => {
    const q = new URLSearchParams(searchParams as Record<string, string>);
    q.set('sort', sort);
    return `/properties?${q.toString()}`;
  };

  return (
    <>
      <section className="border-b border-line bg-paper py-6">
        <div className="container-site">
          <SearchForm values={searchParams} variant="bar" />
        </div>
      </section>

      <section className="container-site flex flex-wrap gap-8 py-10">
        <aside className="w-full lg:w-72 lg:shrink-0">
          <form action="/properties" method="get" className="flex flex-col gap-4 rounded-xl border border-line p-5">
            <h2 className="font-semibold">More search options</h2>
            {/* keep the top-bar choices when refining */}
            {(['purpose', 'location', 'state', 'city', 'type', 'maxPrice', 'beds', 'sort'] as const).map(
              (k) => searchParams[k] && <input key={k} type="hidden" name={k} value={searchParams[k]} />,
            )}
            <label className="label">
              Bathrooms
              <select name="baths" defaultValue={searchParams.baths ?? ''} className="field">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label className="label">
              Furnishing
              <select name="furnishing" defaultValue={searchParams.furnishing ?? ''} className="field">
                <option value="">Any</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label className="label">
              Listing status
              <select name="status" defaultValue={searchParams.status ?? ''} className="field">
                <option value="">Available only</option>
                <option value="all">Include Sold / Let</option>
                <option value="sold">Sold / Let only</option>
              </select>
            </label>
            <label className="label">
              Keywords or ref
              <input name="q" defaultValue={searchParams.q ?? ''} placeholder="e.g. BG-10231" className="field" />
            </label>
            <button type="submit" className="btn-green">Apply filters</button>
            <Link href="/properties" className="text-center text-sm text-muted hover:text-brand-ink">Clear all</Link>
          </form>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl">{heading}</h1>
              <p className="text-sm text-muted">
                {results.length} {results.length === 1 ? 'result' : 'results'} · prices shown in your currency
              </p>
            </div>
            <div className="flex gap-2 text-sm" role="group" aria-label="Sort">
              <Link href={sortLink('newest')} className="rounded-md border border-line px-3 py-2 hover:border-brand-green hover:text-brand-green">Newest</Link>
              <Link href={sortLink('price-asc')} className="rounded-md border border-line px-3 py-2 hover:border-brand-green hover:text-brand-green">Price ↑</Link>
              <Link href={sortLink('price-desc')} className="rounded-md border border-line px-3 py-2 hover:border-brand-green hover:text-brand-green">Price ↓</Link>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center">
              <p className="font-semibold">No properties match this search yet.</p>
              <p className="mt-1 text-sm text-muted">Try a wider location or price, or talk to an agent about what you need.</p>
              <Link href="/contact-us" className="btn-green mt-5">Talk to an agent</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <PropertyCard key={p.ref} property={p} agent={agentBySlug.get(p.agentSlug)} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
