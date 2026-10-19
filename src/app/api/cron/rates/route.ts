import { NextResponse } from 'next/server';
import { refreshRates } from '@/lib/rates';

export const dynamic = 'force-dynamic';

/** Runs every morning (vercel.json). If CRON_SECRET is set in Vercel, only Vercel's scheduler can call it. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const r = await refreshRates();
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
