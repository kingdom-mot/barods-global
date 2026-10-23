import { ApproveAgentButton, InviteCardButton, InviteForm, MemberActions, PermissionsEditor } from '@/components/portal/TeamControls';
import { isPermKey } from '@/lib/permissions';
import { adminClient } from '@/lib/supabase/admin';
import { requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Agents and permissions' };

const ROLE = { super_admin: 'Owner', admin: 'Admin', agent: 'Agent' } as const;

export default async function TeamPage() {
  const me = await requirePerm('team');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <p className="mx-auto max-w-3xl rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Add SUPABASE_SERVICE_ROLE_KEY in Vercel to manage accounts here.</p>;
  }
  const admin = adminClient();
  const [{ data: profiles }, { data: agents }, { data: authList }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at'),
    admin.from('agents').select('id, profile_id, slug, full_name, email, position, photo_url, phone, verified, status'),
    admin.auth.admin.listUsers({ perPage: 500 }),
  ]);
  const authById = new Map((authList?.users ?? []).map((u) => [u.id, u]));
  const cardByProfile = new Map((agents ?? []).filter((a) => a.profile_id).map((a) => [a.profile_id, a]));
  const cardsWithoutLogin = (agents ?? []).filter((a) => !a.profile_id && a.status !== 'suspended');
  // Owner first, then admins, then agents, by name.
  const order = { super_admin: 0, admin: 1, agent: 2 } as Record<string, number>;
  const people = [...(profiles ?? [])].sort((a, b) => order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="mb-2 font-display text-4xl">{me.isStaff ? 'Agents and permissions' : 'Agents'}</h1>
        <p className="text-sm text-muted">
          Invite people with their @barodsglobal.com email. They get an email to set a password and land on their dashboard; their listings and
          agent card are linked automatically. The owner account can’t be suspended or removed.
        </p>
        {me.isStaff && (
          <p className="mt-2 text-sm text-muted">
            Agents only see their own listings, leads and profile. Use <strong className="text-brand-ink">Permissions</strong> on an agent’s row to let them do more,
            such as approve listings, see all leads, write blog posts or edit the website. Admins can do everything.
          </p>
        )}
      </div>

      <InviteForm allowAdmin={me.isStaff} />

      {cardsWithoutLogin.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">On the website, but not yet on the portal</h2>
          <ul className="space-y-2">
            {cardsWithoutLogin.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-white p-4">
                <div className="flex items-center gap-3">
                  {a.photo_url ? <img src={a.photo_url} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="h-11 w-11 rounded-full bg-paper" />}
                  <div>
                    <div className="font-semibold">{a.full_name}</div>
                    <div className="text-xs text-muted">{a.email} · {a.position ?? 'Agent'}</div>
                  </div>
                </div>
                <InviteCardButton agentId={a.id} name={a.full_name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Accounts ({people.length})</h2>
        <ul className="space-y-3">
          {people.map((p) => {
            const u = authById.get(p.id);
            const card = cardByProfile.get(p.id);
            const signedIn = Boolean(u?.last_sign_in_at);
            const suspended = Boolean(u?.banned_until && new Date(u.banned_until) > new Date());
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {card?.photo_url ? <img src={card.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-full bg-paper" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{card?.full_name ?? p.full_name}</span>
                      <span className={`badge ${p.role === 'agent' ? 'bg-paper text-brand-ink' : 'bg-brand-ink text-white'}`}>{ROLE[p.role as keyof typeof ROLE]}</span>
                      {suspended && <span className="badge bg-red-100 text-red-800">Suspended</span>}
                      {!signedIn && !suspended && <span className="badge bg-amber-100 text-amber-900">Invite pending</span>}
                      {card?.verified && <span className="badge bg-brand-greenLight text-brand-greenDark">Verified</span>}
                      {card?.status === 'invited' && signedIn && (
                        <span className={`badge ${card.phone && card.photo_url ? 'bg-amber-100 text-amber-900' : 'bg-paper text-muted'}`}>
                          {card.phone && card.photo_url ? 'Awaiting approval' : 'Setting up profile'}
                        </span>
                      )}
                      {p.id === me.id && <span className="text-xs text-muted">(you)</span>}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {p.email}
                      {card?.position ? ` · ${card.position}` : ''}
                      {u?.last_sign_in_at ? ` · last signed in ${new Date(u.last_sign_in_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                </div>
                <MemberActions
                  profileId={p.id}
                  agentId={card?.id ?? null}
                  role={p.role}
                  suspended={suspended}
                  signedIn={signedIn}
                  verified={Boolean(card?.verified)}
                  isOwner={p.is_owner}
                  isMe={p.id === me.id}
                  canManage={me.isStaff}
                />
                {card?.status === 'invited' && signedIn && (
                  <ApproveAgentButton agentId={card.id} name={card.full_name} ready={Boolean(card.phone && card.photo_url)} />
                )}
                {me.isStaff && p.role === 'agent' && (
                  <PermissionsEditor
                    profileId={p.id}
                    name={card?.full_name ?? p.full_name}
                    initial={((p.permissions as unknown[] | null) ?? []).filter(isPermKey)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
