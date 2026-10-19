import { adminClient } from './supabase/admin';

const CODES = ['ZAR', 'USD', 'GBP', 'EUR', 'CAD'];

/** Fetch today's rates (units per ₦1) from a free public source and store them. */
export async function refreshRates(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/NGN', { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (!res.ok || body.result !== 'success' || !body.rates) return { ok: false, message: 'The rates service didn’t answer. The previous rates are still in use.' };
    const rows = CODES.filter((c) => body.rates![c] > 0).map((c) => ({ currency: c, per_ngn: body.rates![c], updated_at: new Date().toISOString() }));
    const { error } = await adminClient().from('currency_rates').upsert(rows, { onConflict: 'currency' });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: `Updated ${rows.length} currencies.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
