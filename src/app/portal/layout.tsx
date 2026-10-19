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
    me.isStaff
      ? supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending_review')
      : Promise.resolve({ count: 0 }),
  ]);

  const items = [
    { href: '/portal', label: 'Dashboard' },
    { href: '/portal/listings/new', label: 'Add a listing' },
    { href: '/portal/listings', label: me.isStaff ? 'All listings' : 'My listings' },
    { href: '/portal/leads', label: me.isStaff ? 'All leads' : 'My leads', badge: newLeads ?? 0 },
    ...(me.isStaff ? [{ href: '/portal/approvals', label: 'Approvals', badge: pending ?? 0 }] : []),
    ...(me.isStaff ? [{ href: '/portal/team', label: 'Agents and staff' }] : []),
    ...(me.isStaff ? [{ href: '/portal/blog', label: 'Blog' }] : []),
    ...(me.isStaff ? [{ href: '/portal/import', label: 'Import from WordPress' }] : []),
    ...(me.agent ? [{ href: '/portal/profile', label: 'My profile' }] : []),
    { href: '/portal/set-password', label: 'Change password' },
  ];

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <PortalNav items={items} name={me.agent?.fullName ?? me.fullName} roleLabel={ROLE_LABEL[me.role]} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
