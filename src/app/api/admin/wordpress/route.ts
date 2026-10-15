import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { copyMediaBatch, importData, mediaProgress, retryFailed } from '@/lib/wordpress';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Owner/admin only: run one step of the WordPress import. */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

  const { step, ids } = (await req.json().catch(() => ({}))) as { step?: string; ids?: number[] };
  try {
    if (step === 'start') return NextResponse.json(await importData());
    if (step === 'listings') {
      const clean = (ids ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 5);
      if (!clean.length) return NextResponse.json({ error: 'No listings given.' }, { status: 400 });
      return NextResponse.json(await importData({ ids: clean }));
    }
    if (step === 'media') return NextResponse.json(await copyMediaBatch(6));
    if (step === 'retry') return NextResponse.json(await retryFailed());
    return NextResponse.json(await mediaProgress());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
