import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { PERM_KEYS, isPermKey, type PermKey } from '@/lib/permissions';

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
  /** Permissions ticked for this person (admins have every one). */
  permissions: PermKey[];
  /** What this person may do: can.listings, can.leads, can.blog, can.website, can.team, can.activity. */
  can: Record<PermKey, boolean>;
  agent: {
    id: string;
    slug: string;
    fullName: string;
    position: string | null;
    phone: string | null;
    whatsapp: string | null;
    photoUrl: string | null;
    bio: string | null;
    serviceAreas: string | null;
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
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('agents')
      .select('*') // all columns, so a newly added one never breaks sign-in
      .eq('profile_id', user.id)
      .maybeSingle(),
  ]);
  if (!profile) redirect('/login?error=no-profile');
  const isStaff = profile.role === 'admin' || profile.role === 'super_admin';
  const granted = ((profile.permissions as unknown[] | null) ?? []).filter(isPermKey);
  const permissions = isStaff ? [...PERM_KEYS] : granted;
  const can = Object.fromEntries(PERM_KEYS.map((k) => [k, permissions.includes(k)])) as Record<PermKey, boolean>;

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isOwner: profile.is_owner,
    isStaff,
    permissions,
    can,
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
          serviceAreas: agent.service_areas ?? null,
          status: agent.status,
        }
      : null,
  };
});

/** Pages and actions that need a permission: anyone without it goes back to their dashboard. */
export async function requirePerm(p: PermKey) {
  const me = await requireUser();
  if (!me.can[p]) redirect('/portal');
  return me;
}

/** Admin-only (roles, permissions, suspending, WordPress import). */
export async function requireStaff() {
  const me = await requireUser();
  if (!me.isStaff) redirect('/portal');
  return me;
}
