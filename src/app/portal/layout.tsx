import type { Metadata } from 'next';
import PortalNav from '@/components/portal/PortalNav';
import { createClient, requireUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: { default: 'Agent portal', template: '%s | Barods portal' }, robots: { index: false } };
export const dynamic = 'force-dynamic';

const ROLE_LABEL = { super_admin: 'Owner · Super admin', admin: 'Admin', agent: 'Agent' } as const;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const supabase = createClient();
  const [{ count: newLeads }, { count: pending }] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    me.can.listings
      ? supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending_review')
      : Promise.resolve({ count: 0 }),
  ]);

  // Everyone gets their own listings, leads and profile; the rest follows their permissions.
  const items = [
    { href: '/portal', label: 'Dashboard' },
    { href: '/portal/listings/new', label: 'Add a listing' },
    { href: '/portal/listings', label: me.can.listings ? 'All listings' : 'My listings' },
    { href: '/portal/leads', label: me.can.leads ? 'All leads' : 'My leads', badge: newLeads ?? 0 },
    ...(me.can.listings ? [{ href: '/portal/approvals', label: 'Approvals', badge: pending ?? 0 }] : []),
    ...(me.can.team ? [{ href: '/portal/team', label: me.isStaff ? 'Agents and permissions' : 'Agents' }] : []),
    ...(me.can.blog ? [{ href: '/portal/blog', label: 'Blog' }] : []),
    ...(me.can.website ? [{ href: '/portal/site', label: 'Website' }] : []),
    ...(me.can.activity ? [{ href: '/portal/activity', label: 'Activity log' }] : []),
    ...(me.isStaff ? [{ href: '/portal/import', label: 'Import from WordPress' }] : []),
    ...(me.agent ? [{ href: '/portal/profile', label: 'My profile' }] : []),
    { href: '/portal/set-password', label: 'Change password' },
  ];

  // An agent with extra permissions sees them under their name.
  const extra = me.isStaff ? [] : me.permissions;
  const roleLabel = extra.length ? `${ROLE_LABEL[me.role]} · +${extra.length} permission${extra.length > 1 ? 's' : ''}` : ROLE_LABEL[me.role];

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <PortalNav items={items} name={me.agent?.fullName ?? me.fullName} roleLabel={roleLabel} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
