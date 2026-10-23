import Link from 'next/link';
import ReviewButtons from '@/components/portal/ReviewButtons';
import { ApproveAgentButton } from '@/components/portal/TeamControls';
import { naira } from '@/lib/portalData';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Approvals' };

const PURPOSE = { sale: 'For sale', rent: 'For rent', shortlet: 'Shortlet' } as const;

export default async function ApprovalsPage() {
  const me = await requirePerm('listings');
  const { data: newAgents } = me.can.team
    ? await createClient()
        .from('agents')
        .select('id, full_name, position, phone, photo_url')
        .eq('status', 'invited')
        .not('profile_id', 'is', null)
        .not('phone', 'is', null)
        .not('photo_url', 'is', null)
        .order('created_at')
    : { data: [] };
  const { data: rows } = await createClient()
    .from('properties')
    .select(
      'id, ref, title, description, purpose, price, currency, price_on_application, bedrooms, bathrooms, land_size, title_document, updated_at, agents(full_name, phone), property_types(name), states(name), cities(name), areas(name), property_media(url, sort, kind)',
    )
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-display text-4xl">Approvals</h1>
      <p className="mb-6 text-sm text-muted">Listings agents have submitted. Approve to publish on the website, or send back with a note.</p>

      {(newAgents ?? []).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold">New agents to approve ({newAgents!.length})</h2>
          <ul className="space-y-3">
            {newAgents!.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center">
                <img src={a.photo_url!} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover object-top" />
                <div className="min-w-0 sm:w-56">
                  <div className="font-semibold">{a.full_name}</div>
                  <div className="text-sm text-muted">{a.position ?? 'Agent'} · {a.phone}</div>
                </div>
                <div className="min-w-0 flex-1"><ApproveAgentButton agentId={a.id} name={a.full_name} ready /></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!rows || rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">Nothing waiting. You’re all caught up.</p>
      ) : (
        <ul className="space-y-5">
          {rows.map((r) => {
            const photos = (r.property_media ?? [])
              .filter((m: { kind: string }) => m.kind === 'photo')
              .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
              .map((m: { url: string }) => m.url);
            const agent = r.agents as unknown as { full_name: string; phone: string | null } | null;
            const place = [r.areas, r.cities, r.states].map((x) => (x as unknown as { name: string } | null)?.name).filter(Boolean).join(', ');
            return (
              <li key={r.id} className="overflow-hidden rounded-xl border border-line bg-white">
                {photos.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto bg-paper p-1">
                    {photos.map((src: string) => <img key={src} src={src} alt="" className="h-36 w-52 shrink-0 rounded object-cover" />)}
                  </div>
                )}
                <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0 space-y-1.5 text-sm">
                    <div className="text-xs text-muted">{r.ref} · {PURPOSE[r.purpose as keyof typeof PURPOSE]} · submitted {new Date(r.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                    <h2 className="text-lg font-semibold">{r.title}</h2>
                    <div className="font-bold text-brand-greenDark">{r.price_on_application ? 'Price on request' : naira(r.price, r.currency)}</div>
                    <div className="text-muted">
                      {[(r.property_types as unknown as { name: string } | null)?.name, place, r.bedrooms ? `${r.bedrooms} beds` : null, r.bathrooms ? `${r.bathrooms} baths` : null, r.land_size, r.title_document].filter(Boolean).join(' · ')}
                    </div>
                    {r.description && <p className="line-clamp-4 whitespace-pre-line">{r.description}</p>}
                    <div className="text-muted">Agent: {agent?.full_name ?? 'Barods Global'}{agent?.phone ? ` · ${agent.phone}` : ''}</div>
                    <Link href={`/portal/listings/${r.id}`} className="inline-block font-semibold text-brand-greenDark hover:underline">Open full listing to edit →</Link>
                  </div>
                  <ReviewButtons id={r.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
