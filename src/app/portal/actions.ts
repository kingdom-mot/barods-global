'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requirePerm, requireUser } from '@/lib/supabase/server';
import { sendNotice, SITE } from '@/lib/email';
import { adminClient } from '@/lib/supabase/admin';

/** Emails about listings never block the save: failures are logged and skipped. */
async function staffEmails(): Promise<string[]> {
  try {
    const { data } = await adminClient().from('profiles').select('email').in('role', ['admin', 'super_admin']);
    return (data ?? []).map((r) => r.email).filter(Boolean);
  } catch {
    return [];
  }
}
async function quietly(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    console.warn('[listing email]', e);
  }
}

export type ListingInput = {
  id?: string;
  agentId?: string; // staff only: who the listing belongs to
  purpose: 'sale' | 'rent' | 'shortlet';
  propertyTypeId: string;
  title: string;
  description: string;
  countryCode: 'NG' | 'ZA';
  stateId: string;
  cityId: string;
  areaId: string | null;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parking: number | null;
  floorSizeSqm: number | null;
  landSize: string | null;
  condition: string | null;
  furnishing: string | null;
  serviced: boolean;
  hasBq: boolean;
  titleDocument: string | null;
  price: number | null;
  priceOnApplication: boolean;
  negotiable: boolean | null;
  paymentPlan: string | null;
  instalmentDepositPct: number | null;
  instalmentMonths: number | null;
  paymentFrequency: string | null;
  minimumTenureYears: number | null;
  serviceChargeBand: string | null;
  agencyFeePct: number | null;
  legalFeePct: number | null;
  cautionFee: string | null;
  deposit: string | null;
  leaseTermMonths: number | null;
  petsAllowed: boolean | null;
  leviesBand: string | null;
  ratesTaxesBand: string | null;
  minimumNights: number | null;
  maxGuests: number | null;
  checkIn: string | null;
  checkOut: string | null;
  videoUrl: string | null;
  amenityIds: string[];
  photos: string[];
};

export type SaveResult = { ok: true; id: string; ref: string } | { ok: false; error: string };

const PERIOD = { sale: 'once', rent: 'year', shortlet: 'night' } as const;

