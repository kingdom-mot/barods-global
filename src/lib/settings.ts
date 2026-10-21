import { cache } from 'react';
import * as local from './content';
import { applyRates } from './currency';
import { supabase } from './data';
import type { TeamMember } from './types';

/**
 * Website content edited in the admin portal (Website section). Every reader falls back to the
 * built-in content, so the site still renders if the database is unreachable.
 */

export type Contact = { address: string; phone: string; whatsapp: string; email: string; tagline: string };
export type Socials = Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok', string>>;
export type Hero = { eyebrow: string; title: string; subtitle: string; image: string };
export type MortgageSettings = {
  ng_commercial_rate: number;
  ng_commercial_min_deposit: number;
  ng_commercial_max_term: number;
  nhf_rate: number;
  nhf_max_loan: number;
  nhf_max_term: number;
  za_prime_rate: number;
  reviewed: string;
};
export type Service = { slug: string; name: string; summary: string; body: string | null; image: string };
export type Partner = { name: string; logo: string; link: string | null };
/** A card in "Explore Our Properties by City" on the homepage. */
export type HomeCity = { name: string; state: string; image: string };

export const DEFAULTS = {
  contact: { ...local.contact, whatsapp: local.contact.phone } as Contact,
  socials: {} as Socials,
  hero: {
    eyebrow: 'Real Estate and Construction',
    title: 'Welcome To Barods Global Limited',
    subtitle:
      'Whether you’re buying your first home, selling property, investing in real estate, or building from the ground up, Barods is your trusted partner for excellence, innovation, and lasting value.',
    image: '/wp-content/uploads/2025/08/1-584x438.png',
  } as Hero,
  mortgage: {
    ng_commercial_rate: 22,
    ng_commercial_min_deposit: 20,
    ng_commercial_max_term: 20,
    nhf_rate: 6,
    nhf_max_loan: 15_000_000,
    nhf_max_term: 30,
    za_prime_rate: 10.5,
    reviewed: 'October 2026',
  } as MortgageSettings,
};

const settings = cache(async (): Promise<Record<string, unknown>> => {
  if (!supabase) return {};
  try {
    const { data } = await supabase.from('site_settings').select('key, value');
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
});

export async function getContact(): Promise<Contact> {
  const c = { ...DEFAULTS.contact, ...((await settings()).contact as Partial<Contact>) };
  return { ...c, whatsapp: c.whatsapp || c.phone };
}
export async function getSocials(): Promise<Socials> {
  return { ...DEFAULTS.socials, ...((await settings()).socials as Socials) };
}
export async function getHero(): Promise<Hero> {
  const h = { ...DEFAULTS.hero, ...((await settings()).hero as Partial<Hero>) };
  return { ...h, image: h.image || DEFAULTS.hero.image };
}
export const citySlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export async function getHomeCities(): Promise<HomeCity[]> {
  const saved = (await settings()).home_cities;
  if (Array.isArray(saved) && saved.length) return saved as HomeCity[];
  return local.cities.map((c) => ({ name: c.name, state: c.state, image: '' }));
}

export async function getMortgageSettings(): Promise<MortgageSettings> {
  return { ...DEFAULTS.mortgage, ...((await settings()).mortgage as Partial<MortgageSettings>) };
}

export const getTeam = cache(async (where: 'home' | 'about'): Promise<TeamMember[]> => {
  if (!supabase) return local.team;
  try {
    const { data } = await supabase.from('team_members').select('*').order('sort');
    if (!data?.length) return local.team;
    return data
      .filter((t) => (where === 'home' ? t.show_on_home : t.show_on_about ?? true))
      .map((t) => ({ name: t.full_name, role: t.role ?? '', email: t.email ?? '', photoUrl: t.photo_url ?? '' }));
  } catch {
    return local.team;
  }
});

export const getPartners = cache(async (): Promise<Partner[]> => {
  const fallback = local.partners.map((logo, i) => ({ name: `Partner ${i + 1}`, logo, link: null }));
  if (!supabase) return fallback;
  try {
    const { data } = await supabase.from('partners').select('*').order('sort');
    return data?.length ? data.map((p) => ({ name: p.name, logo: p.logo_url, link: p.link })) : fallback;
  } catch {
    return fallback;
  }
});

export const getServices = cache(async (): Promise<Service[]> => {
  const fallback = local.services.map((s) => ({ slug: s.slug, name: s.name, summary: s.summary, body: null, image: s.image }));
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from('services').select('*').order('sort');
    if (error || !data?.length) return fallback;
    return data.map((s) => ({ slug: s.slug, name: s.name, summary: s.summary ?? '', body: s.body, image: s.image_url ?? '' }));
  } catch {
    return fallback;
  }
});

/** Today's exchange rates (refreshed daily). Call before formatting prices on a page. */
export const loadRates = cache(async () => {
  if (!supabase) return {};
  try {
    const { data } = await supabase.from('currency_rates').select('currency, per_ngn, override_per_ngn, enabled');
    const rates = Object.fromEntries(
      (data ?? []).filter((r) => r.enabled).map((r) => [r.currency, Number(r.override_per_ngn ?? r.per_ngn)]),
    );
    applyRates(rates);
    return rates as Record<string, number>;
  } catch {
    return {};
  }
});
