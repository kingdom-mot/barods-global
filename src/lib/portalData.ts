import type { FormLookups, InitialListing } from '@/components/portal/ListingForm';
import type { createClient } from '@/lib/supabase/server';

type Client = ReturnType<typeof createClient>;

/** Dropdown lists for the listing form (all locations, types and features). */
export async function getLookups(supabase: Client, isStaff: boolean): Promise<FormLookups> {
  const [countries, states, cities, areas, types, amenities, agents] = await Promise.all([
    supabase.from('countries').select('code, name').eq('active', true).order('name'),
    supabase.from('states').select('id, name, country_code').eq('active', true).order('name'),
    supabase.from('cities').select('id, name, state_id').eq('active', true).order('name').limit(5000),
    supabase.from('areas').select('id, name, city_id').eq('active', true).order('name').limit(10000),
    supabase.from('property_types').select('id, name, sort, parent:parent_id(name)').order('sort'),
    supabase.from('amenities').select('id, name, group_name').order('group_name').order('name'),
    isStaff ? supabase.from('agents').select('id, full_name').neq('status', 'suspended').order('full_name') : Promise.resolve({ data: [] }),
  ]);
  // Nigeria first: it's the default market.
  const countryList = (countries.data ?? []).sort((a, b) => (a.code === 'NG' ? -1 : b.code === 'NG' ? 1 : 0));
  return {
    countries: countryList as FormLookups['countries'],
    states: states.data ?? [],
    cities: cities.data ?? [],
    areas: areas.data ?? [],
    types: (types.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      parent: (t.parent as unknown as { name: string } | null)?.name ?? null,
    })),
    amenities: amenities.data ?? [],
    agents: isStaff ? (agents.data ?? []).map((a: { id: string; full_name: string }) => ({ id: a.id, name: a.full_name })) : undefined,
  };
}

/** A saved listing, shaped for the form. */
export async function getListingForEdit(supabase: Client, id: string): Promise<InitialListing | null> {
  const { data: r } = await supabase
    .from('properties')
    .select('*, property_media(url, kind, sort), property_amenities(amenity_id)')
    .eq('id', id)
    .maybeSingle();
  if (!r) return null;
  const photos = (r.property_media ?? [])
    .filter((m: { kind: string }) => m.kind === 'photo')
    .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
    .map((m: { url: string }) => m.url);
  return {
    id: r.id,
    ref: r.ref,
    status: r.status,
    reviewNote: r.review_note,
    agentId: r.agent_id ?? undefined,
    purpose: r.purpose,
    propertyTypeId: r.property_type_id ?? '',
    title: r.title,
    description: r.description ?? '',
    countryCode: r.country_code,
    stateId: r.state_id ?? '',
    cityId: r.city_id ?? '',
    areaId: r.area_id,
    address: r.address ?? '',
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    toilets: r.toilets,
    parking: r.parking,
    floorSizeSqm: r.floor_size_sqm,
    landSize: r.land_size,
    condition: r.condition,
    furnishing: r.furnishing,
    serviced: r.serviced ?? false,
    hasBq: r.has_bq ?? false,
    titleDocument: r.title_document,
    price: r.price !== null ? Number(r.price) : null,
    priceOnApplication: r.price_on_application,
    negotiable: r.negotiable,
    paymentPlan: r.payment_plan,
    instalmentDepositPct: r.instalment_deposit_pct,
    instalmentMonths: r.instalment_months,
    paymentFrequency: r.payment_frequency,
    minimumTenureYears: r.minimum_tenure_years,
    serviceChargeBand: r.service_charge_band,
    agencyFeePct: r.agency_fee_pct !== null ? Number(r.agency_fee_pct) : null,
    legalFeePct: r.legal_fee_pct !== null ? Number(r.legal_fee_pct) : null,
    cautionFee: r.caution_fee,
    deposit: r.deposit,
    leaseTermMonths: r.lease_term_months,
    petsAllowed: r.pets_allowed,
    leviesBand: r.levies_band,
    ratesTaxesBand: r.rates_taxes_band,
    minimumNights: r.minimum_nights,
    maxGuests: r.max_guests,
    checkIn: r.check_in ? String(r.check_in).slice(0, 5) : null,
    checkOut: r.check_out ? String(r.check_out).slice(0, 5) : null,
    videoUrl: r.video_url,
    amenityIds: (r.property_amenities ?? []).map((a: { amenity_id: string }) => a.amenity_id),
    photos,
  };
}

export function naira(n: number | null, currency = 'NGN') {
  if (n === null) return 'On request';
  return `${currency === 'ZAR' ? 'R' : '₦'}${Number(n).toLocaleString('en-NG')}`;
}
