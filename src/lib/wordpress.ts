import { createClient as createSupabase, type SupabaseClient } from '@supabase/supabase-js';
import * as content from './content';

/**
 * Copies Barods' WordPress (Houzez) site into Supabase: every listing, agent, photo and
 * site image. Runs on Vercel (which can reach both). Re-running it updates rather than duplicates.
 */

export const WP_ORIGIN = (process.env.WP_ORIGIN ?? 'https://barodsglobal.com').replace(/\/$/, '');
export const MEDIA_BUCKET = 'wp-media';

export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.');
  return createSupabase(url, key, { auth: { persistSession: false } });
}

// ---------- WordPress REST helpers ----------
type Term = { id: number; name: string; slug: string; parent: number };
type WpMedia = { id: number; source_url: string; media_details?: { width?: number; sizes?: Record<string, { source_url: string; width: number }> } };
type WpAgent = { id: number; slug: string; title: { rendered: string }; content: { rendered: string }; featured_media: number; agent_meta?: Record<string, unknown> };
type WpProperty = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  property_type: number[];
  property_status: number[];
  property_feature: number[];
  property_label: number[];
  property_country: number[];
  property_state: number[];
  property_city: number[];
  property_area: number[];
  property_meta?: Record<string, unknown>;
};

async function wpGet<T>(path: string): Promise<{ data: T; totalPages: number }> {
  const res = await fetch(`${WP_ORIGIN}/wp-json/wp/v2/${path}`, {
    headers: { 'User-Agent': 'BarodsMigration/1.0 (+https://barodsglobal.com)', Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(25_000),
  }).catch((e) => {
    throw new Error(e?.name === 'TimeoutError' ? `WordPress took too long to answer (${path.split('?')[0]}). Try again in a minute.` : `Couldn’t reach WordPress: ${e?.message ?? e}`);
  });
  if (!res.ok) throw new Error(`WordPress ${path.split('?')[0]} answered ${res.status}`);
  return { data: (await res.json()) as T, totalPages: Number(res.headers.get('x-wp-totalpages') ?? 1) };
}

async function wpAll<T>(path: string): Promise<T[]> {
  const sep = path.includes('?') ? '&' : '?';
  const first = await wpGet<T[]>(`${path}${sep}per_page=100&page=1`);
  const out = [...first.data];
  for (let p = 2; p <= first.totalPages; p++) out.push(...(await wpGet<T[]>(`${path}${sep}per_page=100&page=${p}`)).data);
  return out;
}

const meta = (m: Record<string, unknown> | undefined, k: string): string => {
  const v = m?.[k];
  if (Array.isArray(v)) return v[0] == null ? '' : String(v[0]);
  return v == null ? '' : String(v);
};
const metaList = (m: Record<string, unknown> | undefined, k: string): string[] => {
  const v = m?.[k];
  return Array.isArray(v) ? v.map(String).filter(Boolean) : v ? [String(v)] : [];
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', naira: '₦' };
export function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SMALL = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'from']);
const KEEP_UPPER = new Set(['BQ', 'GRA', 'FCT', 'VGC', 'VI', 'II', 'III']);
/** "BRAND NEW LUXURY 5 BED DUPLEX WITH A SWIMMING POOL & BQ" → "Brand New Luxury 5 Bed Duplex with a Swimming Pool & BQ" */
export function tidyTitle(raw: string) {
  const t = decodeEntities(raw).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
  const letters = t.replace(/[^A-Za-z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '').length;
  if (!letters || upper / letters.length < 0.7) return t; // already mixed case: leave it
  return t
    .split(' ')
    .map((w, i) => {
      const bare = w.replace(/[^A-Za-z]/g, '');
      if (KEEP_UPPER.has(bare)) return w;
      const lower = w.toLowerCase();
      if (i > 0 && SMALL.has(lower)) return lower;
      return lower.replace(/(^|[-(/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
    })
    .join(' ')
    .replace(/\bc of o\b/gi, 'C of O');
}

export function cleanSlug(s: string) {
  let d = s;
  try {
    d = decodeURIComponent(s);
  } catch {
    /* keep as is */
  }
  return d
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const num = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const int = (v: string) => {
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

/** Pick a web-friendly size: the original unless it's huge. */
function bestImage(m: WpMedia) {
  const full = m.source_url;
  const w = m.media_details?.width ?? 0;
  if (!w || w <= 2400) return full;
  const sizes = Object.values(m.media_details?.sizes ?? {}).filter((s) => s.width <= 2400).sort((a, b) => b.width - a.width);
  return sizes[0]?.source_url ?? full;
}

/** "https://barodsglobal.com/wp-content/uploads/2026/10/x.jpeg" → "2026/10/x.jpeg" */
export function uploadsPath(url: string) {
  const i = url.indexOf('/wp-content/uploads/');
  return i === -1 ? null : decodeURIComponent(url.slice(i + '/wp-content/uploads/'.length).split('?')[0]);
}
const localUrl = (path: string) => `/wp-content/uploads/${path.split('/').map(encodeURIComponent).join('/')}`;

// ---------- Type, status and location mapping ----------
function guessType(title: string, wpTypeSlugs: string[]): string {
  const t = title.toLowerCase();
  if (/\b(plot|plots|land|acre|hectare)\b/.test(t)) return /commercial/.test(t) ? 'commercial-land' : 'residential-land';
  if (/semi[- ]?detached duplex/.test(t)) return 'semi-detached-duplex';
  if (/terrace(d)? duplex/.test(t)) return 'terraced-duplex';
  if (/duplex/.test(t)) return 'detached-duplex';
  if (/semi[- ]?detached bungalow/.test(t)) return 'semi-detached-bungalow';
  if (/bungalow/.test(t)) return 'detached-bungalow';
  if (/(block of flats|units of)/.test(t)) return 'block-of-flats';
  if (/mini ?flat/.test(t)) return 'mini-flat';
  if (/self[- ]?contain/.test(t)) return 'self-contain';
  if (/(apartment|flat)/.test(t)) return 'apartment';
  if (/(shop|store)/.test(t)) return 'shop';
  if (/office/.test(t)) return 'office-space';
  if (/warehouse/.test(t)) return 'warehouse';
  const wp = wpTypeSlugs.join(' ');
  if (/land/.test(wp)) return 'residential-land';
  if (/apartment|condo|studio/.test(wp)) return 'apartment';
  if (/shop/.test(wp)) return 'shop';
  if (/office|commercial/.test(wp)) return 'office-space';
  return 'detached-duplex';
}

function purposeFrom(statusNames: string[], priceText: string): { purpose: 'sale' | 'rent' | 'shortlet'; availability: 'available' | 'sold' | 'let' } {
  const s = statusNames.join(' ').toLowerCase() + ' ' + priceText.toLowerCase();
  const purpose = /shortlet|short let|per night|\/night/.test(s) ? 'shortlet' : /rent|lease|per annum|\/year|\/yr/.test(s) ? 'rent' : 'sale';
  const availability = /\bsold\b/.test(s) ? 'sold' : /\blet\b|rented/.test(s) ? 'let' : 'available';
  return { purpose, availability };
}

type Loc = { stateId: string | null; cityId: string | null; areaId: string | null };

// ---------- Step 1: agents, site images and the list of listings ----------
// Called first with no ids (agents + returns every listing id), then repeatedly with a few ids at a
// time, so no single request runs long enough to hit Vercel's time limit.
export async function importData(opts: { ids?: number[] } = {}): Promise<{ log: string[]; ids?: number[] }> {
  const db = adminClient();
  const log: string[] = [];
  const listingPhase = Boolean(opts.ids?.length);
  const none = Promise.resolve([] as Term[]);

  const [types, statuses, features, labels, states, cities, areas, agentsWp, props, allIds] = await Promise.all([
    listingPhase ? wpAll<Term>('property_type') : none,
    listingPhase ? wpAll<Term>('property_status') : none,
    listingPhase ? wpAll<Term>('property_feature') : none,
    listingPhase ? wpAll<Term>('property_label') : none,
    listingPhase ? wpAll<Term>('property_state') : none,
    listingPhase ? wpAll<Term>('property_city') : none,
    listingPhase ? wpAll<Term>('property_area') : none,
    listingPhase ? Promise.resolve([] as WpAgent[]) : wpAll<WpAgent>('agents'),
    listingPhase
      ? wpGet<WpProperty[]>(`properties?status=publish&per_page=${opts.ids!.length}&include=${opts.ids!.join(',')}`).then((r) => r.data)
      : Promise.resolve([] as WpProperty[]),
    listingPhase ? Promise.resolve([] as { id: number }[]) : wpAll<{ id: number }>('properties?status=publish&_fields=id'),
  ]);
  const byId = (list: Term[]) => new Map(list.map((t) => [t.id, t]));
  const typeMap = byId(types), statusMap = byId(statuses), featureMap = byId(features), labelMap = byId(labels);
  const stateMap = byId(states), cityMap = byId(cities), areaMap = byId(areas);
  if (!listingPhase) log.push(`Found ${allIds.length} listings and ${agentsWp.length} agents on WordPress.`);

  // Every image we need, fetched in batches of 100.
  const mediaIds = new Set<number>();
  for (const p of props) {
    if (p.featured_media) mediaIds.add(p.featured_media);
    metaList(p.property_meta, 'fave_property_images').forEach((id) => mediaIds.add(Number(id)));
  }
  agentsWp.forEach((a) => a.featured_media && mediaIds.add(a.featured_media));
  const media = new Map<number, WpMedia>();
  const ids = [...mediaIds].filter(Boolean);
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await wpGet<WpMedia[]>(`media?per_page=100&include=${ids.slice(i, i + 100).join(',')}`);
    data.forEach((m) => media.set(m.id, m));
  }

  const copies = new Map<string, string>(); // path → source url
  const queue = (url: string) => {
    const path = uploadsPath(url);
    if (!path) return url;
    copies.set(path, url.startsWith('http') ? url : `${WP_ORIGIN}/wp-content/uploads/${path}`);
    return localUrl(path);
  };

  // Our lookup tables
  const [{ data: ourStates }, { data: ourCities }, { data: ourAreas }, { data: ourTypes }, { data: ourAmenities }, { data: ourAgents }, { data: profiles }] = await Promise.all([
    db.from('states').select('id, name, slug, country_code'),
    db.from('cities').select('id, name, slug, state_id'),
    db.from('areas').select('id, name, slug, city_id'),
    db.from('property_types').select('id, slug'),
    db.from('amenities').select('id, name, slug'),
    db.from('agents').select('id, slug, email, wp_id'),
    db.from('profiles').select('id, email'),
  ]);
  const typeId = new Map((ourTypes ?? []).map((t) => [t.slug, t.id]));
  const amenityByName = new Map((ourAmenities ?? []).map((a) => [a.name.toLowerCase(), a.id]));

  // ---- Agents ----
  const agentIdByWp = new Map<number, string>(
    (ourAgents ?? []).filter((x) => x.wp_id).map((x) => [Number(x.wp_id), x.id as string]),
  );
  for (const a of agentsWp) {
    const m = a.agent_meta ?? {};
    const email = meta(m, 'fave_agent_email').toLowerCase();
    const name = decodeEntities(a.title.rendered).trim();
    const photo = a.featured_media && media.get(a.featured_media) ? queue(bestImage(media.get(a.featured_media)!)) : null;
    const bio = htmlToText(meta(m, 'fave_agent_des') || a.content.rendered) || null;
    const existing = (ourAgents ?? []).find((x) => x.wp_id === a.id || (email && x.email?.toLowerCase() === email));
    const phone = meta(m, 'fave_agent_mobile') || meta(m, 'fave_agent_office_num') || null;
    const fields = {
      wp_id: a.id,
      full_name: name,
      email: email || `${a.slug}@barodsglobal.com`,
      ...(meta(m, 'fave_agent_position') ? { position: decodeEntities(meta(m, 'fave_agent_position')) } : {}),
      ...(phone ? { phone } : {}),
      ...(meta(m, 'fave_agent_whatsapp') || phone ? { whatsapp: meta(m, 'fave_agent_whatsapp') || phone } : {}),
      ...(photo ? { photo_url: photo } : {}),
      ...(bio ? { bio } : {}),
      socials: Object.fromEntries(
        ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok'].map((k) => [k, meta(m, `fave_agent_${k}`)]).filter(([, v]) => v),
      ),
    };
    const profileId = (profiles ?? []).find((p) => p.email.toLowerCase() === fields.email)?.id ?? null;
    if (existing) {
      // Keep the name already used on the new site (e.g. "Toyosi"), fill in anything missing.
      const { full_name: _ignored, ...rest } = fields;
      void _ignored;
      await db.from('agents').update({ ...rest, ...(profileId ? { profile_id: profileId } : {}) }).eq('id', existing.id);
      agentIdByWp.set(a.id, existing.id);
      log.push(`Agent updated: ${name}`);
    } else {
      const { data, error } = await db
        .from('agents')
        .insert({ ...fields, slug: cleanSlug(a.slug), verified: true, status: 'active', profile_id: profileId })
        .select('id')
        .single();
      if (error) log.push(`Agent ${name} not saved: ${error.message}`);
      else {
        agentIdByWp.set(a.id, data.id);
        log.push(`Agent added: ${name}`);
      }
    }
  }

  // Agents shown on the current site (Meet our team) but not set up as WordPress agents:
  // fill in any missing photo, phone or bio on their card here.
  const { data: cards } = listingPhase ? { data: [] } : await db.from('agents').select('id, slug, photo_url, phone, whatsapp, bio');
  for (const local of listingPhase ? [] : content.agents) {
    const card = (cards ?? []).find((c) => c.slug === local.slug);
    if (!card) continue;
    const patch = {
      ...(!card.photo_url && local.photoUrl ? { photo_url: queue(local.photoUrl) } : {}),
      ...(!card.phone && local.phone ? { phone: local.phone } : {}),
      ...(!card.whatsapp && (local.whatsapp ?? local.phone) ? { whatsapp: local.whatsapp ?? local.phone } : {}),
      ...(!card.bio && local.bio ? { bio: local.bio } : {}),
    };
    if (Object.keys(patch).length) await db.from('agents').update(patch).eq('id', card.id);
  }

  // ---- Locations ----
  const norm = (s: string) => s.toLowerCase().replace(/\bstate\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  async function resolveLocation(p: WpProperty, text: string): Promise<Loc> {
    const stateTerm = p.property_state.map((id) => stateMap.get(id)?.name).find(Boolean) ?? '';
    const cityTerm = p.property_city.map((id) => cityMap.get(id)?.name).find(Boolean) ?? '';
    const areaTerm = p.property_area.map((id) => areaMap.get(id)?.name).find((n) => n && !/^\d+$/.test(n.trim())) ?? '';
    const hay = ` ${norm(text)} `;

    // 1. A known area named in the address or title wins (e.g. "Chevron", "Ibara GRA").
    const area = (ourAreas ?? [])
      .filter((a) => hay.includes(` ${norm(a.name)} `) || (areaTerm && norm(a.name) === norm(areaTerm)))
      .sort((a, b) => b.name.length - a.name.length)[0];
    let city = area ? (ourCities ?? []).find((c) => c.id === area.city_id) : undefined;
    // 2. Otherwise a known city named in the text, then the WordPress city.
    city ??= (ourCities ?? []).filter((c) => hay.includes(` ${norm(c.name)} `)).sort((a, b) => b.name.length - a.name.length)[0];
    city ??= (ourCities ?? []).find((c) => cityTerm && norm(c.name) === norm(cityTerm));
    let state = city ? (ourStates ?? []).find((s) => s.id === city!.state_id) : undefined;
    state ??= (ourStates ?? []).find((s) => stateTerm && norm(s.name) === norm(stateTerm));

    // 3. Unknown WordPress area: add it under the city so it shows in the agent form too.
    let areaId = area?.id ?? null;
    if (!areaId && areaTerm && city) {
      const { data } = await db.from('areas').upsert({ city_id: city.id, name: areaTerm, slug: cleanSlug(areaTerm) }, { onConflict: 'city_id,slug' }).select('id').single();
      areaId = data?.id ?? null;
    }
    return { stateId: state?.id ?? null, cityId: city?.id ?? null, areaId };
  }

  // ---- Listings ----
  let saved = 0;
  for (const p of props) {
    const m = p.property_meta ?? {};
    const rawTitle = decodeEntities(p.title.rendered);
    const title = tidyTitle(rawTitle);
    const statusNames = p.property_status.map((id) => statusMap.get(id)?.name ?? '');
    const priceText = [meta(m, 'fave_property_price_prefix'), meta(m, 'fave_property_price'), meta(m, 'fave_property_price_postfix')].join(' ');
    const { purpose, availability } = purposeFrom(statusNames, priceText);
    const typeSlug = guessType(rawTitle, p.property_type.map((id) => typeMap.get(id)?.slug ?? ''));
    const isLand = typeSlug.endsWith('-land');
    const address = decodeEntities(meta(m, 'fave_property_address') || meta(m, 'fave_property_map_address')).trim();
    const loc = await resolveLocation(p, `${address} ${rawTitle}`);

    // Title document from Houzez "additional features" (e.g. "C of O").
    const extra = meta(m, 'additional_features');
    const extraTitles = [...extra.matchAll(/fave_additional_feature_title";s:\d+:"([^"]*)"/g)].map((x) => x[1]);
    const titleDoc = extraTitles.find((x) => /c\s*of\s*o|consent|deed|survey|excision|gazette|certificate/i.test(x)) ?? null;

    const size = num(meta(m, 'fave_property_size'));
    const sizeUnit = meta(m, 'fave_property_size_prefix') || 'sqm';
    const land = num(meta(m, 'fave_property_land'));
    const landUnit = meta(m, 'fave_property_land_postfix') || 'sqm';
    const price = num(meta(m, 'fave_property_price'));
    const label = p.property_label.map((id) => labelMap.get(id)?.name).find(Boolean) ?? null;
    const lat = num(meta(m, 'houzez_geolocation_lat'));
    const lng = num(meta(m, 'houzez_geolocation_long'));

    // Photos: cover first, then the gallery order from WordPress.
    const imageIds = [String(p.featured_media || ''), ...metaList(m, 'fave_property_images')].filter((v, i, a) => v && v !== '0' && a.indexOf(v) === i);
    const photos = imageIds.map((id) => media.get(Number(id))).filter(Boolean).map((md) => queue(bestImage(md!)));

    const agentWp = Number(metaList(m, 'fave_agents')[0] ?? 0);
    const slug = cleanSlug(p.slug);
    const row = {
      wp_id: p.id,
      wp_slug: (() => {
        try {
          return decodeURIComponent(p.slug);
        } catch {
          return p.slug;
        }
      })(),
      slug,
      title,
      description: htmlToText(p.content.rendered) || null,
      purpose,
      availability,
      property_type_id: typeId.get(typeSlug) ?? null,
      country_code: 'NG',
      state_id: loc.stateId,
      city_id: loc.cityId,
      area_id: loc.areaId,
      address: address || null,
      lat,
      lng,
      price,
      price_on_application: !price,
      currency: 'NGN',
      price_period: purpose === 'rent' ? 'year' : purpose === 'shortlet' ? 'night' : 'once',
      bedrooms: isLand ? null : int(meta(m, 'fave_property_bedrooms')),
      bathrooms: isLand ? null : int(meta(m, 'fave_property_bathrooms')),
      parking: isLand ? null : int(meta(m, 'fave_property_garage')),
      floor_size_sqm: !isLand && size && /m|sq/i.test(sizeUnit) ? Math.round(size) : null,
      land_size: land ? `${land.toLocaleString('en-NG')} ${landUnit}` : isLand && size ? `${size.toLocaleString('en-NG')} ${sizeUnit}` : null,
      has_bq: /\bbq\b|boys.? ?quarters?/i.test(rawTitle),
      title_document: titleDoc,
      video_url: meta(m, 'fave_video_url') || null,
      virtual_tour_url: meta(m, 'fave_virtual_tour').match(/src="([^"]+)"/)?.[1] ?? (meta(m, 'fave_virtual_tour').startsWith('http') ? meta(m, 'fave_virtual_tour') : null),
      featured: meta(m, 'fave_featured') === '1',
      label,
      status: 'published',
      published_at: p.date,
    };

    // Same listing already here (earlier import, or seeded with the same web address)? Update it.
    // Match by WordPress ID; otherwise only claim a same-address listing that didn't come from WordPress
    // (e.g. the two seeded at launch), never another imported listing.
    const { data: byWp } = await db.from('properties').select('id').eq('wp_id', p.id).maybeSingle();
    const { data: bySlug } = byWp ? { data: null } : await db.from('properties').select('id').eq('slug', slug).is('wp_id', null).maybeSingle();
    let id = (byWp ?? bySlug)?.id as string | undefined;
    // If WordPress points at an agent that no longer exists, keep whoever is assigned here.
    const agentId = agentIdByWp.get(agentWp);
    if (id) {
      // Keep the web address it already has (it may have been given a suffix to avoid a clash).
      const { slug: _keepSlug, ...updateRow } = row;
      void _keepSlug;
      const { error } = await db.from('properties').update({ ...updateRow, ...(agentId ? { agent_id: agentId } : {}) }).eq('id', id);
      if (error) {
        log.push(`✗ ${title}: ${error.message}`);
        continue;
      }
    } else {
      // Two WordPress listings can clean up to the same address; keep both.
      const { data: clash } = await db.from('properties').select('id').eq('slug', slug).maybeSingle();
      const { data, error } = await db.from('properties').insert({ ...row, agent_id: agentId ?? null, slug: clash ? `${slug}-${p.id}` : slug }).select('id').single();
      if (error || !data) {
        log.push(`✗ ${title}: ${error?.message}`);
        continue;
      }
      id = data.id;
    }

    await db.from('property_media').delete().eq('property_id', id).eq('kind', 'photo');
    if (photos.length) await db.from('property_media').insert(photos.map((url, sort) => ({ property_id: id, kind: 'photo', url, sort })));

    // Features: match ours by name, add any we don't have yet.
    const featureNames = p.property_feature.map((fid) => featureMap.get(fid)?.name).filter(Boolean) as string[];
    const amenityIds: string[] = [];
    for (const f of featureNames) {
      let aid = amenityByName.get(f.toLowerCase());
      if (!aid) {
        const { data } = await db.from('amenities').upsert({ group_name: 'Other features', name: f, slug: cleanSlug(f) }, { onConflict: 'slug' }).select('id').single();
        if (data) {
          aid = data.id;
          amenityByName.set(f.toLowerCase(), data.id);
        }
      }
      if (aid) amenityIds.push(aid);
    }
    await db.from('property_amenities').delete().eq('property_id', id);
    if (amenityIds.length) await db.from('property_amenities').insert(amenityIds.map((amenity_id) => ({ property_id: id, amenity_id })));
    saved++;
  }
  if (listingPhase) log.push(`Saved ${saved} of ${props.length}: ${props.map((p) => tidyTitle(decodeEntities(p.title.rendered)).slice(0, 48)).join(' · ')}`);

  // ---- Site images used on the pages (team, partners, services, hero) ----
  if (!listingPhase) {
    const siteImages = JSON.stringify(content).match(/\/wp-content\/uploads\/[^"'\s)]+/g) ?? [];
    siteImages.forEach((u) => queue(u));
    queue(`${WP_ORIGIN}/wp-content/uploads/2025/08/1-584x438.png`); // homepage hero
  }

  const rows = [...copies.entries()].map(([path, source_url]) => ({ path, source_url }));
  for (let i = 0; i < rows.length; i += 200) {
    await db.from('wp_media_copy').upsert(rows.slice(i, i + 200), { onConflict: 'path', ignoreDuplicates: true });
  }
  if (rows.length) log.push(`${rows.length} images queued for copying.`);
  return { log, ...(listingPhase ? {} : { ids: allIds.map((x) => x.id) }) };
}

// ---------- Step 2: copy images into Supabase storage, a few at a time ----------
export async function copyMediaBatch(limit = 8) {
  const db = adminClient();
  const { data: batch } = await db.from('wp_media_copy').select('path, source_url').eq('status', 'pending').limit(limit);
  const results: { path: string; ok: boolean; error?: string }[] = [];
  for (const item of batch ?? []) {
    try {
      const res = await fetch(item.source_url, { cache: 'no-store', headers: { 'User-Agent': 'BarodsMigration/1.0' } });
      if (!res.ok) throw new Error(`download ${res.status}`);
      const body = await res.arrayBuffer();
      const { error } = await db.storage.from(MEDIA_BUCKET).upload(item.path, body, {
        contentType: res.headers.get('content-type') ?? 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });
      if (error) throw new Error(error.message);
      await db.from('wp_media_copy').update({ status: 'done', error: null, updated_at: new Date().toISOString() }).eq('path', item.path);
      results.push({ path: item.path, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.from('wp_media_copy').update({ status: 'error', error: msg, updated_at: new Date().toISOString() }).eq('path', item.path);
      results.push({ path: item.path, ok: false, error: msg });
    }
  }
  return { results, ...(await mediaProgress(db)) };
}

export async function mediaProgress(db = adminClient()) {
  const count = async (status?: string) => {
    let q = db.from('wp_media_copy').select('path', { count: 'exact', head: true });
    if (status) q = q.eq('status', status);
    return (await q).count ?? 0;
  };
  const [total, done, errors] = await Promise.all([count(), count('done'), count('error')]);
  return { total, done, errors, pending: total - done - errors };
}

export async function retryFailed() {
  const db = adminClient();
  await db.from('wp_media_copy').update({ status: 'pending', error: null }).eq('status', 'error');
  return mediaProgress(db);
}
