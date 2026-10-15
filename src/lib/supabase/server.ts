import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

type CookieList = { name: string; value: string; options: CookieOptions }[];

/** Supabase client acting as the signed-in user (row-level security applies). */
export function createClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: CookieList) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

export type Role = 'super_admin' | 'admin' | 'agent';

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isOwner: boolean;
  isStaff: boolean;
  agent: {
    id: string;
    slug: string;
    fullName: string;
    position: string | null;
    phone: string | null;
    whatsapp: string | null;
    photoUrl: string | null;
    bio: string | null;
    status: 'active' | 'invited' | 'suspended';
  } | null;
}

/** The signed-in Barods user, or a redirect to sign in. One lookup per request. */
export const requireUser = cache(async (): Promise<PortalUser> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: agent }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, role, is_owner').eq('id', user.id).maybeSingle(),
    supabase
      .from('agents')
      .select('id, slug, full_name, position, phone, whatsapp, photo_url, bio, status')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ]);
  if (!profile) redirect('/login?error=no-profile');

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isOwner: profile.is_owner,
    isStaff: profile.role === 'admin' || profile.role === 'super_admin',
    agent: agent
      ? {
          id: agent.id,
          slug: agent.slug,
          fullName: agent.full_name,
          position: agent.position,
          phone: agent.phone,
          whatsapp: agent.whatsapp,
          photoUrl: agent.photo_url,
          bio: agent.bio,
          status: agent.status,
        }
      : null,
  };
});

export async function requireStaff() {
  const me = await requireUser();
  if (!me.isStaff) redirect('/portal');
  return me;
}
