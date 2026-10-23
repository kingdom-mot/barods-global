import { NextResponse } from 'next/server';
import { refreshRates } from '@/lib/rates';

export const dynamic = 'force-dynamic';

/**
 * Runs every morning: from vercel.json on Vercel, or a Hostinger Cron Job elsewhere.
 * With CRON_SECRET set, the caller must send it (as "Authorization: Bearer …" or ?secret=…).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? new URL(req.url).searchParams.get('secret');
  if (secret && given !== secret) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const r = await refreshRates();
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
