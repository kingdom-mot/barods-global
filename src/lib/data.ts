import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as local from './content';
import type { Agent, Property, SearchParams } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Never let a slow database hold a page: give up after 5s and fall back to built-in content.
const fetchWithTimeout: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(5000) });

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { global: { fetch: fetchWithTimeout } }) : null;

function mapProperty(r: any): Property {
  const photos = (r.property_media ?? [])
    .filter((m: any) => m.kind === 'photo' && m.is_public)
    .sort((a: any, b: any) => a.sort - b.sort)
    .map((m: any) => m.url);
  return {
    ref: r.ref,
    slug: r.slug,
    wpSlug: r.wp_slug ?? undefined,
    title: r.title,
    description: r.description ?? undefined,
    purpose: r.purpose,
    typeName: r.property_types?.name ?? '',
    typeSlug: r.property_types?.slug ?? '',
    countryCode: r.country_code,
    state: r.states?.name ?? '',
    stateSlug: r.states?.slug ?? '',
    city: r.cities?.name ?? '',
    citySlug: r.cities?.slug ?? '',
    area: r.areas?.name ?? undefined,
    address: r.address ?? undefined,
    price: r.price_on_application ? null : Number(r.price),
    currency: r.currency,
    pricePeriod: r.price_period ?? 'once',
    bedrooms: r.bedrooms ?? undefined,
    bathrooms: r.bathrooms ?? undefined,
    toilets: r.toilets ?? undefined,
    parking: r.parking ?? undefined,
    floorSizeSqm: r.floor_size_sqm ?? undefined,
    landSize: r.land_size ?? undefined,
    condition: r.condition ?? undefined,
    furnishing: r.furnishing ?? undefined,
    titleDocument: r.title_document ?? undefined,
    amenities: (r.property_amenities ?? []).map((a: any) => a.amenities?.name).filter(Boolean),
    photos,
    agentSlug: r.agents?.slug ?? '',
    featured: r.featured,
    label: r.label ?? undefined,
    availability: r.availability,
    publishedAt: r.published_at ?? r.created_at,
    updatedAt: r.updated_at ?? undefined,
    videoUrl: r.video_url ?? undefined,
    virtualTourUrl: r.virtual_tour_url ?? undefined,
    serviceCharge: r.service_charge_band ?? undefined,
    agencyFee: r.agency_fee_pct != null ? `${r.agency_fee_pct}% of rent` : undefined,
    legalFee: r.legal_fee_pct != null ? `${r.legal_fee_pct}% of rent` : undefined,
    cautionFee: r.caution_fee ?? undefined,
    minimumTenure: r.minimum_tenure_years ? `${r.minimum_tenure_years} year(s)` : undefined,
  };
}

function mapAgent(r: any): Agent {
  return {
    slug: r.slug,
    fullName: r.full_name,
    position: r.position ?? '',
    email: r.email,
    phone: r.phone ?? undefined,
    whatsapp: r.whatsapp ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    bio: r.bio ?? undefined,
    verified: r.verified,
  };
}

const PROPERTY_SELECT =
  '*, property_types(name, slug), states(name, slug), cities(name, slug), areas(name), agents(slug), property_media(url, kind, is_public, sort), property_amenities(amenities(name))';

// cache(): one database query per page render, however many components ask.
const allProperties = cache(async (): Promise<Property[]> => {
  if (!supabase) return local.properties;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error || !data || data.length === 0) return local.properties;
    return data.map(mapProperty);
  } catch {
    return local.properties;
  }
});

export const getAgents = cache(async (): Promise<Agent[]> => {
  if (!supabase) return local.agents;
  try {
    const { data, error } = await supabase.from('agents').select('*').eq('status', 'active').order('full_name');
    if (error || !data || data.length === 0) return local.agents;
    return data.map(mapAgent);
  } catch {
    return local.agents;
  }
});

export async function getAgent(slug: string): Promise<Agent | undefined> {
  return (await getAgents()).find((a) => a.slug === slug);
}

/** Homepage: at most 6 featured listings. The rest still lead the Properties page. */
export async function getFeatured(limit = 6): Promise<Property[]> {
  limit = Math.min(limit, 6);
  const all = await allProperties();
  return all.filter((p) => p.featured && p.availability === 'available').slice(0, limit);
}

export async function getProperty(slug: string): Promise<Property | undefined> {
  return (await allProperties()).find((p) => p.slug === slug);
}

/** An old WordPress address (e.g. with an emoji in it) → the listing now at a clean address. */
export async function getPropertyByWpSlug(slug: string): Promise<Property | undefined> {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    /* already decoded */
  }
  return (await allProperties()).find((p) => p.wpSlug === decoded || p.wpSlug === slug);
}

