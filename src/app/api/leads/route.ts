import { NextResponse } from 'next/server';
import { supabase } from '@/lib/data';
import { FALLBACK_LEAD_EMAIL, sendLeadEmail } from '@/lib/email';

const SOURCES = ['property_enquiry', 'viewing_request', 'contact', 'agent_profile', 'service', 'visitor_signup'];
const KIND: Record<string, string> = {
  property_enquiry: 'Property enquiry',
  viewing_request: 'Tour request',
  agent_profile: 'Enquiry from your profile',
  contact: 'Contact form message',
  service: 'Service enquiry',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Saves every enquiry as a lead, then emails it to the agent who listed the property
 * (or the agent whose profile it came from). Anything without an agent goes to the Barods inbox.
 * Visitor sign-ups (name + email for follow-up) are saved for staff, without an email.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const source = SOURCES.includes(b?.source) ? (b.source as string) : 'contact';
  const name = typeof b?.name === 'string' ? b.name.trim().slice(0, 120) : '';
  const phone = typeof b?.phone === 'string' ? b.phone.trim().slice(0, 40) : '';
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase().slice(0, 160) : '';

  if (source === 'visitor_signup') {
    if (!name || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Name and a valid email are required' }, { status: 400 });
    if (b?.consent !== true) return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
  } else if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: 'That email address doesn’t look right' }, { status: 400 });

  if (!supabase) {
    // No database configured yet (preview build): accept so the form can be demonstrated.
    console.log('[lead]', { name, source, property: b?.propertyRef });
    return NextResponse.json({ ok: true, stored: false });
  }

  if (source === 'visitor_signup') {
    // One record per email address.
    const { data: existing } = await supabase.from('leads').select('id').eq('source', 'visitor_signup').eq('email', email).limit(1);
    if (existing?.length) return NextResponse.json({ ok: true, stored: true });
    const page = typeof b?.page === 'string' ? b.page.slice(0, 200) : '';
    const { error } = await supabase.from('leads').insert({
      name,
      email,
      phone: null,
      source,
      message: `Asked to be kept updated (agreed to follow-up)${page ? ` · signed up on ${page}` : ''}`,
    });
    if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    return NextResponse.json({ ok: true, stored: true });
  }

  const [propertyRes, agentRes] = await Promise.all([
    b?.propertyRef
      ? supabase.from('properties').select('id, title, ref, slug, agent_id, agents(id, full_name, email)').eq('ref', String(b.propertyRef)).maybeSingle()
      : null,
    b?.agentSlug ? supabase.from('agents').select('id, full_name, email').eq('slug', String(b.agentSlug)).maybeSingle() : null,
  ]);
  const property = propertyRes?.data ?? null;
  // The listing's own agent wins over whatever the page passed in.
  const listingAgent = (property?.agents as unknown as { id: string; full_name: string; email: string } | null) ?? null;
  const agent = listingAgent ?? agentRes?.data ?? null;

  const message =
    [
      b?.role ? `I'm a: ${String(b.role).slice(0, 30)}` : '',
      b?.tourType ? `Tour: ${String(b.tourType).slice(0, 30)}` : '',
      b?.message ? String(b.message).slice(0, 2000) : '',
    ]
      .filter(Boolean)
      .join('\n') || null;
  const viewingAt = typeof b?.viewingAt === 'string' && !Number.isNaN(Date.parse(b.viewingAt)) ? b.viewingAt : null;

  const { error } = await supabase.from('leads').insert({
    name,
    phone,
    email: email || null,
    message,
    viewing_at: viewingAt,
    source,
    property_id: property?.id ?? null,
    agent_id: agent?.id ?? property?.agent_id ?? null,
  });
  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });

  const mail = await sendLeadEmail({
    to: agent?.email || FALLBACK_LEAD_EMAIL,
    agentName: agent?.full_name,
    kind: KIND[source] ?? 'Enquiry',
    visitor: { name, phone, email: email || null, message },
    property: property ? { title: property.title, ref: property.ref, slug: property.slug } : null,
    viewingAt,
  });
  if (!mail.sent) console.warn('[lead email not sent]', mail.reason);

  return NextResponse.json({ ok: true, stored: true, emailed: mail.sent });
}
