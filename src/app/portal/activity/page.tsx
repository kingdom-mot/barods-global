import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Activity log' };

export default async function ActivityPage() {
  await requirePerm('activity');
  const supabase = createClient();
  const [{ data: rows }, { data: people }] = await Promise.all([
    supabase.from('activity_log').select('id, actor, action, entity, entity_id, created_at').order('created_at', { ascending: false }).limit(300),
    supabase.from('profiles').select('id, full_name'),
  ]);
  const name = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  let lastDay = '';

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 font-display text-4xl">Activity log</h1>
      <p className="mb-6 text-sm text-muted">Who changed what in the portal, newest first (last 300 actions).</p>
      {!rows?.length ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">Nothing recorded yet.</p>
      ) : (
        <ol className="rounded-xl border border-line bg-white">
          {rows.map((r) => {
            const d = new Date(r.created_at);
            const day = d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const header = day !== lastDay ? day : null;
            lastDay = day;
            return (
              <li key={r.id}>
                {header && <div className="border-b border-line bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">{header}</div>}
                <div className="flex items-baseline gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0">
                  <span className="w-16 shrink-0 text-xs text-muted">{d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}</span>
                  <span>
                    <strong>{name.get(r.actor) ?? 'Someone'}</strong> {r.action}
                    {r.entity && <span className="text-muted"> · {r.entity}{r.entity_id && r.entity_id.length < 40 ? `: ${r.entity_id}` : ''}</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
