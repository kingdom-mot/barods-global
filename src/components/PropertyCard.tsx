import Link from 'next/link';
import { describeProperty } from '@/lib/describe';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import type { Agent, Property } from '@/lib/types';
import SpecIcons from './SpecIcons';

const PURPOSE_LABEL = { sale: 'For Sale', rent: 'For Rent', shortlet: 'Shortlet' } as const;

export function statusBadge(p: Property) {
  if (p.availability === 'sold') return { text: 'Sold', cls: 'bg-red-700 text-white' };
  if (p.availability === 'let') return { text: 'Let', cls: 'bg-red-700 text-white' };
  return { text: PURPOSE_LABEL[p.purpose], cls: 'bg-brand-ink text-white' };
}

function NoPhoto({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-paper text-muted ${className}`}>
      <img src="/brand/icon.png" alt="" className="h-10 w-10 opacity-30" />
      <span className="text-xs font-semibold uppercase tracking-wide">Photos coming soon</span>
    </div>
  );
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
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-lg">
      <div className="relative">
        <Link href={href} aria-label={p.title}>
          {p.photos[0] ? (
            <img src={p.photos[0]} alt={describeProperty(p)} className="aspect-[3/2] w-full object-cover" loading="lazy" />
          ) : (
            <NoPhoto className="aspect-[3/2] w-full" />
          )}
        </Link>
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <span className={`badge ${badge.cls}`}>{badge.text}</span>
          {p.label && p.availability === 'available' && <span className="badge bg-brand-green text-white">{p.label}</span>}
        </div>
        {agent && (
          <Link
            href={`/agent/${agent.slug}?from=${encodeURIComponent(p.slug)}`}
            className="absolute -bottom-5 left-3.5 h-11 w-11 overflow-hidden rounded-full border-[3px] border-white bg-brand-ink shadow"
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

      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-7">
        <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-[-0.01em] text-brand-ink">
          <Link href={href} className="hover:text-brand-greenDark">{p.title}</Link>
        </h3>
        <p className="truncate text-[13px] font-medium text-brand-orange">{place}</p>
        <div className="mt-1 text-lg font-extrabold text-brand-greenDark">{price.main}</div>
        {price.original && <div className="-mt-1 text-xs text-muted">{price.original}</div>}
        <div className="mb-2.5 mt-1.5"><SpecIcons property={p} /></div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5 text-xs text-muted">
          <span className="truncate">{agent?.fullName ?? 'Barods Global'}</span>
          <span>{p.ref}</span>
        </div>
      </div>
    </article>
  );
}
