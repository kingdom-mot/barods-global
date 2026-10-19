'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireStaff } from '@/lib/supabase/server';

type R = { ok: true; message?: string } | { ok: false; error: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const clean = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);

async function log(action: string, entity: string, entityId = '') {
  const me = await requireStaff();
  await createClient().from('activity_log').insert({ actor: me.id, action, entity, entity_id: entityId });
}
function refreshSite() {
  revalidatePath('/', 'layout');
}

// ---------- Settings ----------
export async function saveSettings(key: 'contact' | 'socials' | 'hero' | 'mortgage' | 'lead_recipients', value: unknown): Promise<R> {
  await requireStaff();
  let v: unknown;
  if (key === 'contact') {
    const c = value as Record<string, string>;
    if (!EMAIL.test(clean(c.email))) return { ok: false, error: 'Enter a valid contact email.' };
    v = { address: clean(c.address, 300), phone: clean(c.phone, 40), whatsapp: clean(c.whatsapp, 40), email: clean(c.email, 160), tagline: clean(c.tagline, 200) };
  } else if (key === 'socials') {
    const s = value as Record<string, string>;
    const out: Record<string, string> = {};
    for (const k of ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok']) {
      const u = clean(s[k], 300);
      if (u && !/^https?:\/\//.test(u)) return { ok: false, error: `The ${k} link must start with https://` };
      out[k] = u;
    }
    v = out;
  } else if (key === 'hero') {
    const h = value as Record<string, string>;
    if (!clean(h.title)) return { ok: false, error: 'The headline can’t be empty.' };
    v = { eyebrow: clean(h.eyebrow, 80), title: clean(h.title, 120), subtitle: clean(h.subtitle, 400), image: clean(h.image, 500) };
  } else if (key === 'mortgage') {
    const m = value as Record<string, unknown>;
    const n = (k: string, min: number, max: number) => {
      const x = Number(m[k]);
      if (!Number.isFinite(x) || x < min || x > max) throw new Error(k);
      return x;
    };
    try {
      v = {
        ng_commercial_rate: n('ng_commercial_rate', 0, 60),
        ng_commercial_min_deposit: n('ng_commercial_min_deposit', 0, 90),
        ng_commercial_max_term: n('ng_commercial_max_term', 1, 40),
        nhf_rate: n('nhf_rate', 0, 60),
        nhf_max_loan: n('nhf_max_loan', 0, 1e12),
        nhf_max_term: n('nhf_max_term', 1, 40),
        za_prime_rate: n('za_prime_rate', 0, 60),
        reviewed: new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
      };
    } catch {
      return { ok: false, error: 'Check the mortgage numbers: one of them is outside a sensible range.' };
    }
  } else {
    const list = (value as string[]).map((e) => clean(e, 160).toLowerCase()).filter(Boolean);
    const bad = list.find((e) => !EMAIL.test(e));
    if (bad) return { ok: false, error: `“${bad}” isn’t a valid email.` };
    v = [...new Set(list)];
  }
  const { error } = await createClient().from('site_settings').upsert({ key, value: v });
  if (error) return { ok: false, error: error.message };
  await log(`updated ${key.replace('_', ' ')}`, 'settings', key);
  refreshSite();
  return { ok: true, message: 'Saved. The website shows the change straight away.' };
}

// ---------- Team ----------
export type TeamInput = { id?: string; full_name: string; role: string; email: string; photo_url: string; show_on_home: boolean; show_on_about: boolean };
export async function saveTeamMember(t: TeamInput): Promise<R> {
  await requireStaff();
  if (!clean(t.full_name)) return { ok: false, error: 'Add a name.' };
  if (t.email && !EMAIL.test(t.email)) return { ok: false, error: 'That email doesn’t look right.' };
  const supabase = createClient();
  const row = {
    full_name: clean(t.full_name, 120),
    role: clean(t.role, 120) || null,
    email: clean(t.email, 160).toLowerCase() || null,
    photo_url: clean(t.photo_url, 500) || null,
    show_on_home: t.show_on_home,
    show_on_about: t.show_on_about,
  };
  let error;
  if (t.id) ({ error } = await supabase.from('team_members').update(row).eq('id', t.id));
  else {
    const { data: last } = await supabase.from('team_members').select('sort').order('sort', { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from('team_members').insert({ ...row, sort: (last?.sort ?? 0) + 1 }));
  }
  if (error) return { ok: false, error: error.message };
  await log(t.id ? 'updated team member' : 'added team member', 'team', row.full_name);
  refreshSite();
  return { ok: true, message: 'Saved.' };
}
export async function deleteTeamMember(id: string): Promise<R> {
  await requireStaff();
  const { error } = await createClient().from('team_members').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log('removed team member', 'team', id);
  refreshSite();
  return { ok: true };
}

/** Swap an item with its neighbour (for team, partners and services). */
export async function moveItem(table: 'team_members' | 'partners' | 'services', id: string, dir: -1 | 1): Promise<R> {
  await requireStaff();
  const supabase = createClient();
  const { data: rows } = await supabase.from(table).select('id, sort').order('sort');
  const list = rows ?? [];
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  // Renumber everything so equal sort values can't get stuck.
  const order = list.map((r) => r.id);
  [order[i], order[j]] = [order[j], order[i]];
  await Promise.all(order.map((rid, k) => supabase.from(table).update({ sort: k + 1 }).eq('id', rid)));
  refreshSite();
  return { ok: true };
}

// ---------- Partners ----------
export async function savePartner(p: { id?: string; name: string; logo_url: string; link: string }): Promise<R> {
  await requireStaff();
  if (!clean(p.logo_url)) return { ok: false, error: 'Upload a logo.' };
  if (p.link && !/^https?:\/\//.test(p.link)) return { ok: false, error: 'The website link must start with https://' };
  const supabase = createClient();
  const row = { name: clean(p.name, 120) || 'Partner', logo_url: clean(p.logo_url, 500), link: clean(p.link, 300) || null };
  let error;
  if (p.id) ({ error } = await supabase.from('partners').update(row).eq('id', p.id));
  else {
    const { data: last } = await supabase.from('partners').select('sort').order('sort', { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from('partners').insert({ ...row, sort: (last?.sort ?? 0) + 1 }));
  }
  if (error) return { ok: false, error: error.message };
  await log(p.id ? 'updated partner' : 'added partner', 'partner', row.name);
  refreshSite();
  return { ok: true, message: 'Saved.' };
}
export async function deletePartner(id: string): Promise<R> {
  await requireStaff();
  const { error } = await createClient().from('partners').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log('removed partner', 'partner', id);
  refreshSite();
  return { ok: true };
}

// ---------- Services ----------
export async function saveService(s: { id?: string; name: string; summary: string; body: string; image_url: string; published: boolean }): Promise<R> {
  await requireStaff();
  if (!clean(s.name)) return { ok: false, error: 'Add the service name.' };
  const supabase = createClient();
  const row = {
    name: clean(s.name, 120),
    summary: clean(s.summary, 600) || null,
    body: String(s.body ?? '').slice(0, 20000) || null,
    image_url: clean(s.image_url, 500) || null,
    published: s.published,
    updated_at: new Date().toISOString(),
  };
  let error;
  if (s.id) ({ error } = await supabase.from('services').update(row).eq('id', s.id));
  else {
    const { data: last } = await supabase.from('services').select('sort').order('sort', { ascending: false }).limit(1).maybeSingle();
    ({ error } = await supabase.from('services').insert({ ...row, slug: slugify(row.name), sort: (last?.sort ?? 0) + 1 }));
  }
  if (error) return { ok: false, error: error.message.includes('duplicate') ? 'A service with that name already exists.' : error.message };
  await log(s.id ? 'updated service' : 'added service', 'service', row.name);
  refreshSite();
  return { ok: true, message: 'Saved.' };
}
export async function deleteService(id: string): Promise<R> {
  await requireStaff();
  const { error } = await createClient().from('services').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log('removed service', 'service', id);
  refreshSite();
  return { ok: true };
}

// ---------- Locations ----------
export async function addLocation(kind: 'city' | 'area', parentId: string, name: string): Promise<R> {
  await requireStaff();
  const n = clean(name, 80).replace(/\s+/g, ' ');
  if (n.length < 2) return { ok: false, error: 'Enter a name.' };
  const supabase = createClient();
  const { error } =
    kind === 'city'
      ? await supabase.from('cities').insert({ state_id: parentId, name: n, slug: slugify(n) })
      : await supabase.from('areas').insert({ city_id: parentId, name: n, slug: slugify(n) });
  if (error) return { ok: false, error: error.message.includes('duplicate') ? `${n} is already on the list.` : error.message };
  await log(`added ${kind}`, kind, n);
  revalidatePath('/portal/site/locations');
  return { ok: true, message: `${n} added. Agents can pick it straight away.` };
}
export async function setLocationActive(kind: 'city' | 'area', id: string, active: boolean): Promise<R> {
  await requireStaff();
  const { error } = await createClient().from(kind === 'city' ? 'cities' : 'areas').update({ active }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log(`${active ? 'showed' : 'hid'} ${kind}`, kind, id);
  revalidatePath('/portal/site/locations');
  return { ok: true };
}
export async function renameLocation(kind: 'city' | 'area', id: string, name: string): Promise<R> {
  await requireStaff();
  const n = clean(name, 80);
  if (n.length < 2) return { ok: false, error: 'Enter a name.' };
  const { error } = await createClient().from(kind === 'city' ? 'cities' : 'areas').update({ name: n }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log(`renamed ${kind}`, kind, n);
  revalidatePath('/portal/site/locations');
  return { ok: true };
}

// ---------- Exchange rates ----------
export async function refreshRatesNow(): Promise<R> {
  await requireStaff();
  const { refreshRates } = await import('@/lib/rates');
  const r = await refreshRates();
  if (r.ok) {
    await log('refreshed exchange rates', 'settings', 'currency_rates');
    refreshSite();
  }
  return r.ok ? { ok: true, message: r.message } : { ok: false, error: r.message };
}
