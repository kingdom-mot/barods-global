'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { saveListing, type ListingInput } from '@/app/portal/actions';
import {
  CAUTION_FEE,
  CONDITION,
  COUNT_OPTIONS,
  FEE_PCT,
  FLOOR_SIZES,
  FURNISHING,
  INSTALMENT_DEPOSIT,
  INSTALMENT_MONTHS,
  LAND_SIZES,
  MAX_GUESTS,
  MIN_NIGHTS,
  MIN_TENURE,
  PAYMENT_PLAN,
  PRICE_LABEL,
  PURPOSES,
  RENT_FREQUENCY,
  SERVICE_CHARGE,
  TIMES,
  TITLE_DOCS,
  YES_NO,
  ZA_BANDS,
  ZA_DEPOSIT,
  ZA_LEASE,
} from '@/lib/listingOptions';
import { youTubeEmbed } from '@/lib/video';
import { createClient } from '@/lib/supabase/browser';

type Ref = { id: string; name: string };
export type FormLookups = {
  countries: { code: 'NG' | 'ZA'; name: string }[];
  states: (Ref & { country_code: string })[];
  cities: (Ref & { state_id: string })[];
  areas: (Ref & { city_id: string })[];
  types: (Ref & { parent: string | null })[];
  amenities: (Ref & { group_name: string })[];
  agents?: Ref[];
};
export type InitialListing = Partial<ListingInput> & { id?: string; ref?: string; status?: string; reviewNote?: string | null };

// Form state keeps every answer as text (what the dropdowns hold); converted on save.
type Form = Record<string, string> & { purpose: 'sale' | 'rent' | 'shortlet'; countryCode: 'NG' | 'ZA' };

const STEPS = ['Type', 'Location', 'Details', 'Price', 'Photos and description', 'Review'] as const;

function toForm(i: InitialListing): Form {
  const s = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v));
  return {
    purpose: i.purpose ?? 'sale',
    countryCode: i.countryCode ?? 'NG',
    agentId: s(i.agentId),
    propertyTypeId: s(i.propertyTypeId),
    title: s(i.title),
    description: s(i.description),
    stateId: s(i.stateId),
    cityId: s(i.cityId),
    areaId: s(i.areaId),
    address: s(i.address),
    bedrooms: s(i.bedrooms),
    bathrooms: s(i.bathrooms),
    toilets: s(i.toilets),
    parking: s(i.parking),
    floorSizeSqm: s(i.floorSizeSqm),
    landSize: s(i.landSize),
    condition: s(i.condition),
    furnishing: s(i.furnishing),
    serviced: s(i.serviced ?? false),
    hasBq: s(i.hasBq ?? false),
    titleDocument: s(i.titleDocument),
    price: s(i.price),
    priceOnApplication: s(i.priceOnApplication ?? false),
    negotiable: s(i.negotiable),
    paymentPlan: s(i.paymentPlan),
    instalmentDepositPct: s(i.instalmentDepositPct),
    instalmentMonths: s(i.instalmentMonths),
    paymentFrequency: s(i.paymentFrequency ?? 'yearly'),
    minimumTenureYears: s(i.minimumTenureYears),
    serviceChargeBand: s(i.serviceChargeBand),
    agencyFeePct: s(i.agencyFeePct),
    legalFeePct: s(i.legalFeePct),
    cautionFee: s(i.cautionFee),
    deposit: s(i.deposit),
    leaseTermMonths: s(i.leaseTermMonths),
    petsAllowed: s(i.petsAllowed),
    leviesBand: s(i.leviesBand),
    ratesTaxesBand: s(i.ratesTaxesBand),
    minimumNights: s(i.minimumNights),
    maxGuests: s(i.maxGuests),
    checkIn: s(i.checkIn),
    checkOut: s(i.checkOut),
    videoUrl: s(i.videoUrl),
  };
}

const num = (v: string) => (v === '' ? null : Number(v.replace(/[^0-9.]/g, '')) || null);
const numOrZero = (v: string) => (v === '' ? null : Number(v));
const bool = (v: string) => (v === '' ? null : v === 'yes');

