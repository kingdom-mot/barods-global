'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { inviteAgentCard, inviteMember, linkAgentCard, removeMember, resendAccess, setPermissions, setRole, setSuspended, setVerified } from '@/app/portal/admin-actions';
import { PERMISSIONS, type PermKey } from '@/lib/permissions';

type Msg = { ok: boolean; text: string } | null;

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <p className={`mt-2 rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>;
}

export function InviteForm({ allowAdmin = true }: { allowAdmin?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        start(async () => {
          const r = await inviteMember({
            fullName: String(f.get('fullName')),
            email: String(f.get('email')),
            role: f.get('role') === 'admin' ? 'admin' : 'agent',
            position: String(f.get('position') ?? ''),
          });
          setMsg(r.ok ? { ok: true, text: r.message ?? 'Invite sent.' } : { ok: false, text: r.error });
          if (r.ok) form.reset();
          router.refresh();
        });
      }}
    >
      <h2 className="font-semibold sm:col-span-2">Invite someone</h2>
      <label className="label">Full name<input name="fullName" className="field" required placeholder="e.g. Adaeze Okafor" /></label>
      <label className="label">Barods email<input name="email" type="email" className="field" required placeholder="name@barodsglobal.com" /></label>
      {allowAdmin ? (
        <label className="label">
          Role
          <select name="role" className="field" defaultValue="agent">
            <option value="agent">Agent: own listings and leads (add permissions after)</option>
            <option value="admin">Admin: everything, including approvals</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="role" value="agent" />
      )}
      <label className="label">Position (optional)<input name="position" className="field" placeholder="Property Consultant" /></label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Sending invite…' : 'Send invite'}</button>
        <Note msg={msg} />
      </div>
    </form>
  );
}

export function MemberActions({
  profileId,
  agentId,
  role,
  suspended,
  signedIn,
  verified,
  isOwner,
  isMe,
  canManage = true,
}: {
  profileId: string;
  agentId: string | null;
  role: string;
  suspended: boolean;
  signedIn: boolean;
  verified: boolean;
  isOwner: boolean;
  isMe: boolean;
  /** Admins can change roles, suspend and remove; people with only the Invite agents permission can't. */
  canManage?: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error ?? 'Something went wrong.' });
      router.refresh();
    });
  };
  const btn = 'rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-green hover:text-brand-greenDark disabled:opacity-50';

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        {!signedIn && <button type="button" className={btn} disabled={pending} onClick={() => run(() => resendAccess(profileId, 'invite'))}>Resend invite</button>}
        {signedIn && <button type="button" className={btn} disabled={pending} onClick={() => run(() => resendAccess(profileId, 'recovery'))}>Send password reset</button>}
        {agentId && (
          <button type="button" className={btn} disabled={pending} onClick={() => run(() => setVerified(agentId, !verified))}>
            {verified ? 'Remove verified badge' : 'Mark verified'}
          </button>
        )}
        {canManage && !isOwner && !isMe && (
          <>
            <button type="button" className={btn} disabled={pending} onClick={() => run(() => setRole(profileId, role === 'admin' ? 'agent' : 'admin'))}>
              {role === 'admin' ? 'Make agent' : 'Make admin'}
            </button>
            <button
              type="button"
              className={btn}
              disabled={pending}
              onClick={() => run(() => setSuspended(profileId, !suspended), suspended ? undefined : 'Suspend this account? They won’t be able to sign in, and their card is hidden from the Agents page.')}
            >
              {suspended ? 'Reactivate' : 'Suspend'}
            </button>
            <button
              type="button"
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              disabled={pending}
              onClick={() => run(() => removeMember(profileId), 'Remove this person from the portal? This deletes their login. Their listings stay on the site for you to reassign.')}
            >
              Remove
            </button>
          </>
        )}
      </div>
      <Note msg={msg} />
    </div>
  );
}

export function InviteCardButton({ agentId, name }: { agentId: string; name: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        type="button"
        className="btn-green min-h-[36px] px-4 text-xs"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await inviteAgentCard(agentId);
            setMsg(r.ok ? { ok: true, text: r.message ?? `Invite sent to ${name}.` } : { ok: false, text: r.error });
            router.refresh();
          })
        }
      >
        {pending ? 'Sending…' : 'Send portal invite'}
      </button>
      <Note msg={msg} />
    </div>
  );
}

/** Tick what an agent may do beyond their own listings, leads and profile. */
export function PermissionsEditor({ profileId, name, initial }: { profileId: string; name: string; initial: PermKey[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<PermKey[]>(initial);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const changed = sel.length !== initial.length || sel.some((k) => !initial.includes(k));
  const toggle = (k: PermKey) => setSel((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const first = name.replace(/^ESV\s+/, '').split(' ')[0];

  return (
    <div className="w-full border-t border-line pt-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left text-sm">
        <span>
          <span className="font-semibold">Permissions</span>{' '}
          <span className="text-muted">
            {initial.length
              ? `· own work + ${initial.map((k) => PERMISSIONS.find((p) => p.key === k)?.label).join(', ')}`
              : '· own listings, leads and profile only'}
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-brand-greenDark">{open ? 'Close' : 'Edit'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">{first} can always manage their own listings, their own leads and their profile. Tick anything extra they should be able to do.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors ${sel.includes(p.key) ? 'border-brand-green bg-brand-greenLight/50' : 'border-line hover:border-brand-green'}`}>
                <input type="checkbox" checked={sel.includes(p.key)} onChange={() => toggle(p.key)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green" />
                <span>
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block text-xs text-muted">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-green min-h-[36px] px-5 text-xs"
              disabled={pending || !changed}
              onClick={() =>
                start(async () => {
                  const r = await setPermissions(profileId, sel);
                  setMsg(r.ok ? { ok: true, text: r.message ?? 'Saved.' } : { ok: false, text: r.error });
                  router.refresh();
                })
              }
            >
              {pending ? 'Saving…' : 'Save permissions'}
            </button>
            {changed && !pending && <button type="button" className="text-xs text-muted hover:text-brand-ink" onClick={() => setSel(initial)}>Undo changes</button>}
          </div>
          <Note msg={msg} />
        </div>
      )}
    </div>
  );
}

/** Join a login to the website card that's really theirs (moves listings and leads, removes the extra card). */
export function LinkCardControl({ profileId, name, cards, hidden }: { profileId: string; name: string; cards: { id: string; name: string }[]; hidden: boolean }) {
  const router = useRouter();
  const [cardId, setCardId] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <div className={`w-full rounded-lg p-3 text-sm ${hidden ? 'bg-amber-50' : 'bg-paper'}`}>
      {hidden && (
        <p className="mb-2 text-amber-900">
          {name}’s card isn’t on the website yet, so their listings won’t show on a public profile. If they already have a card on the website, link it here.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`card-${profileId}`}>Website card</label>
        <select id={`card-${profileId}`} className="field h-9 max-w-xs py-1 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
          <option value="">Link to an existing website card…</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          className="btn-green min-h-[36px] px-4 text-xs"
          disabled={!cardId || pending}
          onClick={() => {
            const card = cards.find((c) => c.id === cardId);
            if (!card || !confirm(`Link ${name}’s login to the “${card.name}” website card? Their listings and leads move to that card.`)) return;
            start(async () => {
              const r = await linkAgentCard(profileId, cardId);
              setMsg(r.ok ? { ok: true, text: r.message ?? 'Linked.' } : { ok: false, text: r.error });
              router.refresh();
            });
          }}
        >
          {pending ? 'Linking…' : 'Link'}
        </button>
      </div>
      <Note msg={msg} />
    </div>
  );
}
