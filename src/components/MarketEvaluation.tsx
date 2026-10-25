'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HoneyPot, useFormTimer } from './spam';

/**
 * "Looking to sell or let your property?" — a search-style button that opens the Market Evaluation form.
 * The location step uses a free OpenStreetMap map (Leaflet, loaded on demand) with place search (Photon),
 * a draggable pin and "use my location". If the map can't load, people simply type the address.
 */

const LEAFLET = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist';
const ABEOKUTA: [number, number] = [7.1475, 3.3619];

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Other (outside Nigeria)',
];
const TYPES = ['House', 'Flat / Apartment', 'Land', 'Commercial', 'Other'] as const;

type Place = { label: string; lat: number; lon: number; street?: string; area?: string; city?: string; state?: string };
type Fields = {
  building: string; street: string; area: string; city: string; state: string;
  purpose: 'Sell' | 'Let'; type: (typeof TYPES)[number]; bedrooms: string; info: string;
  firstName: string; lastName: string; phone: string; email: string; consent: boolean;
};
const EMPTY: Fields = {
  building: '', street: '', area: '', city: '', state: '', purpose: 'Sell', type: 'House', bedrooms: '', info: '',
  firstName: '', lastName: '', phone: '', email: '', consent: false,
};

let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${LEAFLET}/leaflet.css`;
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = `${LEAFLET}/leaflet.js`;
    s.async = true;
    s.onload = () => ((window as any).L ? resolve((window as any).L) : reject());
    s.onerror = () => {
      leafletPromise = null;
      reject();
    };
    document.head.appendChild(s);
    setTimeout(() => reject(), 10000);
  });
  return leafletPromise;
}

/** Turn a Photon (OpenStreetMap) result into our address fields. */
function toPlace(f: any): Place {
  const p = f.properties ?? {};
  const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
  const street = [p.housenumber, p.street].filter(Boolean).join(' ') || undefined;
  const area = p.district ?? p.locality ?? (p.osm_key === 'place' && p.city && p.name !== p.city ? p.name : undefined);
  const city = p.city ?? p.county ?? (p.osm_value === 'city' || p.osm_value === 'town' ? p.name : undefined);
  let state: string | undefined = p.state?.replace(/\s*State$/i, '');
  if (state && /federal capital/i.test(state)) state = 'FCT Abuja';
  const label = [p.name, street && street !== p.name ? street : null, area !== p.name ? area : null, city !== p.name ? city : null, state, p.country]
    .filter(Boolean)
    .join(', ');
  return { label, lat, lon, street, area, city, state };
}

function Segmented<T extends string>({ value, options, onChange, label, cols }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string; cols: string }) {
  // A grid with 1px gaps over a grey background draws even borders between every button, on any number of rows.
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-px overflow-hidden rounded-lg border border-line bg-line ${cols}`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`min-h-[46px] px-2 text-sm font-semibold transition-colors ${
            value === o ? 'bg-brand-green text-white' : 'bg-white text-brand-ink hover:bg-brand-greenLight'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function MarketEvaluation({ agentSlug }: { agentSlug?: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Fields>(EMPTY);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const elapsed = useFormTimer();
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((cur) => ({ ...cur, [k]: v }));
    setError(''); // the reminder goes away as soon as they start fixing things
  };

  // Location search + map
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [locating, setLocating] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const fill = useCallback((p: Partial<Place>, overwrite = true) => {
    setF((cur) => ({
      ...cur,
      street: overwrite || !cur.street ? p.street ?? (overwrite ? '' : cur.street) : cur.street,
      area: overwrite || !cur.area ? p.area ?? (overwrite ? '' : cur.area) : cur.area,
      city: overwrite || !cur.city ? p.city ?? (overwrite ? '' : cur.city) : cur.city,
      state: p.state && STATES.includes(p.state) ? p.state : overwrite ? (p.state ? 'Other (outside Nigeria)' : cur.state) : cur.state,
    }));
  }, []);

  const placePin = useCallback((lat: number, lon: number, zoom?: number) => {
    setPin({ lat, lon });
    const L = (window as any).L;
    if (!map.current || !L) return;
    if (!marker.current) {
      const icon = L.divIcon({
        className: '',
        html: '<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 45s15-15.2 15-27A15 15 0 1 0 3 18c0 11.8 15 27 15 27z" fill="#56B91E" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg>',
        iconSize: [36, 46],
        iconAnchor: [18, 45],
      });
      marker.current = L.marker([lat, lon], { draggable: true, icon, keyboard: true, title: 'Drag to the exact spot' }).addTo(map.current);
      marker.current.on('dragend', () => {
        const ll = marker.current.getLatLng();
        setPin({ lat: ll.lat, lon: ll.lng });
        reverse(ll.lat, ll.lng);
      });
    } else marker.current.setLatLng([lat, lon]);
    map.current.setView([lat, lon], zoom ?? Math.max(map.current.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverse = useCallback(
    async (lat: number, lon: number) => {
      try {
        const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en&limit=1`);
        const d = await r.json();
        if (d.features?.[0]) fill(toPlace(d.features[0]), false);
      } catch {
        /* the person can type the address */
      }
    },
    [fill],
  );

  // Open/close: lock the page behind, Esc closes, focus the search.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    setTimeout(() => searchInput.current?.focus(), 50);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Build the map the first time the form opens.
  useEffect(() => {
    if (!open || map.current) return;
    let cancelled = false;
    setMapState('loading');
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current) return;
        map.current = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView(pin ? [pin.lat, pin.lon] : ABEOKUTA, pin ? 16 : 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }).addTo(map.current);
        map.current.on('click', (e: any) => {
          placePin(e.latlng.lat, e.latlng.lng, map.current.getZoom());
          reverse(e.latlng.lat, e.latlng.lng);
        });
        if (pin) placePin(pin.lat, pin.lon, 16);
        setMapState('ready');
        setTimeout(() => map.current?.invalidateSize(), 250);
      })
      .catch(() => !cancelled && setMapState('failed'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The map element is removed when the form closes; start fresh next time.
  useEffect(() => {
    if (open) return;
    map.current?.remove();
    map.current = null;
    marker.current = null;
  }, [open]);

  // Place suggestions as they type (biased towards Abeokuta / Nigeria).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults([]);
      return;
    }
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&limit=6&lang=en&lat=${ABEOKUTA[0]}&lon=${ABEOKUTA[1]}`, { signal: ctl.signal });
        const d = await r.json();
        setResults((d.features ?? []).map(toPlace).filter((p: Place) => p.label));
      } catch {
        /* offline or blocked: they can still type the address */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q]);

  function choose(p: Place) {
    setQ(p.label);
    setResults([]);
    fill(p, true);
    placePin(p.lat, p.lon, 16);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        placePin(pos.coords.latitude, pos.coords.longitude, 17);
        reverse(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const missing = [
      !f.city.trim() && !f.area.trim() && 'the area or city',
      !f.state && 'the state',
      !f.firstName.trim() && 'your first name',
      !f.lastName.trim() && 'your last name',
      f.phone.replace(/\D/g, '').length < 7 && 'a phone number',
      !f.consent && 'your agreement to be contacted',
    ].filter(Boolean);
    if (missing.length) {
      setError(`Please add ${missing.join(', ')}.`);
      return;
    }
    setState('sending');
    const where = [f.building, f.street, f.area, f.city, f.state].map((s) => s.trim()).filter(Boolean).join(', ');
    const message = [
      `Market evaluation: wants to ${f.purpose.toUpperCase()} a ${f.type.toLowerCase()}${f.bedrooms ? ` (${f.bedrooms} bedrooms)` : ''}.`,
      `Property: ${where}`,
      pin ? `Map pin: https://www.google.com/maps?q=${pin.lat.toFixed(6)},${pin.lon.toFixed(6)}` : '',
      f.info.trim() ? `More details: ${f.info.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'valuation',
          name: `${f.firstName.trim()} ${f.lastName.trim()}`,
          phone: f.phone.trim(),
          email: f.email.trim(),
          message,
          agentSlug,
          hp: form.get('hp'),
          t: elapsed(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong. Please try again, or call us.');
        setState('error');
        return;
      }
      setState('done');
    } catch {
      setError('Couldn’t send. Check your connection and try again.');
      setState('error');
    }
  }

  function close() {
    setOpen(false);
    if (state === 'done') {
      setF(EMPTY);
      setQ('');
      setPin(null);
      setState('idle');
    }
  }

  const input = 'field';
  return (
    <>
      {/* Section */}
      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="container-site text-center">
          <h2 className="section-title">Looking to sell or let your property?</h2>
          <p className="section-sub mx-auto max-w-2xl">Our property specialists can give you a professional, no-obligation market evaluation.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group mx-auto mt-8 flex h-14 w-full max-w-xl items-center gap-3 rounded-xl border-2 border-line bg-white px-5 text-left shadow-sm transition-all hover:border-brand-green hover:shadow-md focus-visible:border-brand-green"
            aria-haspopup="dialog"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span className="flex-1 truncate text-[15px] text-muted">Where is your property located?</span>
            <span className="hidden rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-greenDark sm:inline">Get started</span>
          </button>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
            {['Free and no obligation', 'Local market experts', 'Reply within 1 working day'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-green" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Modal: full screen on phones, a centred card on larger screens */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-brand-ink/60 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mev-title"
            className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="flex items-center gap-3 bg-brand-ink px-4 py-3.5 text-white sm:px-6">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" /></svg>
              <h2 id="mev-title" className="flex-1 text-base font-bold uppercase tracking-wide">Market evaluation</h2>
              <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full text-2xl hover:bg-white/10" aria-label="Close">×</button>
            </div>

            {state === 'done' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-greenLight text-brand-greenDark">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <h3 className="font-display text-3xl">Thank you, {f.firstName.trim() || 'we’ve got it'}!</h3>
                <p className="max-w-md text-muted">A Barods property specialist will contact you within one working day to arrange your free market evaluation.</p>
                <button type="button" onClick={close} className="btn-green mt-2 px-8">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="relative flex min-h-0 flex-1 flex-col" noValidate>
                <HoneyPot />
                <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-6">
                  {/* Location */}
                  <fieldset className="min-w-0 space-y-3">
                    <legend className="mb-1 text-lg font-bold">Where is the property?</legend>
                    <div className="relative">
                      <label htmlFor="mev-search" className="sr-only">Search for the address or area</label>
                      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                      <input
                        id="mev-search"
                        ref={searchInput}
                        className={`${input} pl-11`}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search an address, estate or area"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-controls="mev-results"
                      />
                      {(results.length > 0 || searching) && (
                        <ul id="mev-results" role="listbox" className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-xl">
                          {searching && results.length === 0 && <li className="px-4 py-3 text-sm text-muted">Searching…</li>}
                          {results.map((r, i) => (
                            <li key={`${r.lat},${r.lon},${i}`} role="option" aria-selected={false}>
                              <button type="button" onClick={() => choose(r)} className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-brand-greenLight">
                                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /></svg>
                                <span>{r.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-line">
                      <div ref={mapEl} className="h-52 w-full bg-paper sm:h-64" />
                      {mapState !== 'ready' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-paper p-4 text-center text-sm text-muted">
                          {mapState === 'loading' ? 'Loading map…' : 'The map couldn’t load. Just type the address below.'}
                        </div>
                      )}
                      {mapState === 'ready' && (
                        <button
                          type="button"
                          onClick={useMyLocation}
                          className="absolute bottom-3 right-3 z-[500] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-md hover:text-brand-greenDark"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>
                          {locating ? 'Finding you…' : 'Use my location'}
                        </button>
                      )}
                    </div>
                    {mapState === 'ready' && (
                      <p className="text-xs text-muted">{pin ? 'Drag the pin to the exact spot if needed.' : 'Search above, tap the map, or use your location to drop a pin.'}</p>
                    )}

                    <input className={input} value={f.building} onChange={(e) => set('building', e.target.value)} placeholder="Building, estate or house name (optional)" aria-label="Building, estate or house name (optional)" maxLength={120} />
                    <input className={input} value={f.street} onChange={(e) => set('street', e.target.value)} placeholder="Street address" aria-label="Street address" maxLength={160} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={input} value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="Area / neighbourhood" aria-label="Area or neighbourhood" maxLength={80} />
                      <input className={input} value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="City / town" aria-label="City or town" maxLength={80} />
                    </div>
                    <select className={input} value={f.state} onChange={(e) => set('state', e.target.value)} aria-label="State">
                      <option value="">State</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </fieldset>

                  {/* Property */}
                  <fieldset className="min-w-0 space-y-3">
                    <legend className="mb-1 text-lg font-bold">About the property</legend>
                    <Segmented label="I want to" value={f.purpose} options={['Sell', 'Let'] as const} onChange={(v) => set('purpose', v)} cols="grid-cols-2" />
                    <Segmented label="Property type" value={f.type} options={TYPES} onChange={(v) => set('type', v)} cols="grid-cols-2 sm:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1" />
                    {(f.type === 'House' || f.type === 'Flat / Apartment') && (
                      <select className={input} value={f.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} aria-label="Bedrooms">
                        <option value="">Bedrooms</option>
                        {['1', '2', '3', '4', '5', '6+'].map((b) => <option key={b} value={b}>{b} bedroom{b === '1' ? '' : 's'}</option>)}
                      </select>
                    )}
                    <textarea className={input} rows={3} value={f.info} onChange={(e) => set('info', e.target.value)} placeholder="Anything else? Size, title document, condition, when you’d like to sell or let… (optional)" aria-label="More details (optional)" maxLength={800} />
                  </fieldset>

                  {/* Contact */}
                  <fieldset className="min-w-0 space-y-3">
                    <legend className="mb-1 text-lg font-bold">Your details</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={input} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" aria-label="First name" autoComplete="given-name" maxLength={60} />
                      <input className={input} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" aria-label="Last name" autoComplete="family-name" maxLength={60} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={input} type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone / WhatsApp" aria-label="Phone or WhatsApp" autoComplete="tel" maxLength={30} />
                      <input className={input} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="Email (optional)" aria-label="Email (optional)" autoComplete="email" maxLength={120} />
                    </div>
                    <label className="flex items-start gap-2.5 text-sm text-muted">
                      <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green" />
                      <span>
                        I agree that Barods Global may contact me about this evaluation, and I accept the{' '}
                        <Link href="/terms" target="_blank" className="underline">Terms of Use</Link> and{' '}
                        <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  </fieldset>
                </div>

                <div className="border-t border-line bg-white px-4 py-3 sm:px-6 sm:py-4">
                  {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
                  <button type="submit" className="btn-green w-full" disabled={state === 'sending'}>
                    {state === 'sending' ? 'Sending…' : 'Request my free evaluation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
