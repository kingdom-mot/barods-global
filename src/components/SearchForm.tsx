import { cities, nigeriaStates, propertyTypes, southAfricaProvinces } from '@/lib/content';
import type { SearchParams } from '@/lib/types';

// Suggestions only: visitors can type any area, city or state.
const LOCATION_SUGGESTIONS = Array.from(
  new Set([...cities.map((c) => `${c.name}, ${c.state}`), ...nigeriaStates, ...southAfricaProvinces, 'Nigeria', 'South Africa']),
);

const PRICE_STEPS = [
  ['5000000', '₦5M'], ['10000000', '₦10M'], ['25000000', '₦25M'], ['50000000', '₦50M'],
  ['100000000', '₦100M'], ['250000000', '₦250M'], ['500000000', '₦500M'], ['1000000000', '₦1B'],
];

/**
 * Plain GET form so search works without JavaScript and every search has a shareable URL.
 * `variant="hero"` is the homepage bar; `variant="bar"` sits on top of the results page.
 */
export default function SearchForm({ values = {}, variant = 'hero' }: { values?: SearchParams; variant?: 'hero' | 'bar' }) {
  const purpose = values.purpose ?? 'sale';
  return (
    <form action="/properties" method="get" className={variant === 'hero' ? 'rounded-xl bg-white p-4 text-left shadow-xl sm:p-5' : ''}>
      <fieldset className="mb-4 flex gap-2">
        <legend className="sr-only">Purpose</legend>
        {[
          ['sale', 'Buy'],
          ['rent', 'Rent'],
          ['shortlet', 'Shortlet'],
        ].map(([v, label]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="purpose" value={v} defaultChecked={purpose === v} className="peer sr-only" />
            <span className="inline-flex min-h-[44px] items-center rounded-md bg-brand-green px-6 text-sm font-semibold text-brand-ink transition-colors hover:text-white peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-ink peer-focus-visible:ring-offset-2">
              {label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="label">
          Location
          <input
            name="location"
            type="search"
            list="location-suggestions"
            defaultValue={values.location ?? ''}
            placeholder="Area, city or state"
            autoComplete="off"
            className="field"
          />
          <datalist id="location-suggestions">
            {LOCATION_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
          </datalist>
        </label>
        <label className="label">
          Property type
          <select name="type" defaultValue={values.type ?? ''} className="field">
            <option value="">Any type</option>
            {propertyTypes.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="label">
          Max price
          <select name="maxPrice" defaultValue={values.maxPrice ?? ''} className="field">
            <option value="">Any price</option>
            {PRICE_STEPS.map(([v, l]) => <option key={v} value={v}>Up to {l}</option>)}
          </select>
        </label>
        <label className="label">
          Bedrooms
          <select name="beds" defaultValue={values.beds ?? ''} className="field">
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn-green w-full">Search</button>
        </div>
      </div>

      {variant === 'hero' && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-brand-greenDark">More search options</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="label">
              Bathrooms
              <select name="baths" className="field" defaultValue="">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label className="label">
              Furnishing
              <select name="furnishing" className="field" defaultValue="">
                <option value="">Any</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label className="label">
              Min price
              <select name="minPrice" className="field" defaultValue="">
                <option value="">No minimum</option>
                {PRICE_STEPS.map(([v, l]) => <option key={v} value={v}>From {l}</option>)}
              </select>
            </label>
            <label className="label">
              Keywords or ref
              <input name="q" type="text" placeholder="e.g. BG-10231" className="field" />
            </label>
          </div>
        </details>
      )}
    </form>
  );
}