export async function getAgentProperties(agentSlug: string): Promise<Property[]> {
  return (await allProperties()).filter((p) => p.agentSlug === agentSlug);
}

export async function getCityCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const p of await allProperties()) counts[p.citySlug] = (counts[p.citySlug] ?? 0) + 1;
  return counts;
}

// A search for a whole group ("House", "Land") or an old WordPress type name matches every type in it.
const GROUP_SLUG: Record<string, string> = { 'Flat / Apartment': 'flat-apartment', House: 'house', Land: 'land', Commercial: 'commercial' };
const TYPE_GROUPS: Record<string, string[]> = Object.fromEntries(
  local.propertyTypes.map((g) => [GROUP_SLUG[g.group], g.items.map(([slug]) => slug as string)]),
);
TYPE_GROUPS.bungalow = ['detached-bungalow', 'semi-detached-bungalow'];
const TYPE_ALIASES: Record<string, string> = {
  apartments: 'flat-apartment',
  houses: 'house',
  residential: 'house',
  office: 'office-space',
  condo: 'apartment',
  studio: 'self-contain',
  townhome: 'terraced-duplex',
  'multi-family-home': 'block-of-flats',
  'single-family-home': 'detached-duplex',
};
function typeMatches(slug: string, filter: string) {
  const f = TYPE_ALIASES[filter] ?? filter;
  return slug === f || (TYPE_GROUPS[f]?.includes(slug) ?? false);
}

const featureSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Selected feature slugs from the URL, however they were sent. */
export function selectedFeatures(s: SearchParams): string[] {
  const raw = Array.isArray(s.features) ? s.features : s.features ? [s.features] : [];
  return [...new Set(raw.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean))];
}

/** The features listed most often on live listings, for the search filters. */
export async function featureOptions(limit = 12): Promise<{ slug: string; name: string; count: number }[]> {
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of await allProperties()) {
    if (p.availability === 'sold' || p.availability === 'let') continue;
    for (const name of new Set(p.amenities ?? [])) {
      const slug = featureSlug(name);
      if (!slug) continue;
      const c = counts.get(slug) ?? { slug, name, count: 0 };
      c.count++;
      counts.set(slug, c);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

export async function searchProperties(s: SearchParams): Promise<Property[]> {
  let list = await allProperties();
  const num = (v?: string) => (v ? Number(v) : undefined);

  // Sold / Let listings are hidden unless asked for.
  if (s.status === 'sold') list = list.filter((p) => p.availability === 'sold' || p.availability === 'let');
  else if (s.status !== 'all') list = list.filter((p) => p.availability !== 'sold' && p.availability !== 'let');

  if (s.purpose) list = list.filter((p) => p.purpose === s.purpose);
  if (s.state) list = list.filter((p) => p.stateSlug === s.state);
  if (s.location?.trim()) {
    // Free-text location: every comma-separated part must match the area, city, state or country.
    const parts = s.location
      .toLowerCase()
      .replace(/-/g, ' ')
      .split(',')
      .map((t) => t.replace(/\bstate\b/g, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const country: Record<string, string> = { NG: 'nigeria', ZA: 'south africa' };
    list = list.filter((p) => {
      const haystack = [p.area, p.city, p.state, p.stateSlug.replace(/-/g, ' '), country[p.countryCode]]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();
      return parts.every((t) => haystack.includes(t));
    });
  }
  if (s.city) list = list.filter((p) => p.citySlug === s.city);
  if (s.type) list = list.filter((p) => typeMatches(p.typeSlug, s.type!));
  if (s.furnishing) list = list.filter((p) => p.furnishing?.toLowerCase() === s.furnishing);
  const beds = num(s.beds);
  if (beds) list = list.filter((p) => (p.bedrooms ?? 0) >= beds);
  const baths = num(s.baths);
  if (baths) list = list.filter((p) => (p.bathrooms ?? 0) >= baths);
  const min = num(s.minPrice);
  if (min) list = list.filter((p) => (p.price ?? 0) >= min);
  const max = num(s.maxPrice);
  if (max) list = list.filter((p) => p.price !== null && p.price <= max);
  const wanted = selectedFeatures(s);
  if (wanted.length) {
    // Listings must have every ticked feature.
    list = list.filter((p) => {
      const has = new Set((p.amenities ?? []).map(featureSlug));
      return wanted.every((f) => has.has(f));
    });
  }
  if (s.q) {
    const q = s.q.toLowerCase();
    list = list.filter((p) =>
      [p.title, p.ref, p.city, p.area, p.state, p.typeName].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  // Default order: featured listings first (newest first within each group). Price sorts ignore featuring.
  if (!s.sort || s.sort === 'newest') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  if (s.sort === 'price-asc') list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (s.sort === 'price-desc') list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  return list;
}

export { local };
