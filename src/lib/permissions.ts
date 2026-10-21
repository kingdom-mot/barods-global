/**
 * Extra things an admin can let a person do in the portal. Plain data, used on the server and in the browser.
 * Admins and the owner can do everything. Agents start with only their own listings, leads and profile.
 */
export const PERMISSIONS = [
  {
    key: 'listings',
    label: 'Manage all listings',
    description: 'See and edit every listing, approve or send back submissions, publish directly, feature and archive listings.',
  },
  { key: 'leads', label: 'See all leads', description: 'See and update every enquiry, not just the ones for their own listings.' },
  { key: 'blog', label: 'Blog', description: 'Write, edit and publish blog posts.' },
  {
    key: 'website',
    label: 'Website content',
    description: 'Homepage, contact details, team, partners, services, locations, mortgage and exchange rates, who gets lead copies.',
  },
  {
    key: 'team',
    label: 'Invite agents',
    description: 'Invite new agents, resend invites and password links, mark agents verified. Can’t change roles or permissions.',
  },
  { key: 'activity', label: 'Activity log', description: 'See who changed what in the portal.' },
] as const;

export type PermKey = (typeof PERMISSIONS)[number]['key'];
export const PERM_KEYS = PERMISSIONS.map((p) => p.key) as PermKey[];
export const isPermKey = (v: unknown): v is PermKey => PERM_KEYS.includes(v as PermKey);
