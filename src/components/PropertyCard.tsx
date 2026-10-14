import Link from 'next/link';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import type { Agent, Property } from '@/lib/types';

const PURPOSE_LABEL = { sale: 'For Sale', rent: 'For Rent', shortlet: 'Shortlet' } as const;

export function statusBadge(p: Property) {
  if (p.availability === 'sold') return { text: 'Sold', cls: 'bg-red-700 text-white' };
  if (p.availability === 'let') return { text: 'Let', cls: 'bg-red-700 text-white' };
  return { text: PURPOSE_LABEL[p.purpose], cls: 'bg-brand-ink text-white' };
}

export function specs(p: Property) {
  const parts: string[] = [];
  if (p.bedrooms) parts.push(`${p.bedrooms} beds`);
  if (p.bathrooms) parts.push(`${p.bathrooms} baths`);
  if (p.toilets) parts.push(`${p.toilets} toilets`);
  if (p.parking) parts.push(`${p.parking} parking`);
  if (p.floorSizeSqm) parts.push(`${p.floorSizeSqm} sqm`);
  else if (p.landSize) parts.push(p.landSize);
  return parts;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function PropertyCard({
  property: p,
  agent,
  currency,
}: {
  property: Property;
  agent?: Agent;
  currency: CurrencyCode;
}) {
  const badge = statusBadge(p);
  const price = formatPrice(p.price, p.currency, p.pricePeriod, currency);
  const place = [p.area, p.city, p.state].filter(Boolean).join(', ');
  const href = `/property/${p.slug}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-lg">
      <div className="relative">
        <Link href={href} aria-label={p.title}>
          {p.photos[0] ? (
            <img src={p.photos[0]} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          ) : (
            <div className="aspect-[4/3] w-full bg-paper" />
          )}
        </Link>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className={`badge ${badge.cls}`}>{badge.text}</span>
          {p.label && p.availability === 'available' && <span className="badge bg-brand-green text-white">{p.label}</span>}
        </div>
        {agent && (
          <Link
            href={`/agent/${agent.slug}`}
            className="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-full border-[3px] border-white bg-brand-ink shadow"
            aria-label={`Listed by ${agent.fullName}`}
            title={`Listed by ${agent.fullName}`}
          >
            {agent.photoUrl ? (
              <img src={agent.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">{initials(agent.fullName)}</span>
            )}
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-8">
        <div className="text-xl font-extrabold text-brand-greenDark">{price.main}</div>
        {price.original && <div className="-mt-1 text-xs text-muted">{price.original}</div>}
        <h3 className="font-semibold leading-snug">
          <Link href={href} className="hover:text-brand-greenDark">{p.title}</Link>
        </h3>
        <p className="text-sm text-muted">{place}</p>
        <p className="text-sm">{specs(p).join(' · ')}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
          <span>{agent?.fullName ?? 'Barods Global'}</span>
          <span>{p.ref}</span>
        </div>
      </div>
    </article>
  );
}