/** Save as draft, submit for approval, or (staff) publish straight away. */
export async function saveListing(input: ListingInput, intent: 'draft' | 'submit' | 'publish'): Promise<SaveResult> {
  const me = await requireUser();
  const supabase = createClient();

  if (intent === 'publish' && !me.can.listings) return { ok: false, error: 'Only admins can publish directly.' };
  if (!me.can.listings && !me.agent) return { ok: false, error: 'Your agent profile isn’t set up yet. Ask an admin.' };
  if (intent !== 'draft') {
    const missing = [
      !input.propertyTypeId && 'property type',
      input.title.trim().length < 10 && 'a title (at least 10 characters)',
      !input.stateId && 'state',
      !input.cityId && 'city',
      !input.priceOnApplication && !input.price && 'price',
      input.photos.length === 0 && 'at least one photo',
    ].filter(Boolean);
    if (missing.length) return { ok: false, error: `Please add ${missing.join(', ')}.` };
  }

  const status = intent === 'publish' ? 'published' : intent === 'submit' ? 'pending_review' : 'draft';
  const isRent = input.purpose === 'rent';
  const isSale = input.purpose === 'sale';
  const isShortlet = input.purpose === 'shortlet';

  const row = {
    purpose: input.purpose,
    property_type_id: input.propertyTypeId || null,
    title: input.title.trim().slice(0, 160),
    description: input.description.trim().slice(0, 6000) || null,
    country_code: input.countryCode,
    state_id: input.stateId || null,
    city_id: input.cityId || null,
    area_id: input.areaId || null,
    address: input.address.trim().slice(0, 200) || null,
    currency: input.countryCode === 'ZA' ? 'ZAR' : 'NGN',
    price: input.priceOnApplication ? null : input.price,
    price_on_application: input.priceOnApplication,
    price_period: PERIOD[input.purpose],
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    toilets: input.toilets,
    parking: input.parking,
    floor_size_sqm: input.floorSizeSqm,
    land_size: input.landSize,
    condition: input.condition,
    furnishing: input.furnishing,
    serviced: input.serviced,
    has_bq: input.hasBq,
    title_document: input.titleDocument,
    negotiable: isSale ? input.negotiable : null,
    payment_plan: isSale ? input.paymentPlan : null,
    instalment_deposit_pct: isSale && input.paymentPlan === 'instalment' ? input.instalmentDepositPct : null,
    instalment_months: isSale && input.paymentPlan === 'instalment' ? input.instalmentMonths : null,
    // Rent-only terms are cleared on Buy and Shortlet listings.
    payment_frequency: isRent ? input.paymentFrequency : null,
    minimum_tenure_years: isRent ? input.minimumTenureYears : null,
    service_charge_band: isRent ? input.serviceChargeBand : null,
    agency_fee_pct: isRent ? input.agencyFeePct : null,
    legal_fee_pct: isRent ? input.legalFeePct : null,
    caution_fee: isRent || isShortlet ? input.cautionFee : null,
    deposit: isRent ? input.deposit : null,
    lease_term_months: isRent ? input.leaseTermMonths : null,
    pets_allowed: isRent ? input.petsAllowed : null,
    levies_band: isSale && input.countryCode === 'ZA' ? input.leviesBand : null,
    rates_taxes_band: isSale && input.countryCode === 'ZA' ? input.ratesTaxesBand : null,
    minimum_nights: isShortlet ? input.minimumNights : null,
    max_guests: isShortlet ? input.maxGuests : null,
    check_in: isShortlet ? input.checkIn : null,
    check_out: isShortlet ? input.checkOut : null,
    video_url: input.videoUrl?.trim() || null,
    status,
    ...(intent === 'publish' ? { published_at: new Date().toISOString(), review_note: null } : {}),
    ...(me.can.listings && input.agentId ? { agent_id: input.agentId } : {}),
  };

  let id = input.id;
  let ref = '';
  if (id) {
    const { data, error } = await supabase.from('properties').update(row).eq('id', id).select('id, ref').maybeSingle();
    if (error || !data) return { ok: false, error: 'Couldn’t save this listing. It may have been removed, or you may not have access.' };
    ref = data.ref;
  } else {
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...row, agent_id: me.can.listings ? input.agentId || me.agent?.id || null : me.agent!.id })
      .select('id, ref')
      .single();
    if (error || !data) return { ok: false, error: 'Couldn’t save this listing. Please try again.' };
    id = data.id;
    ref = data.ref;
  }

  // Photos (first = cover) and features are replaced as a set.
  await supabase.from('property_media').delete().eq('property_id', id).eq('kind', 'photo');
  if (input.photos.length) {
    await supabase
      .from('property_media')
      .insert(input.photos.slice(0, 30).map((url, sort) => ({ property_id: id, kind: 'photo', url, sort })));
  }
  await supabase.from('property_amenities').delete().eq('property_id', id);
  if (input.amenityIds.length) {
    await supabase.from('property_amenities').insert(input.amenityIds.map((amenity_id) => ({ property_id: id, amenity_id })));
  }

  if (intent === 'submit') {
    await quietly(
      (async () => {
        const to = await staffEmails();
        if (!to.length) return;
        await sendNotice({
          to,
          subject: `Listing to review: ${input.title.trim()}`,
          heading: 'A listing is waiting for approval',
          lines: [`${me.agent?.fullName ?? me.fullName ?? 'An agent'} sent “${input.title.trim()}”${ref ? ` (${ref})` : ''} for review.`, 'Approve it to put it on the website, or send it back with a note.'],
          button: { label: 'Review listings', href: `${SITE}/portal/approvals` },
        });
      })(),
    );
  }

  revalidatePath('/portal', 'layout');
  return { ok: true, id: id!, ref };
}

export async function deleteListing(id: string) {
  await requireUser();
  const { error } = await createClient().from('properties').delete().eq('id', id);
  revalidatePath('/portal', 'layout');
  return error ? { ok: false as const, error: 'Only drafts and listings sent back can be deleted.' } : { ok: true as const };
}

export async function setAvailability(id: string, availability: 'available' | 'under_offer' | 'sold' | 'let') {
  await requireUser();
  const { error } = await createClient().rpc('set_listing_availability', { p_id: id, p_availability: availability });
  revalidatePath('/portal', 'layout');
  return error ? { ok: false as const, error: 'Couldn’t update this listing.' } : { ok: true as const };
}

