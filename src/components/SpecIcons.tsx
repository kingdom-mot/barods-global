import type { Property } from '@/lib/types';

type IconName = 'bed' | 'bath' | 'toilet' | 'car' | 'area';

const PATHS: Record<IconName, JSX.Element> = {
  bed: (
    <>
      <path d="M3 18v-6.5A1.5 1.5 0 0 1 4.5 10h15a1.5 1.5 0 0 1 1.5 1.5V18" />
      <path d="M3 15h18M3 18v1.5M21 18v1.5" />
      <path d="M5 10V6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V10" />
      <rect x="6.5" y="7.5" width="4.5" height="2.5" rx="0.8" />
      <rect x="13" y="7.5" width="4.5" height="2.5" rx="0.8" />
    </>
  ),
  bath: (
    <>
      <path d="M7 21V5.5A2.5 2.5 0 0 1 9.5 3h0A2.5 2.5 0 0 1 12 5.5V6" />
      <path d="M9.5 8.5a3 3 0 0 1 5 0z" />
      <path d="M10.5 12v.01M12 13.5v.01M13.5 12v.01M10.5 15v.01M13.5 15v.01M12 16.5v.01" />
    </>
  ),
  toilet: (
    <>
      <path d="M6 3h5v7H6z" />
      <path d="M4 10h14a0 0 0 0 1 0 0 6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" />
      <path d="M9 16l-1 5h7l-1-5" />
    </>
  ),
  car: (
    <>
      <path d="M5 16V12.5L6.8 8a2 2 0 0 1 1.9-1.3h6.6A2 2 0 0 1 17.2 8L19 12.5V16" />
      <path d="M3.5 12.5h17v4a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
      <path d="M6 17.5V19M18 17.5V19" />
      <circle cx="7.5" cy="15" r="0.6" />
      <circle cx="16.5" cy="15" r="0.6" />
    </>
  ),
  area: (
    <>
      <path d="M4 20V4l16 16z" />
      <path d="M8 16v-4.5L12.5 16z" />
      <path d="M4 8h2M4 12h2M8 20v-2M12 20v-2" />
    </>
  ),
};

export function SpecIcon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/** Beds, baths, toilets, parking and size as icon + number, with spoken labels for screen readers. */
export default function SpecIcons({ property: p }: { property: Property }) {
  const items: { icon: IconName; value: string | number; label: string }[] = [];
  if (p.bedrooms) items.push({ icon: 'bed', value: p.bedrooms, label: 'bedrooms' });
  if (p.bathrooms) items.push({ icon: 'bath', value: p.bathrooms, label: 'bathrooms' });
  if (p.toilets) items.push({ icon: 'toilet', value: p.toilets, label: 'toilets' });
  if (p.parking) items.push({ icon: 'car', value: p.parking, label: 'parking spaces' });
  if (p.floorSizeSqm) items.push({ icon: 'area', value: `${p.floorSizeSqm} sqm`, label: 'floor size' });
  else if (p.landSize) items.push({ icon: 'area', value: p.landSize, label: 'land size' });
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-semibold text-brand-ink">
      {items.map((it) => (
        <li key={it.icon} className="flex items-center gap-1.5" title={`${it.value} ${it.label}`}>
          <SpecIcon name={it.icon} />
          <span>{it.value}</span>
          <span className="sr-only">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
