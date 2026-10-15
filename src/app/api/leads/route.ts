import { NextResponse } from 'next/server';
import { supabase } from '@/lib/data';

// Saves every enquiry as a lead. Email / WhatsApp alerts are added in the next phase.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.name !== 'string' || !b.name.trim() || typeof b.phone !== 'string' || !b.phone.trim()) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  if (!supabase) {
    // No database configured yet (preview build): accept so the form can be demonstrated.
    console.log('[lead]', { name: b.name, source: b.source, property: b.propertyRef });
    return NextResponse.json({ ok: true, stored: false });
  }

  const [property, agent] = await Promise.all([
    b.propertyRef ? supabase.from('properties').select('id, agent_id').eq('ref', b.propertyRef).maybeSingle() : null,
    b.agentSlug ? supabase.from('agents').select('id').eq('slug', b.agentSlug).maybeSingle() : null,
  ]);

  const { error } = await supabase.from('leads').insert({
    name: String(b.name).slice(0, 120),
    phone: String(b.phone).slice(0, 40),
    email: b.email ? String(b.email).slice(0, 160) : null,
    message: [
      b.role ? `I'm a: ${String(b.role).slice(0, 30)}` : '',
      b.tourType ? `Tour: ${String(b.tourType).slice(0, 30)}` : '',
      b.message ? String(b.message).slice(0, 2000) : '',
    ]
      .filter(Boolean)
      .join('\n') || null,
    viewing_at: typeof b.viewingAt === 'string' && !Number.isNaN(Date.parse(b.viewingAt)) ? b.viewingAt : null,
    source: ['property_enquiry', 'viewing_request', 'contact', 'agent_profile', 'service'].includes(b.source) ? b.source : 'contact',
    property_id: property?.data?.id ?? null,
    agent_id: agent?.data?.id ?? property?.data?.agent_id ?? null,
  });

  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
