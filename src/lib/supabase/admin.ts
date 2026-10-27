import 'server-only'; // the build fails if this file is ever imported into browser code
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Full-access Supabase client for admin actions (inviting, suspending, removing accounts).
 * Server-only: uses SUPABASE_SERVICE_ROLE_KEY, which must never reach the browser.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
