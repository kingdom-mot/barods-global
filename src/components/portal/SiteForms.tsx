'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  addLocation,
  deletePartner,
  deleteService,
  deleteTeamMember,
  moveItem,
  refreshRatesNow,
  renameLocation,
  saveService,
  savePartner,
  saveSettings,
  saveTeamMember,
  setLocationActive,
  type TeamInput,
} from '@/app/portal/site-actions';
import { createClient } from '@/lib/supabase/browser';

type Msg = { ok: boolean; text: string } | null;
type Res = { ok: boolean; message?: string; error?: string };

export function Note({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <p className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>;
}

function useAction() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Res>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error ?? 'Something went wrong.' });
      if (r.ok) after?.();
      router.refresh();
    });
  return { msg, pending, run };
}

export function SiteTabs() {
  const path = usePathname();
  const tabs = [
    ['/portal/site', 'Settings'],
    ['/portal/site/team', 'Team'],
    ['/portal/site/partners', 'Partners'],
    ['/portal/site/services', 'Services'],
    ['/portal/site/locations', 'Locations'],
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Website sections">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} className={`rounded-full px-4 py-2 text-sm font-semibold ${path === href ? 'bg-brand-ink text-white' : 'bg-white ring-1 ring-line hover:ring-brand-green'}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Image picker that uploads to storage and hands back the public URL. */
export function ImageField({ userId, value, onChange, label, aspect = 'aspect-[16/9]', fit = 'object-cover' }: { userId: string; value: string; onChange: (url: string) => void; label: string; aspect?: string; fit?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr('');
    const supabase = createClient();
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/svg+xml' ? 'svg' : 'jpg';
    const path = `${userId}/site-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('listing-photos').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
    setBusy(false);
    if (error) return setErr('Couldn’t upload that image. Use a JPG or PNG under 10MB.');
    onChange(supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
  }
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <label className={`relative flex ${aspect} w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-paper text-sm font-semibold text-brand-greenDark hover:border-brand-green`}>
        {value ? <img src={value} alt="" className={`h-full w-full ${fit}`} /> : <span>+ Upload image</span>}
        {value && <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs shadow">{busy ? 'Uploading…' : 'Change'}</span>}
        {!value && busy && <span className="absolute">Uploading…</span>}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}

// ---------- Settings ----------
export function KeyValueForm({
  settingKey,
  title,
  hint,
  fields,
  initial,
  userId,
}: {
  settingKey: 'contact' | 'socials' | 'hero' | 'mortgage';
  title: string;
  hint?: string;
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'image' | 'url' | 'email'; hint?: string; step?: string }[];
  initial: Record<string, unknown>;
  userId?: string;
}) {
  const [v, setV] = useState<Record<string, unknown>>(initial);
  const { msg, pending, run } = useAction();
  return (
    <form
      className="space-y-4 rounded-xl border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSettings(settingKey, v));
      }}
    >
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.type === 'image' ? (
            <div key={f.key} className="sm:col-span-2">
              <ImageField userId={userId!} label={f.label} value={String(v[f.key] ?? '')} onChange={(url) => setV({ ...v, [f.key]: url })} aspect="aspect-[21/7]" />
            </div>
          ) : (
            <label key={f.key} className={`label ${f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
              {f.label}
              {f.type === 'textarea' ? (
                <textarea className="field" rows={3} value={String(v[f.key] ?? '')} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
              ) : (
                <input
                  className="field"
                  type={f.type ?? 'text'}
                  step={f.step}
                  value={String(v[f.key] ?? '')}
                  onChange={(e) => setV({ ...v, [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
                />
              )}
              {f.hint && <span className="text-[11px] font-normal normal-case tracking-normal">{f.hint}</span>}
            </label>
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Note msg={msg} />
      </div>
    </form>
  );
}

export function LeadRecipientsForm({ initial }: { initial: string[] }) {
  const [text, setText] = useState(initial.join('\n'));
  const { msg, pending, run } = useAction();
  return (
    <form
      className="space-y-3 rounded-xl border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSettings('lead_recipients', text.split(/[\n,;]+/)));
      }}
    >
      <div>
        <h2 className="font-semibold">Who gets a copy of every lead</h2>
        <p className="text-sm text-muted">Each enquiry, tour request and visitor sign-up is emailed to the listing agent and copied to these addresses. One per line.</p>
      </div>
      <textarea className="field font-mono text-sm" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="tunde@barodsglobal.com" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Note msg={msg} />
      </div>
    </form>
  );
}

// ---------- Team ----------
type TeamRow = TeamInput & { id: string };
export function TeamEditor({ rows, userId }: { rows: TeamRow[]; userId: string }) {
  const [editing, setEditing] = useState<TeamInput | null>(null);
  const { msg, pending, run } = useAction();
  const blank: TeamInput = { full_name: '', role: '', email: '', photo_url: '', show_on_home: true, show_on_about: true };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Shown in “Meet Our Team” on the homepage (first 4 ticked) and About Us. Use the arrows to change the order.</p>
        <button type="button" className="btn-green px-5" onClick={() => setEditing(blank)}>+ Add team member</button>
      </div>
      <Note msg={msg} />
      {editing && (
        <form
          className="grid gap-4 rounded-xl border-2 border-brand-green/40 bg-white p-5 sm:grid-cols-[180px_1fr]"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveTeamMember(editing), () => setEditing(null));
          }}
        >
          <ImageField userId={userId} label="Photo" value={editing.photo_url} onChange={(u) => setEditing({ ...editing, photo_url: u })} aspect="aspect-[4/5]" />
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="label">Full name<input className="field" required value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></label>
            <label className="label">Role<input className="field" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="Property Consultant" /></label>
            <label className="label sm:col-span-2">Email (not shown publicly)<input className="field" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-green" checked={editing.show_on_home} onChange={(e) => setEditing({ ...editing, show_on_home: e.target.checked })} />Show on homepage</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-green" checked={editing.show_on_about} onChange={(e) => setEditing({ ...editing, show_on_about: e.target.checked })} />Show on About Us</label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn text-muted" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </form>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t, i) => (
          <li key={t.id} className="flex gap-3 rounded-xl border border-line bg-white p-3">
            {t.photo_url ? <img src={t.photo_url} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover object-top" /> : <div className="h-20 w-16 shrink-0 rounded-lg bg-paper" />}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{t.full_name}</div>
              <div className="truncate text-xs text-muted">{t.role}</div>
              <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                {t.show_on_home && <span className="rounded bg-brand-greenLight px-1.5 py-0.5 text-brand-greenDark">Home</span>}
                {t.show_on_about && <span className="rounded bg-paper px-1.5 py-0.5">About</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === 0} onClick={() => run(() => moveItem('team_members', t.id, -1))} aria-label="Move earlier">↑</button>
                <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === rows.length - 1} onClick={() => run(() => moveItem('team_members', t.id, 1))} aria-label="Move later">↓</button>
                <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-brand-greenDark hover:bg-paper" onClick={() => setEditing(t)}>Edit</button>
                <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => confirm(`Remove ${t.full_name} from the team page?`) && run(() => deleteTeamMember(t.id))}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Partners ----------
type PartnerRow = { id: string; name: string; logo_url: string; link: string | null };
export function PartnersEditor({ rows, userId }: { rows: PartnerRow[]; userId: string }) {
  const [editing, setEditing] = useState<{ id?: string; name: string; logo_url: string; link: string } | null>(null);
  const { msg, pending, run } = useAction();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Logos in the scrolling “Our Trusted Partners” strip on the homepage.</p>
        <button type="button" className="btn-green px-5" onClick={() => setEditing({ name: '', logo_url: '', link: '' })}>+ Add partner</button>
      </div>
      <Note msg={msg} />
      {editing && (
        <form
          className="grid gap-4 rounded-xl border-2 border-brand-green/40 bg-white p-5 sm:grid-cols-[220px_1fr]"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => savePartner(editing), () => setEditing(null));
          }}
        >
          <ImageField userId={userId} label="Logo" value={editing.logo_url} onChange={(u) => setEditing({ ...editing, logo_url: u })} aspect="aspect-[3/2]" fit="object-contain p-3" />
          <div className="grid content-start gap-4">
            <label className="label">Partner name<input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label className="label">Website (optional)<input className="field" type="url" value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="https://" /></label>
            <div className="flex gap-2">
              <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn text-muted" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </form>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((p, i) => (
          <li key={p.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex h-20 items-center justify-center"><img src={p.logo_url} alt={p.name} className="max-h-16 w-auto object-contain" /></div>
            <div className="mt-2 truncate text-center text-xs font-semibold">{p.name}</div>
            <div className="mt-1 flex justify-center gap-1">
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === 0} onClick={() => run(() => moveItem('partners', p.id, -1))} aria-label="Move earlier">←</button>
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === rows.length - 1} onClick={() => run(() => moveItem('partners', p.id, 1))} aria-label="Move later">→</button>
              <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-brand-greenDark hover:bg-paper" onClick={() => setEditing({ id: p.id, name: p.name, logo_url: p.logo_url, link: p.link ?? '' })}>Edit</button>
              <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => confirm('Remove this partner logo?') && run(() => deletePartner(p.id))}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Services ----------
type ServiceRow = { id: string; slug: string; name: string; summary: string | null; body: string | null; image_url: string | null; published: boolean };
export function ServicesEditor({ rows, userId }: { rows: ServiceRow[]; userId: string }) {
  const [editing, setEditing] = useState<{ id?: string; name: string; summary: string; body: string; image_url: string; published: boolean } | null>(null);
  const { msg, pending, run } = useAction();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Each service has its own page with an enquiry form, listed on Our Services and About Us.</p>
        <button type="button" className="btn-green px-5" onClick={() => setEditing({ name: '', summary: '', body: '', image_url: '', published: true })}>+ Add service</button>
      </div>
      <Note msg={msg} />
      {editing && (
        <form
          className="grid gap-4 rounded-xl border-2 border-brand-green/40 bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveService(editing), () => setEditing(null));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[260px_1fr]">
            <ImageField userId={userId} label="Image" value={editing.image_url} onChange={(u) => setEditing({ ...editing, image_url: u })} aspect="aspect-[4/3]" />
            <div className="grid content-start gap-4">
              <label className="label">Service name<input className="field" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
              <label className="label">Summary<textarea className="field" rows={3} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-green" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />Show on the website</label>
            </div>
          </div>
          <label className="label">
            More detail (optional, shown on the service page)
            <textarea className="field font-mono text-sm" rows={8} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder={'## What we do\n- Point one\n- Point two'} />
            <span className="text-[11px] font-normal normal-case tracking-normal">Use ## for a heading, - for a bullet and **bold** for bold.</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn text-muted" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      <ul className="space-y-3">
        {rows.map((s, i) => (
          <li key={s.id} className="flex items-center gap-4 rounded-xl border border-line bg-white p-3">
            {s.image_url ? <img src={s.image_url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-24 shrink-0 rounded-lg bg-paper" />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{s.name} {!s.published && <span className="badge ml-1 bg-line text-muted">Hidden</span>}</div>
              <div className="line-clamp-1 text-xs text-muted">{s.summary}</div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === 0} onClick={() => run(() => moveItem('services', s.id, -1))} aria-label="Move up">↑</button>
              <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending || i === rows.length - 1} onClick={() => run(() => moveItem('services', s.id, 1))} aria-label="Move down">↓</button>
              <a href={`/our-services/${s.slug}`} target="_blank" className="rounded px-2 py-1 text-xs font-semibold hover:bg-paper">View</a>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-semibold text-brand-greenDark hover:bg-paper"
                onClick={() => setEditing({ id: s.id, name: s.name, summary: s.summary ?? '', body: s.body ?? '', image_url: s.image_url ?? '', published: s.published })}
              >
                Edit
              </button>
              <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => confirm(`Delete the ${s.name} service page?`) && run(() => deleteService(s.id))}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Homepage cities ----------
type HomeCity = { name: string; state: string; image: string };
/** The city cards on the homepage: photo, name, state. Each card opens the properties in that city. */
export function HomeCitiesEditor({ userId, initial }: { userId: string; initial: HomeCity[] }) {
  const [rows, setRows] = useState<HomeCity[]>(initial);
  const { msg, pending, run } = useAction();
  const set = (i: number, patch: Partial<HomeCity>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };
  return (
    <section className="mb-8 rounded-xl border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">Homepage cities</h2>
          <p className="text-sm text-muted">The “Explore Our Properties by City” cards. Upload a photo for each; the card opens that city’s listings.</p>
        </div>
        <button type="button" className="btn-outline min-h-[38px] px-4 text-sm" disabled={rows.length >= 12} onClick={() => setRows([...rows, { name: '', state: '', image: '' }])}>
          + Add city
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((c, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line p-3">
            <ImageField userId={userId} label="Photo" value={c.image} onChange={(url) => set(i, { image: url })} aspect="aspect-[4/3]" />
            <label className="label">City<input className="field" value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="e.g. Abeokuta" /></label>
            <label className="label">State<input className="field" value={c.state} onChange={(e) => set(i, { state: e.target.value })} placeholder="e.g. Ogun" /></label>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="flex gap-1">
                <button type="button" className="rounded px-2 py-1 hover:bg-paper" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">←</button>
                <button type="button" className="rounded px-2 py-1 hover:bg-paper" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move later">→</button>
              </span>
              <span className="flex gap-1">
                {c.image && <button type="button" className="rounded px-2 py-1 hover:bg-paper" onClick={() => set(i, { image: '' })}>Remove photo</button>}
                <button type="button" className="rounded px-2 py-1 font-semibold text-red-700 hover:bg-red-50" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-green px-6" disabled={pending} onClick={() => run(() => saveSettings('home_cities', rows))}>
          {pending ? 'Saving…' : 'Save homepage cities'}
        </button>
        <Note msg={msg} />
      </div>
    </section>
  );
}

// ---------- Locations ----------
type Loc = { id: string; name: string; active: boolean };
export function LocationList({ kind, parentId, parentName, items, linkBase }: { kind: 'city' | 'area'; parentId: string; parentName: string; items: Loc[]; linkBase?: string }) {
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const { msg, pending, run } = useAction();
  const word = kind === 'city' ? 'city / town' : 'area';
  return (
    <div className="space-y-3 rounded-xl border border-line bg-white p-5">
      <h2 className="font-semibold">{kind === 'city' ? 'Cities and towns' : 'Areas'} in {parentName}</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addLocation(kind, parentId, name), () => setName(''));
        }}
      >
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add a ${word}`} aria-label={`New ${word}`} />
        <button type="submit" className="btn-green shrink-0 px-5" disabled={pending || name.trim().length < 2}>Add</button>
      </form>
      <Note msg={msg} />
      {items.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              {renaming?.id === l.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameLocation(kind, l.id, renaming.name), () => setRenaming(null));
                  }}
                >
                  <input className="field h-9 py-1" value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} autoFocus />
                  <button type="submit" className="rounded-md bg-brand-green px-3 text-xs font-semibold text-white">Save</button>
                  <button type="button" className="rounded-md px-2 text-xs" onClick={() => setRenaming(null)}>Cancel</button>
                </form>
              ) : (
                <>
                  {linkBase ? (
                    <Link href={`${linkBase}${l.id}`} className={`font-medium hover:text-brand-greenDark ${l.active ? '' : 'text-muted line-through'}`}>{l.name} →</Link>
                  ) : (
                    <span className={l.active ? 'font-medium' : 'text-muted line-through'}>{l.name}</span>
                  )}
                  <span className="flex gap-1">
                    <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" onClick={() => setRenaming({ id: l.id, name: l.name })}>Rename</button>
                    <button type="button" className="rounded px-2 py-1 text-xs hover:bg-paper" disabled={pending} onClick={() => run(() => setLocationActive(kind, l.id, !l.active))}>
                      {l.active ? 'Hide' : 'Show'}
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RatesPanel({ rows }: { rows: { currency: string; per_ngn: number; updated_at: string }[] }) {
  const { msg, pending, run } = useAction();
  return (
    <div className="space-y-3 rounded-xl border border-line bg-white p-5">
      <div>
        <h2 className="font-semibold">Exchange rates</h2>
        <p className="text-sm text-muted">Used to show prices in visitors’ currencies. Updated automatically every morning.</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        {rows.map((r) => (
          <div key={r.currency} className="rounded-lg bg-paper p-3">
            <dt className="text-xs text-muted">₦1,000,000 =</dt>
            <dd className="font-semibold">{(r.per_ngn * 1_000_000).toLocaleString('en-NG', { maximumFractionDigits: 0 })} {r.currency}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">
        Last updated {rows[0] ? new Date(rows[0].updated_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'never'}.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-outline" disabled={pending} onClick={() => run(refreshRatesNow)}>{pending ? 'Updating…' : 'Update now'}</button>
        <Note msg={msg} />
      </div>
    </div>
  );
}
