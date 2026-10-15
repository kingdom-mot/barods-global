import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  await createClient().auth.signOut();
  return NextResponse.redirect(`${req.nextUrl.origin}/login?signed-out=1`, { status: 303 });
}
