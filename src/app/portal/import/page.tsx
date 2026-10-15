import Link from 'next/link';
import ImportRunner from '@/components/portal/ImportRunner';
import { createClient, requireStaff } from '@/lib/supabase/server';

export const metadata = { title: 'Import from WordPress' };

export default async function ImportPage() {
  await requireStaff();
  const supabase = createClient();
  const count = async (status?: string) => {
    let q = supabase.from('wp_media_copy').select('path', { count: 'exact', head: true });
    if (status) q = q.eq('status', status);
    const { count: n, error } = await q;
    return error ? null : n ?? 0;
  };
  const [total, done, errors] = await Promise.all([count(), count('done'), count('error')]);
  const ready = total !== null;
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-4xl">Import from WordPress</h1>
      <p className="mb-6 text-sm text-muted">
        Copies every listing, agent and photo from the current barodsglobal.com into the new site. Safe to run more than once:
        listings already imported are updated, not duplicated. Run it once more just before the domain moves, to catch any last changes.
      </p>

      {!ready || !hasKey ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Two things to set up first:</p>
          <ol className="list-decimal space-y-1 pl-5">
            {!ready && <li>Run <code>supabase/migrations/0005_wordpress_import.sql</code> in the Supabase SQL Editor.</li>}
            {!hasKey && (
              <li>
                In Vercel → Settings → Environment Variables, add <code>SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → Project Settings → API Keys →
                the <em>service_role</em> / secret key), then redeploy. Never put this key anywhere public.
              </li>
            )}
          </ol>
        </div>
      ) : (
        <ImportRunner initial={total ? { total, done: done ?? 0, errors: errors ?? 0, pending: total - (done ?? 0) - (errors ?? 0) } : null} />
      )}

      <p className="mt-8 text-sm text-muted">
        After importing, check <Link href="/portal/listings" className="font-semibold text-brand-greenDark hover:underline">All listings</Link>:
        set an agent on any listing that shows “Barods Global”, and archive duplicates you don’t want shown.
      </p>
    </div>
  );
}
