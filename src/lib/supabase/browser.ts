import { createBrowserClient } from '@supabase/ssr';

/** Supabase client for the signed-in user in the browser (sign-in, photo uploads). */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const BARODS_DOMAIN = '@barodsglobal.com';