function Select({ label, value, onChange, options, placeholder = 'Select…', required, hint }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <label className="label">
      <span>{label}{required && <span className="text-brand-orange"> *</span>}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {hint && <span className="text-[11px] font-normal normal-case tracking-normal">{hint}</span>}
    </label>
  );
}

const LAND_UNITS = ['sqm', 'plots', 'acres', 'hectares'] as const;
const OTHER = '__other';

/** Land size: the usual sizes, or "Other" to type an exact size (amount + unit). */
function LandSizeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const listed = LAND_SIZES.some(([v]) => v === value);
  const [other, setOther] = useState(Boolean(value) && !listed);
  // An existing custom size such as "1,350 sqm" opens straight into the Other boxes.
  const parsed = value.match(/^([\d.,]+)\s*(sqm|plots?|acres?|hectares?)$/i);
  const [amount, setAmount] = useState(other && parsed ? parsed[1] : other ? value : '');
  const [unit, setUnit] = useState<string>(() => {
    const u = parsed?.[2]?.toLowerCase() ?? 'sqm';
    return LAND_UNITS.find((x) => x.startsWith(u.replace(/s$/, ''))) ?? 'sqm';
  });
  const push = (a: string, u: string) => {
    const n = a.trim();
    onChange(n ? (/^[\d.,]+$/.test(n) ? `${n} ${u === 'plots' && n === '1' ? 'plot' : u === 'acres' && n === '1' ? 'acre' : u === 'hectares' && n === '1' ? 'hectare' : u}` : n) : '');
  };
  return (
    <div className="space-y-2">
      <label className="label">
        <span>{label}</span>
        <select
          className="field"
          value={other ? OTHER : value}
          onChange={(e) => {
            if (e.target.value === OTHER) {
              setOther(true);
              onChange('');
            } else {
              setOther(false);
              setAmount('');
              onChange(e.target.value);
            }
          }}
        >
          <option value="">Select…</option>
          {LAND_SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          <option value={OTHER}>Other (type the size)</option>
        </select>
      </label>
      {other && (
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="land-other-amount">Land size amount</label>
          <input
            id="land-other-amount"
            className="field"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              push(e.target.value, unit);
            }}
            placeholder="e.g. 750"
            maxLength={20}
            autoFocus
          />
          <label className="sr-only" htmlFor="land-other-unit">Unit</label>
          <select
            id="land-other-unit"
            className="field w-36 shrink-0"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              push(amount, e.target.value);
            }}
          >
            {LAND_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

/** Shrink big phone photos before upload: max 2000px on the long side, JPEG. Saves data on mobile networks. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size < 400_000) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', 0.82));
}

export default function ListingForm({ userId, isStaff, lookups, initial = {} }: { userId: string; isStaff: boolean; lookups: FormLookups; initial?: InitialListing }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(() => toForm(initial));
  const [amenityIds, setAmenityIds] = useState<string[]>(initial.amenityIds ?? []);
  const [photos, setPhotos] = useState<string[]>(initial.photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: string) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const states = lookups.states.filter((s) => s.country_code === f.countryCode);
  const cities = lookups.cities.filter((c) => c.state_id === f.stateId);
  const areas = lookups.areas.filter((a) => a.city_id === f.cityId);
  const type = lookups.types.find((t) => t.id === f.propertyTypeId);
  const isLand = type?.parent === 'Land' || /land/i.test(type?.name ?? '');
  const isCommercial = type?.parent === 'Commercial';
  const currencySymbol = f.countryCode === 'ZA' ? 'R' : '₦';
  const isLive = initial.status === 'published';

  const typeGroups = useMemo(() => {
    const groups = new Map<string, Ref[]>();
    lookups.types.filter((t) => t.parent).forEach((t) => groups.set(t.parent!, [...(groups.get(t.parent!) ?? []), t]));
    return [...groups.entries()];
  }, [lookups.types]);
  const amenityGroups = useMemo(() => {
    const g = new Map<string, Ref[]>();
    lookups.amenities.forEach((a) => g.set(a.group_name, [...(g.get(a.group_name) ?? []), a]));
    return [...g.entries()];
  }, [lookups.amenities]);

  function suggestTitle() {
    const place = [lookups.areas.find((a) => a.id === f.areaId)?.name, lookups.cities.find((c) => c.id === f.cityId)?.name].filter(Boolean).join(', ');
    const what = isLand ? `${f.landSize ? f.landSize + ' ' : ''}${type?.name ?? 'Land'}` : `${f.bedrooms && f.bedrooms !== '0' ? `${f.bedrooms} Bedroom ` : ''}${type?.name ?? 'Property'}`;
    const purpose = f.purpose === 'sale' ? 'for Sale' : f.purpose === 'rent' ? 'for Rent' : 'Shortlet';
    setF((p) => ({ ...p, title: `${what} ${purpose}${place ? ` in ${place}` : ''}` }));
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const supabase = createClient();
    const list = [...files].slice(0, 30 - photos.length);
    setUploading(list.length);
    for (const file of list) {
      try {
        const blob = await compress(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (upErr) throw upErr;
        const url = supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl;
        setPhotos((p) => [...p, url]);
      } catch {
        setError(`Couldn’t upload ${file.name}. Use a JPG or PNG under 10MB and try again.`);
      }
      setUploading((n) => n - 1);
    }
  }

  const move = (i: number, d: number) =>
    setPhotos((p) => {
      const n = [...p];
      const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  function stepProblem(s: number): string | null {
    if (s === 0 && !f.propertyTypeId) return 'Choose the property type.';
    if (s === 1 && (!f.stateId || !f.cityId)) return 'Choose the state and city.';
    if (s === 3 && f.priceOnApplication !== 'yes' && !num(f.price)) return 'Enter the price, or choose “Price on request”.';
    if (s === 4 && photos.length === 0) return 'Add at least one photo.';
    if (s === 4 && f.title.trim().length < 10) return 'Add a title (tap “Suggest a title” for help).';
    return null;
  }

  function next() {
    const p = stepProblem(step);
    if (p) return setError(p);
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit(intent: 'draft' | 'submit' | 'publish') {
    setError(null);
    const input: ListingInput = {
      id: initial.id,
      agentId: isStaff ? f.agentId || undefined : undefined,
      purpose: f.purpose,
      propertyTypeId: f.propertyTypeId,
      title: f.title,
      description: f.description,
      countryCode: f.countryCode,
      stateId: f.stateId,
      cityId: f.cityId,
      areaId: f.areaId || null,
      address: f.address,
      bedrooms: isLand ? null : numOrZero(f.bedrooms),
      bathrooms: isLand ? null : numOrZero(f.bathrooms),
      toilets: isLand ? null : numOrZero(f.toilets),
      parking: isLand ? null : numOrZero(f.parking),
      floorSizeSqm: isLand ? null : num(f.floorSizeSqm),
      landSize: f.landSize || null,
      condition: isLand ? null : f.condition || null,
      furnishing: isLand ? null : f.furnishing || null,
      serviced: f.serviced === 'yes',
      hasBq: f.hasBq === 'yes',
      titleDocument: f.titleDocument || null,
      price: num(f.price),
      priceOnApplication: f.priceOnApplication === 'yes',
      negotiable: bool(f.negotiable),
      paymentPlan: f.paymentPlan || null,
      instalmentDepositPct: num(f.instalmentDepositPct),
      instalmentMonths: num(f.instalmentMonths),
      paymentFrequency: f.paymentFrequency || null,
      minimumTenureYears: num(f.minimumTenureYears),
      serviceChargeBand: f.serviceChargeBand || null,
      agencyFeePct: numOrZero(f.agencyFeePct),
      legalFeePct: numOrZero(f.legalFeePct),
      cautionFee: f.cautionFee || null,
      deposit: f.deposit || null,
      leaseTermMonths: num(f.leaseTermMonths),
      petsAllowed: bool(f.petsAllowed),
      leviesBand: f.leviesBand || null,
      ratesTaxesBand: f.ratesTaxesBand || null,
      minimumNights: num(f.minimumNights),
      maxGuests: num(f.maxGuests),
      checkIn: f.checkIn || null,
      checkOut: f.checkOut || null,
      videoUrl: f.videoUrl || null,
      amenityIds,
      photos,
    };
    startTransition(async () => {
      const res = await saveListing(input, intent);
      if (!res.ok) return setError(res.error);
      router.push(`/portal/listings?saved=${encodeURIComponent(res.ref)}&as=${intent}`);
      router.refresh();
    });
  }

  const priceDisplay = f.price ? Number(f.price.replace(/[^0-9]/g, '')).toLocaleString('en-NG') : '';

  return (
    <div className="mx-auto max-w-3xl">
      {initial.reviewNote && initial.status === 'sent_back' && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <strong>Sent back by an admin:</strong> {initial.reviewNote}
        </div>
      )}
      {isLive && !isStaff && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This listing is live. Saving changes sends it back for approval, and it’s hidden from the website until an admin approves it.
          To mark it Sold or Let, use the buttons on <strong>My listings</strong> instead; that doesn’t need approval.
        </div>
      )}

      {/* Purpose tabs: the only part of the form that isn't a dropdown */}
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-white p-2 shadow-sm" role="tablist" aria-label="Listing purpose">
        {PURPOSES.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={f.purpose === v}
            onClick={() => set('purpose')(v)}
            className={`min-h-[48px] rounded-lg text-base font-bold transition-colors ${f.purpose === v ? 'bg-brand-green text-white' : 'text-brand-ink hover:bg-brand-greenLight'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Progress */}
      <ol className="mb-6 flex gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : undefined)}
              className={`h-1.5 w-full rounded-full ${i <= step ? 'bg-brand-green' : 'bg-line'}`}
              aria-label={`Step ${i + 1}: ${s}`}
              aria-current={i === step ? 'step' : undefined}
            />
          </li>
        ))}
      </ol>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Step {step + 1} of {STEPS.length}</p>
      <h2 className="mb-5 font-display text-3xl">{STEPS[step]}</h2>

      <div className="space-y-5 rounded-xl bg-white p-5 shadow-sm sm:p-6">
        {step === 0 && (
          <>
            {isStaff && lookups.agents && (
              <Select label="Listing agent" value={f.agentId} onChange={set('agentId')} options={lookups.agents.map((a) => [a.id, a.name])} placeholder="Barods Global (no agent)" />
            )}
            <label className="label">
              <span>Property type<span className="text-brand-orange"> *</span></span>
              <select className="field" value={f.propertyTypeId} onChange={(e) => set('propertyTypeId')(e.target.value)}>
                <option value="">Select…</option>
                {typeGroups.map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            {!isLand && <Select label="Condition" value={f.condition} onChange={set('condition')} options={CONDITION} />}
            {f.purpose === 'sale' && <Select label="Title document" value={f.titleDocument} onChange={set('titleDocument')} options={TITLE_DOCS[f.countryCode]} />}
          </>
        )}

        {step === 1 && (
          <>
            <Select
              label="Country"
              required
              value={f.countryCode}
              onChange={(v) => setF((p) => ({ ...p, countryCode: (v || 'NG') as 'NG' | 'ZA', stateId: '', cityId: '', areaId: '', titleDocument: '' }))}
              options={lookups.countries.map((c) => [c.code, c.name])}
              placeholder="Select country…"
            />
            <Select
              label={f.countryCode === 'ZA' ? 'Province' : 'State'}
              required
              value={f.stateId}
              onChange={(v) => setF((p) => ({ ...p, stateId: v, cityId: '', areaId: '' }))}
              options={states.map((s) => [s.id, s.name])}
            />
            <Select
              label="City / town"
              required
              value={f.cityId}
              onChange={(v) => setF((p) => ({ ...p, cityId: v, areaId: '' }))}
              options={cities.map((c) => [c.id, c.name])}
              placeholder={f.stateId ? (cities.length ? 'Select…' : 'No cities yet — ask an admin to add one') : 'Choose the state first'}
            />
            <Select
              label="Area / neighbourhood"
              value={f.areaId}
              onChange={set('areaId')}
              options={areas.map((a) => [a.id, a.name])}
              placeholder={f.cityId ? (areas.length ? 'Select… (or leave blank)' : 'No areas listed yet') : 'Choose the city first'}
              hint="Not listed? Leave it blank and type the street or estate below; an admin will add the area."
            />
            <label className="label">
              Street or estate (optional)
              <input className="field" value={f.address} onChange={(e) => set('address')(e.target.value)} placeholder="e.g. Pelican Valley Estate, off Quarry Road" maxLength={200} />
              <span className="text-[11px] font-normal normal-case tracking-normal">Shown on the listing. Don’t include a house number if the owner prefers privacy.</span>
            </label>
          </>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {isLand ? (
              <LandSizeField label="Land size" value={f.landSize} onChange={set('landSize')} />
            ) : (
              <>
                {!isCommercial && <Select label="Bedrooms" value={f.bedrooms} onChange={set('bedrooms')} options={COUNT_OPTIONS} />}
                <Select label="Bathrooms" value={f.bathrooms} onChange={set('bathrooms')} options={COUNT_OPTIONS} />
                <Select label="Toilets" value={f.toilets} onChange={set('toilets')} options={COUNT_OPTIONS} />
                <Select label="Parking spaces" value={f.parking} onChange={set('parking')} options={COUNT_OPTIONS} />
                <Select label="Floor size" value={f.floorSizeSqm} onChange={set('floorSizeSqm')} options={FLOOR_SIZES} />
                <LandSizeField label="Land size (if known)" value={f.landSize} onChange={set('landSize')} />
                <Select label="Furnishing" value={f.furnishing} onChange={set('furnishing')} options={FURNISHING} />
                <Select label="Serviced (power, water, cleaning)" value={f.serviced} onChange={set('serviced')} options={YES_NO} />
                {!isCommercial && <Select label="Boys’ quarters (BQ)" value={f.hasBq} onChange={set('hasBq')} options={YES_NO} />}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Price on request?" value={f.priceOnApplication} onChange={set('priceOnApplication')} options={[['yes', 'Yes, hide the price']]} placeholder="No, show the price" />
            {f.priceOnApplication !== 'yes' && (
              <label className="label">
                <span>{PRICE_LABEL[f.purpose]}<span className="text-brand-orange"> *</span></span>
                <span className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{currencySymbol}</span>
                  <input className="field pl-8" inputMode="numeric" value={priceDisplay} onChange={(e) => set('price')(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
                </span>
              </label>
            )}

            {f.purpose === 'sale' && (
              <>
                <Select label="Negotiable?" value={f.negotiable} onChange={set('negotiable')} options={YES_NO} />
                <Select label="Payment plan" value={f.paymentPlan} onChange={set('paymentPlan')} options={PAYMENT_PLAN} />
                {f.paymentPlan === 'instalment' && (
                  <>
                    <Select label="Initial deposit" value={f.instalmentDepositPct} onChange={set('instalmentDepositPct')} options={INSTALMENT_DEPOSIT} />
                    <Select label="Spread over" value={f.instalmentMonths} onChange={set('instalmentMonths')} options={INSTALMENT_MONTHS} />
                  </>
                )}
                {f.countryCode === 'ZA' && (
                  <>
                    <Select label="Levies" value={f.leviesBand} onChange={set('leviesBand')} options={ZA_BANDS} />
                    <Select label="Rates and taxes" value={f.ratesTaxesBand} onChange={set('ratesTaxesBand')} options={ZA_BANDS} />
                  </>
                )}
              </>
            )}

            {f.purpose === 'rent' && f.countryCode === 'NG' && (
              <>
                <Select label="Rent paid" value={f.paymentFrequency} onChange={set('paymentFrequency')} options={RENT_FREQUENCY} />
                <Select label="Minimum tenure" value={f.minimumTenureYears} onChange={set('minimumTenureYears')} options={MIN_TENURE} />
                <Select label="Service charge" value={f.serviceChargeBand} onChange={set('serviceChargeBand')} options={SERVICE_CHARGE} />
                <Select label="Agency fee" value={f.agencyFeePct} onChange={set('agencyFeePct')} options={FEE_PCT} />
                <Select label="Legal fee" value={f.legalFeePct} onChange={set('legalFeePct')} options={FEE_PCT} />
                <Select label="Caution fee" value={f.cautionFee} onChange={set('cautionFee')} options={CAUTION_FEE} />
              </>
            )}
            {f.purpose === 'rent' && f.countryCode === 'ZA' && (
              <>
                <Select label="Deposit" value={f.deposit} onChange={set('deposit')} options={ZA_DEPOSIT} />
                <Select label="Lease term" value={f.leaseTermMonths} onChange={set('leaseTermMonths')} options={ZA_LEASE} />
                <Select label="Pets allowed?" value={f.petsAllowed} onChange={set('petsAllowed')} options={YES_NO} />
              </>
            )}

            {f.purpose === 'shortlet' && (
              <>
                <Select label="Minimum stay" value={f.minimumNights} onChange={set('minimumNights')} options={MIN_NIGHTS} />
                <Select label="Maximum guests" value={f.maxGuests} onChange={set('maxGuests')} options={MAX_GUESTS} />
                <Select label="Check-in from" value={f.checkIn} onChange={set('checkIn')} options={TIMES} />
                <Select label="Check-out by" value={f.checkOut} onChange={set('checkOut')} options={TIMES} />
                <Select label="Caution fee" value={f.cautionFee} onChange={set('cautionFee')} options={CAUTION_FEE} />
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <>
            <div>
              <div className="label mb-2"><span>Photos<span className="text-brand-orange"> *</span> <span className="normal-case tracking-normal">(the first photo is the cover)</span></span></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <div key={src} className="relative overflow-hidden rounded-lg border border-line">
                    <img src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                    {i === 0 && <span className="badge absolute left-1.5 top-1.5 bg-brand-green text-white">Cover</span>}
                    <div className="flex justify-between bg-white p-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-9 w-9 rounded text-lg disabled:opacity-30 hover:bg-paper" aria-label="Move left">‹</button>
                      <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="h-9 rounded px-2 text-xs font-semibold text-red-700 hover:bg-red-50">Remove</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="h-9 w-9 rounded text-lg disabled:opacity-30 hover:bg-paper" aria-label="Move right">›</button>
                    </div>
                  </div>
                ))}
                {photos.length < 30 && (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand-green/50 bg-brand-greenLight/40 text-center text-sm font-semibold text-brand-greenDark hover:bg-brand-greenLight">
                    <span className="text-2xl" aria-hidden="true">+</span>
                    {uploading ? `Uploading ${uploading}…` : 'Add photos'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} disabled={uploading > 0} />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">Up to 30 photos. Bright, landscape photos work best. Big photos are made smaller automatically.</p>
            </div>

            <label className="label">
              <span>Title<span className="text-brand-orange"> *</span></span>
              <input className="field" value={f.title} onChange={(e) => set('title')(e.target.value)} maxLength={160} placeholder="e.g. 4 Bedroom Detached Duplex for Sale in Ibara GRA, Abeokuta" />
              <button type="button" onClick={suggestTitle} className="self-start text-xs font-semibold normal-case tracking-normal text-brand-greenDark hover:underline">Suggest a title from my answers</button>
            </label>
            <label className="label">
              Description
              <textarea className="field" rows={6} value={f.description} onChange={(e) => set('description')(e.target.value)} placeholder="What makes this property special? Mention the neighbourhood, access roads, power and water, and anything buyers or tenants always ask." maxLength={6000} />
            </label>

            {!isLand && (
              <fieldset>
                <legend className="label mb-2">Features and amenities</legend>
                <div className="space-y-4">
                  {amenityGroups.map(([group, items]) => (
                    <div key={group}>
                      <div className="mb-1.5 text-sm font-semibold">{group}</div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {items.map((a) => (
                          <label key={a.id} className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-paper">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand-green"
                              checked={amenityIds.includes(a.id)}
                              onChange={(e) => setAmenityIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id)))}
                            />
                            {a.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            )}
            {isLand && (
              <fieldset>
                <legend className="label mb-2">Features</legend>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {lookups.amenities.filter((a) => /road|fenc|gate|estate|drain|electric|power|water|security/i.test(a.name)).map((a) => (
                    <label key={a.id} className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-paper">
                      <input type="checkbox" className="h-4 w-4 accent-brand-green" checked={amenityIds.includes(a.id)} onChange={(e) => setAmenityIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id)))} />
                      {a.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="label">
              Video link (optional)
              <input className="field" type="url" value={f.videoUrl} onChange={(e) => set('videoUrl')(e.target.value)} placeholder="Paste any YouTube link (video, Shorts or youtu.be)" />
              {f.videoUrl.trim() && (
                youTubeEmbed(f.videoUrl) ? (
                  <span className="text-[12px] font-semibold normal-case tracking-normal text-brand-greenDark">✓ This video will play on the listing page.</span>
                ) : (
                  <span className="text-[12px] font-normal normal-case tracking-normal text-amber-800">This isn’t a YouTube video link, so visitors will see a “Watch the video” button instead of the player.</span>
                )
              )}
            </label>
          </>
        )}

        {step === 5 && (
          <div className="space-y-4 text-sm">
            {photos[0] && <img src={photos[0]} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />}
            <h3 className="text-xl font-semibold">{f.title || 'Untitled listing'}</h3>
            <dl className="grid gap-x-6 sm:grid-cols-2">
              {(
                [
                  ['Purpose', PURPOSES.find(([v]) => v === f.purpose)![1]],
                  ['Type', type?.name],
                  ['Location', [lookups.areas.find((a) => a.id === f.areaId)?.name, lookups.cities.find((c) => c.id === f.cityId)?.name, lookups.states.find((s) => s.id === f.stateId)?.name].filter(Boolean).join(', ')],
                  ['Price', f.priceOnApplication === 'yes' ? 'On request' : priceDisplay ? `${currencySymbol}${priceDisplay}${f.purpose === 'rent' ? ' a year' : f.purpose === 'shortlet' ? ' a night' : ''}` : ''],
                  ['Bedrooms', isLand ? '' : f.bedrooms],
                  ['Bathrooms', isLand ? '' : f.bathrooms],
                  ['Size', isLand ? f.landSize : FLOOR_SIZES.find(([v]) => v === f.floorSizeSqm)?.[1]],
                  ['Title document', f.titleDocument],
                  ['Photos', String(photos.length)],
                  ['Features', String(amenityIds.length)],
                ] as [string, string | undefined][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
            </dl>
            <p className="rounded-lg bg-paper p-3 text-muted">
              {isStaff
                ? 'As an admin you can publish this straight away.'
                : 'When you submit, an admin checks the listing before it goes live. You’ll see its status on My listings.'}
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => { setError(null); setStep(step - 1); }} className="btn border border-line bg-white hover:border-brand-ink">← Back</button>}
          <button type="button" onClick={() => submit('draft')} disabled={pending || uploading > 0} className="btn text-muted hover:text-brand-ink">Save draft</button>
        </div>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn-green px-8">Next →</button>
        ) : (
          <div className="flex gap-2">
            {isStaff && <button type="button" onClick={() => submit('publish')} disabled={pending || uploading > 0} className="btn-green px-6">{pending ? 'Saving…' : 'Publish now'}</button>}
            {!isStaff && <button type="button" onClick={() => submit('submit')} disabled={pending || uploading > 0} className="btn-green px-6">{pending ? 'Submitting…' : 'Submit for approval'}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