export async function reviewListing(id: string, decision: 'approve' | 'send_back', note: string) {
  await requirePerm('listings');
  const supabase = createClient();
  const update =
    decision === 'approve'
      ? { status: 'published', published_at: new Date().toISOString(), review_note: null }
      : { status: 'sent_back', review_note: note.trim().slice(0, 1000) || 'Please review and update this listing.' };
  const { error } = await supabase.from('properties').update(update).eq('id', id);
  if (!error) {
    await quietly(
      (async () => {
        const { data: p } = await adminClient().from('properties').select('title, ref, slug, agents(full_name, email)').eq('id', id).maybeSingle();
        const agent = p?.agents as unknown as { full_name: string; email: string | null } | null;
        if (!p || !agent?.email) return;
        const first = agent.full_name.split(' ')[0];
        await sendNotice(
          decision === 'approve'
            ? {
                to: [agent.email],
                subject: `Your listing is live: ${p.title}`,
                heading: 'Your listing has been approved',
                lines: [`Hi ${first},`, `“${p.title}”${p.ref ? ` (${p.ref})` : ''} is now live on the Barods Global website.`],
                button: { label: 'View the listing', href: `${SITE}/property/${p.slug}` },
              }
            : {
                to: [agent.email],
                subject: `Changes needed: ${p.title}`,
                heading: 'Your listing needs a few changes',
                lines: [`Hi ${first},`, `“${p.title}” was sent back with this note:`, String(update.review_note), 'Make the changes and send it for review again.'],
                button: { label: 'Edit the listing', href: `${SITE}/portal/listings/${id}` },
              },
        );
      })(),
    );
  }
  revalidatePath('/portal', 'layout');
  return error ? { ok: false as const, error: 'Couldn’t update this listing.' } : { ok: true as const };
}

export async function updateLead(id: string, status: string, note: string) {
  await requireUser();
  const allowed = ['new', 'contacted', 'viewing_booked', 'offer_made', 'closed_won', 'closed_lost'];
  if (!allowed.includes(status)) return { ok: false as const };
  const { error } = await createClient()
    .from('leads')
    .update({ status, internal_note: note.trim().slice(0, 2000) || null })
    .eq('id', id);
  revalidatePath('/portal/leads');
  return { ok: !error };
}

export async function updateProfile(input: { fullName: string; position: string; phone: string; whatsapp: string; bio: string; serviceAreas: string; photoUrl: string | null }) {
  const me = await requireUser();
  if (!me.agent) return { ok: false as const, error: 'No agent card is linked to your account.' };
  const complete = Boolean(input.fullName.trim() && input.phone.trim() && input.photoUrl);
  const row = {
      full_name: input.fullName.trim().slice(0, 120),
      position: input.position.trim().slice(0, 120) || null,
      phone: input.phone.trim().slice(0, 40) || null,
      whatsapp: input.whatsapp.trim().slice(0, 40) || null,
      bio: input.bio.trim().slice(0, 1200) || null,
      photo_url: input.photoUrl,
      // A completed card goes live on the Agents page.
      ...(me.agent.status === 'invited' && complete ? { status: 'active' } : {}),
  };
  const areas = input.serviceAreas.split(',').map((a) => a.trim()).filter(Boolean).join(', ').slice(0, 200) || null;
  let { error } = await createClient().from('agents').update({ ...row, service_areas: areas }).eq('id', me.agent.id);
  // Before migration 0008 the column doesn't exist yet: save everything else.
  if (error?.message.includes('service_areas')) ({ error } = await createClient().from('agents').update(row).eq('id', me.agent.id));
  revalidatePath('/portal', 'layout');
  return error ? { ok: false as const, error: 'Couldn’t save your profile.' } : { ok: true as const, activated: me.agent.status === 'invited' && complete };
}

export async function setPassword(password: string) {
  await requireUser();
  if (password.length < 8) return { ok: false as const, error: 'Use at least 8 characters.' };
  const { error } = await createClient().auth.updateUser({ password });
  return error ? { ok: false as const, error: 'Couldn’t set your password. Try a different one.' } : { ok: true as const };
}
