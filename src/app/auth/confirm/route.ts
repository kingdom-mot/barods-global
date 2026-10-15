import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Links in Barods' invite and password-reset emails land here:
 *   /auth/confirm?token_hash=…&type=invite|recovery&next=/portal/set-password
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(searchParams.get('next'));

  if (tokenHash && type) {
    const { error } = await createClient().auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}

function safeNext(next: string | null) {
  return next && next.startsWith('/portal') ? next : '/portal';
}
