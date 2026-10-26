import type { Property } from './types';

/** A short description of a listing for photo alt text, e.g. "5 bedroom detached duplex for sale in Chevron, Lekki". */
export function describeProperty(p: Property): string {
  const what = [p.bedrooms ? `${p.bedrooms} bedroom` : '', (p.typeName || 'property').toLowerCase()].filter(Boolean).join(' ');
  const purpose = p.purpose === 'rent' ? 'for rent' : p.purpose === 'shortlet' ? 'shortlet' : 'for sale';
  const where = [p.area, p.city].filter(Boolean).join(', ') || p.state;
  return `${what} ${purpose}${where ? ` in ${where}` : ''}`.replace(/^./, (c) => c.toUpperCase());
}
